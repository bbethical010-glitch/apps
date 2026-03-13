import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HardDrive,
  FolderOpen,
  Share2,
  Upload as UploadIcon,
  Activity,
  Settings,
  Search,
  ChevronRight,
  Folder,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  Download,
  Trash2,
  X,
  Plus,
  Copy,
  QrCode,
  ChevronUp,
  ChevronDown,
  Eye,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner";
import { useEffect, useMemo, useRef } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8787").replace(/\/$/, "");
const STATUS_POLL_MS = Number.parseInt(import.meta.env.VITE_STATUS_POLL_MS || "5000", 10);

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex += 1;
  } while (value >= 1024 && unitIndex < units.length - 1);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatGigabytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "--";
  return `${(bytes / 1024 ** 3).toFixed(bytes >= 1024 ** 3 * 100 ? 0 : 1)} GB`;
}

function joinApiUrl(apiBaseUrl: string, pathname: string, searchParams?: Record<string, string>) {
  const url = new URL(`${apiBaseUrl}${pathname}`);
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }
  return url.toString();
}


type SortField = "name" | "size" | "type" | "modified";

interface FileItem {
  name: string;
  type: "file" | "directory";
  size: number;
  modifiedAt: string;
  path: string;
}

interface UploadState {
  name: string;
  size: string;
  progress: number;
  speed: string;
  status: "uploading" | "complete" | "error";
  loadedBytes?: number;
  totalBytes?: number;
}

interface SystemStatus {
  connection: "checking" | "online" | "ssd-offline" | "mac-offline";
  host: { hostname: string; platform: string; arch: string } | null;
  storageUsage: { usedBytes: number; totalBytes: number } | null;
  latencyMs: number | null;
}

export function WebConsole() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showUploadPanel, setShowUploadPanel] = useState(true);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Live Data State
  const [currentPath, setCurrentPath] = useState("");
  const [listing, setListing] = useState<{ currentPath: string; parentPath: string; items: FileItem[] }>({
    currentPath: "",
    parentPath: "",
    items: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [status, setStatus] = useState<SystemStatus>({
    connection: "checking",
    host: null,
    storageUsage: null,
    latencyMs: null
  });
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [actionBusy, setActionBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // System Status Polling
  useEffect(() => {
    let cancelled = false;
    async function fetchStatus() {
      const startedAt = performance.now();
      try {
        const response = await fetch(`${API_BASE_URL}/api/status`);
        const payload = await response.json();
        const latencyMs = Math.round(performance.now() - startedAt);
        if (cancelled) return;
        setStatus({
          connection: payload.storage === "online" ? "online" : "ssd-offline",
          host: payload.host,
          storageUsage: payload.storageUsage,
          latencyMs
        });
      } catch (err) {
        if (!cancelled) {
          setStatus((prev: SystemStatus) => ({ ...prev, connection: "mac-offline" }));
        }
      }
    }
    fetchStatus();
    const intervalId = window.setInterval(fetchStatus, STATUS_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  // File Listing
  useEffect(() => {
    let cancelled = false;
    async function fetchListing() {
      setLoading(true);
      try {
        const response = await fetch(joinApiUrl(API_BASE_URL, "/api/files", { path: currentPath }));
        const payload = await response.json();
        if (cancelled) return;
        if (!response.ok) throw new Error(payload.message || "Unable to load files");
        setListing(payload);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchListing();
    return () => { cancelled = true; };
  }, [currentPath, refreshKey]);

  const breadcrumbs = useMemo(() => {
    if (!listing.currentPath) return [{ label: "Root", path: "" }];
    const segments = listing.currentPath.split("/").filter(Boolean);
    return [{ label: "Root", path: "" }].concat(
      segments.map((segment: string, index: number) => ({
        label: segment,
        path: segments.slice(0, index + 1).join("/")
      }))
    );
  }, [listing.currentPath]);

  const storagePercent = useMemo(() => {
    if (!status.storageUsage?.totalBytes) return 0;
    return Math.round((status.storageUsage.usedBytes / status.storageUsage.totalBytes) * 100);
  }, [status.storageUsage]);

  const uploadFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    setActionBusy(true);
    setShowUploadPanel(true);

    const newUploads = files.map(f => ({
      name: f.name,
      size: formatBytes(f.size),
      progress: 0,
      speed: "...",
      status: "uploading" as const
    }));
    setUploads(prev => [...newUploads, ...prev]);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        const relativeName = (file as any).webkitRelativePath || file.name;
        formData.append(`file:${relativeName}`, file, file.name);
      });

      const xhr = new XMLHttpRequest();
      xhr.open("POST", joinApiUrl(API_BASE_URL, "/api/upload", { path: listing.currentPath }));

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploads(prev => prev.map(u => 
            files.some(f => f.name === u.name) ? { ...u, progress: percent } : u
          ));
        }
      });

      xhr.addEventListener("load", () => {
        setUploads((prev: UploadState[]) => prev.map((u: UploadState) => 
          files.some(f => f.name === u.name) ? { ...u, progress: 100, status: "complete" } : u
        ));
        setRefreshKey((v: number) => v + 1);
        toast.success("Upload complete");
      });

      xhr.onerror = () => {
        setUploads((prev: UploadState[]) => prev.map((u: UploadState) => 
          files.some(f => f.name === u.name) ? { ...u, status: "error" } : u
        ));
        toast.error("Upload failed");
      };

      xhr.send(formData);
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setActionBusy(false);
    }
  };

  const removeItem = async (itemPath: string) => {
    setActionBusy(true);
    try {
      const response = await fetch(joinApiUrl(API_BASE_URL, "/api/files", { path: itemPath }), {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Delete failed");
      setRefreshKey((v: number) => v + 1);
      toast.success("Item removed");
    } catch (err) {
      toast.error("Failed to delete item");
    } finally {
      setActionBusy(false);
    }
  };

  const createFolder = async (name: string) => {
    if (!name.trim()) return;
    setActionBusy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mkdir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: listing.currentPath, name: name.trim() })
      });
      if (!response.ok) throw new Error("Folder creation failed");
      setRefreshKey((v: number) => v + 1);
      toast.success("Folder created");
    } catch (err) {
      toast.error("Failed to create folder");
    } finally {
      setActionBusy(false);
    }
  };

  const getFileIcon = (type: string, name?: string) => {
    if (type === "directory") return <Folder className="w-4 h-4 text-primary" />;
    
    const ext = name?.split('.').pop()?.toLowerCase() || "";
    switch (ext) {
      case "txt":
      case "pdf":
      case "doc":
      case "docx":
        return <FileText className="w-4 h-4 text-accent" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "svg":
        return <Image className="w-4 h-4 text-highlight" />;
      case "mp4":
      case "mov":
      case "avi":
        return <Film className="w-4 h-4 text-[#F59E0B]" />;
      case "mp3":
      case "wav":
      case "ogg":
        return <Music className="w-4 h-4 text-accent" />;
      case "zip":
      case "rar":
      case "7z":
      case "tar":
      case "gz":
        return <Archive className="w-4 h-4 text-muted-foreground" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText("https://easy-cloud-x7k9m.relay.io/share/abc123def456");
    toast.success("Share link copied to clipboard");
  };

  const selectedFileData = listing.items.find((f: FileItem) => f.name === selectedFile);

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Three-Pane Finder Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 bg-card border-r border-border flex flex-col shadow-sm">
          <div className="px-4 py-3.5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <HardDrive className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Easy Cloud</h2>
                <p className="text-xs text-muted-foreground font-mono">{status.host?.hostname || "..."}</p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 px-2 py-3">
            <div className="space-y-0.5">
              <Button
                variant="secondary"
                className="w-full justify-start gap-2.5 h-8 text-sm font-normal"
              >
                <FolderOpen className="w-4 h-4" />
                Drive
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2.5 h-8 text-sm font-normal">
                <Share2 className="w-4 h-4" />
                Shared Links
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2.5 h-8 text-sm font-normal">
                <UploadIcon className="w-4 h-4" />
                Uploads
                {uploads.length > 0 && (
                  <Badge className="ml-auto bg-primary/20 text-primary border-primary/30 text-xs px-1.5 py-0">
                    {uploads.length}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2.5 h-8 text-sm font-normal">
                <Activity className="w-4 h-4" />
                Activity
              </Button>
            </div>

            <div className="h-px bg-border my-3"></div>

            <div className="px-2 mb-2">
              <h4 className="text-xs font-medium text-muted-foreground">Storage</h4>
            </div>
            <div className="px-2">
              <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Used</span>
                  <span className="text-xs font-mono text-foreground">{formatGigabytes(status.storageUsage?.usedBytes)} / {formatGigabytes(status.storageUsage?.totalBytes)}</span>
                </div>
                <Progress value={storagePercent} className="h-1 mb-1.5" />
                <div className="text-xs text-muted-foreground">{storagePercent}% full</div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-border">
            <Button variant="ghost" className="w-full justify-start gap-2.5 h-8 text-sm font-normal" size="sm">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 flex flex-col border-r border-border bg-background">
          {/* Toolbar */}
          <div className="h-14 border-b border-border bg-card/50 flex items-center justify-between px-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto">
                {breadcrumbs.map((crumb, idx) => (
                  <div key={crumb.path} className="flex items-center">
                    {idx > 0 && <ChevronRight className="w-3 h-3 mx-1" />}
                    <button 
                      onClick={() => setCurrentPath(crumb.path)}
                      className={`hover:text-foreground transition-colors font-mono whitespace-nowrap ${idx === breadcrumbs.length - 1 ? 'text-foreground' : ''}`}
                    >
                      {crumb.label}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm bg-background/50 border-border"
                />
              </div>

              <Button onClick={() => setShowUploadDialog(true)} className="gap-2 bg-primary h-8 text-sm" size="sm">
                <UploadIcon className="w-3.5 h-3.5" />
                Upload
              </Button>
              <Button 
                onClick={() => {
                  const name = prompt("Enter folder name:");
                  if (name) createFolder(name);
                }} 
                variant="outline" className="gap-2 h-8 text-sm" size="sm"
              >
                <Plus className="w-3.5 h-3.5" />
                New Folder
              </Button>
            </div>
          </div>

          {/* Column Headers */}
          <div className="h-9 bg-card/30 border-b border-border flex items-center px-4 text-xs font-medium text-muted-foreground">
            <button
              onClick={() => handleSort("name")}
              className="flex items-center gap-1 hover:text-foreground transition-colors flex-1"
            >
              Name
              <SortIndicator field="name" />
            </button>
            <button
              onClick={() => handleSort("modified")}
              className="flex items-center gap-1 hover:text-foreground transition-colors w-36"
            >
              Date Modified
              <SortIndicator field="modified" />
            </button>
            <button
              onClick={() => handleSort("type")}
              className="flex items-center gap-1 hover:text-foreground transition-colors w-32"
            >
              Type
              <SortIndicator field="type" />
            </button>
            <button
              onClick={() => handleSort("size")}
              className="flex items-center gap-1 hover:text-foreground transition-colors w-24"
            >
              Size
              <SortIndicator field="size" />
            </button>
            <div className="w-24"></div>
          </div>

          {/* File Rows */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Activity className="w-8 h-8 text-primary animate-pulse" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 gap-2">
                <X className="w-8 h-8 text-destructive" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={() => setRefreshKey((v: number) => v + 1)}>Retry</Button>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
              {listing.items.map((file, index) => (
                <motion.button
                  key={file.path}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  onClick={() => setSelectedFile(file.name)}
                  onDoubleClick={() => file.type === "directory" && setCurrentPath(file.path)}
                  className={`w-full flex items-center px-4 py-2 text-left hover:bg-card/50 transition-colors ${
                    selectedFile === file.name ? "bg-primary/10" : ""
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {getFileIcon(file.type, file.name)}
                    <span className="text-sm text-foreground truncate">{file.name}</span>
                  </div>
                  <div className="w-36 text-xs text-muted-foreground">{new Date(file.modifiedAt).toLocaleDateString()}</div>
                  <div className="w-32 text-xs text-muted-foreground">{file.type}</div>
                  <div className="w-24 text-xs font-mono text-muted-foreground">{file.type === "file" ? formatBytes(file.size) : "--"}</div>
                  <div className="w-24 flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setShowShareDialog(true); }}>
                      <Share2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); removeItem(file.path); }}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </ScrollArea>
        </div>

        {/* Preview Panel */}
        <div className="w-72 bg-card border-l border-border flex flex-col shadow-sm">
          <div className="px-4 py-3.5 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Preview</h3>
          </div>

          {selectedFileData ? (
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Preview Image Placeholder */}
                <div className="aspect-square bg-background rounded-lg border border-border flex items-center justify-center">
                  {getFileIcon(selectedFileData.type, selectedFileData.name)}
                </div>

                {/* File Details */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1 truncate">
                      {selectedFileData.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">{selectedFileData.type}</p>
                  </div>

                  <div className="h-px bg-border"></div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Size</span>
                      <span className="text-xs font-mono text-foreground">{selectedFileData.type === "file" ? formatBytes(selectedFileData.size) : "--"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Modified</span>
                      <span className="text-xs text-foreground">{new Date(selectedFileData.modifiedAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="h-px bg-border"></div>

                  <div className="space-y-2">
                    {selectedFileData.type === "file" && (
                      <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2 h-8 text-xs">
                        <a href={joinApiUrl(API_BASE_URL, "/api/download", { path: selectedFileData.path })}>
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-8 text-xs" onClick={() => setShowShareDialog(true)}>
                      <Share2 className="w-3.5 h-3.5" />
                      Share
                    </Button>
                    <Button 
                      variant="outline" size="sm" 
                      className="w-full justify-start gap-2 h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => removeItem(selectedFileData.path)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 text-center">
              <div>
                <Eye className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Select a file to preview</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Panel (Bottom) */}
      <AnimatePresence>
        {showUploadPanel && uploads.length > 0 && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="border-t border-border bg-card shadow-lg overflow-hidden"
          >
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <UploadIcon className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">
                  Uploading {uploads.length} {uploads.length === 1 ? "file" : "files"}
                </h3>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowUploadPanel(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="px-4 py-3 space-y-2 max-h-48 overflow-y-auto">
              {uploads.map((upload, index) => (
                <div key={`${upload.name}-${index}`} className="flex items-center gap-3">
                  <div className="p-1.5 bg-primary/10 rounded">
                    <UploadIcon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground truncate">{upload.name}</span>
                      <span className="text-xs text-muted-foreground font-mono ml-2">{upload.progress}%</span>
                    </div>
                    <Progress value={upload.progress} className="h-1" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Upload Files</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-card/50 transition-colors cursor-pointer">
              <UploadIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <div className="text-sm text-foreground mb-1">
                Drop files here or click to browse
              </div>
              <div className="text-xs text-muted-foreground">
                Maximum file size: 2GB
              </div>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => { uploadFiles(e.target.files); setShowUploadDialog(false); }}
                className="hidden"
              />
              <Button className="flex-1 bg-primary h-9 text-sm" onClick={() => fileInputRef.current?.click()}>
                Select Files
              </Button>
              <Button variant="outline" className="flex-1 h-9 text-sm" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Share File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Share Link</Label>
              <div className="flex gap-2">
                <Input
                  value="https://easy-cloud-x7k9m.relay.io/share/abc123def456"
                  readOnly
                  className="font-mono text-xs bg-background/50 h-9"
                />
                <Button variant="outline" size="icon" onClick={copyShareLink} className="h-9 w-9">
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="h-px bg-border"></div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm text-foreground">Password Protection</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Require password to access</p>
              </div>
              <Switch />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Link Expiration</Label>
              <Select defaultValue="never">
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="h-px bg-border"></div>

            <div className="flex gap-2">
              <Button className="flex-1 bg-primary h-9 text-sm" onClick={copyShareLink}>
                <Copy className="w-3.5 h-3.5 mr-2" />
                Copy Link
              </Button>
              <Button variant="outline" className="gap-2 h-9 text-sm">
                <QrCode className="w-3.5 h-3.5" />
                QR Code
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

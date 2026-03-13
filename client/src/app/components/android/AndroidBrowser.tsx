import { Link } from "react-router";
import { motion } from "motion/react";
import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Upload,
  FolderPlus,
  LayoutGrid,
  List,
  Search,
  Folder,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  MoreVertical,
  Server,
  FolderOpen,
  Activity,
  SlidersHorizontal,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const mockFiles = [
  {
    name: "Photos",
    type: "folder",
    size: "2.4 GB",
    items: 342,
    modified: "2 hours ago",
  },
  {
    name: "Documents",
    type: "folder",
    size: "456 MB",
    items: 89,
    modified: "1 day ago",
  },
  {
    name: "Videos",
    type: "folder",
    size: "12.8 GB",
    items: 24,
    modified: "3 days ago",
  },
  {
    name: "Music",
    type: "folder",
    size: "3.2 GB",
    items: 156,
    modified: "1 week ago",
  },
  {
    name: "project-report.pdf",
    type: "file",
    size: "2.4 MB",
    modified: "Today",
    icon: "document",
  },
  {
    name: "vacation-2024.zip",
    type: "file",
    size: "145 MB",
    modified: "Yesterday",
    icon: "archive",
  },
  {
    name: "presentation.mp4",
    type: "file",
    size: "89 MB",
    modified: "2 days ago",
    icon: "video",
  },
  {
    name: "cover-image.png",
    type: "file",
    size: "4.2 MB",
    modified: "3 days ago",
    icon: "image",
  },
];

export function AndroidBrowser() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");

  const getFileIcon = (item: (typeof mockFiles)[0]) => {
    if (item.type === "folder") {
      return <Folder className="w-4 h-4 text-primary" />;
    }
    switch (item.icon) {
      case "document":
        return <FileText className="w-4 h-4 text-accent" />;
      case "image":
        return <Image className="w-4 h-4 text-highlight" />;
      case "video":
        return <Film className="w-4 h-4 text-[#F59E0B]" />;
      case "audio":
        return <Music className="w-4 h-4 text-accent" />;
      case "archive":
        return <Archive className="w-4 h-4 text-muted-foreground" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const filteredFiles = mockFiles.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Toolbar */}
      <div className="bg-card/95 border-b border-border sticky top-0 z-10 backdrop-blur-lg shadow-sm">
        <div className="max-w-md mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between mb-2.5">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 h-8 text-sm">
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </Button>
            </Link>
            <h2 className="text-sm font-semibold text-foreground">Storage Browser</h2>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
                className={`h-8 w-8 ${viewMode === "list" ? "text-primary bg-primary/10" : ""}`}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={`h-8 w-8 ${viewMode === "grid" ? "text-primary bg-primary/10" : ""}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm bg-background/50 border-border"
            />
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-md mx-auto px-4 py-2.5 bg-card/30 border-b border-border/50">
        <div className="flex items-center gap-1.5 text-xs">
          <Home className="w-3.5 h-3.5 text-muted-foreground" />
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-foreground font-mono">Root</span>
        </div>
      </div>

      {/* File List */}
      <div className="max-w-md mx-auto px-4 py-3">
        {viewMode === "list" ? (
          <div className="space-y-1">
            {filteredFiles.map((file, index) => (
              <motion.div
                key={file.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: index * 0.03 }}
                className="p-3 hover:bg-card/50 transition-colors cursor-pointer rounded-lg border border-transparent hover:border-border"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-background rounded-md">
                    {getFileIcon(file)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono">{file.size}</span>
                      {file.type === "folder" && (
                        <>
                          <span>•</span>
                          <span>{file.items} items</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{file.modified}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredFiles.map((file, index) => (
              <motion.div
                key={file.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15, delay: index * 0.03 }}
                className="p-3 hover:bg-card/50 transition-colors cursor-pointer rounded-lg border border-transparent hover:border-border"
              >
                <div className="flex flex-col gap-2">
                  <div className="p-3 bg-background rounded-lg w-full aspect-square flex items-center justify-center">
                    {React.cloneElement(getFileIcon(file), {
                      className: "w-8 h-8",
                    })}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-medium text-foreground truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {file.size}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Storage Summary */}
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Total Items</div>
              <div className="text-base font-mono text-foreground mt-0.5">
                1,247 files
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Used Space</div>
              <div className="text-base font-mono text-primary mt-0.5">
                245 GB
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4 flex flex-col gap-2">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="icon"
            className="w-11 h-11 rounded-full bg-card border border-border shadow-lg"
          >
            <FolderPlus className="w-4.5 h-4.5 text-foreground" />
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="icon"
            className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 shadow-xl"
          >
            <Upload className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border shadow-lg">
        <div className="max-w-md mx-auto px-5 py-3">
          <div className="flex justify-around">
            <Link
              to="/"
              className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Server className="w-4.5 h-4.5" />
              <span className="text-xs">Dashboard</span>
            </Link>
            <Link
              to="/browser"
              className="flex flex-col items-center gap-1 text-primary"
            >
              <FolderOpen className="w-4.5 h-4.5" />
              <span className="text-xs">Browser</span>
            </Link>
            <Link
              to="/settings"
              className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Activity className="w-4.5 h-4.5" />
              <span className="text-xs">Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
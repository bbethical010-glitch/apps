import { Link } from "react-router";
import { motion } from "motion/react";
import {
  Server,
  HardDrive,
  Link2,
  ExternalLink,
  Copy,
  FolderOpen,
  Activity,
  Wifi,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { useState } from "react";
import { toast } from "sonner";

export function AndroidDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const storageUsed = 245;
  const storageTotal = 512;
  const usagePercent = (storageUsed / storageTotal) * 100;

  const copyPublicUrl = () => {
    navigator.clipboard.writeText("https://easy-cloud-x7k9m.relay.io");
    toast.success("Public URL copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card/50 border-b border-border/50 shadow-sm">
        <div className="max-w-md mx-auto px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Easy Storage Cloud
              </h1>
              <p className="text-xs text-muted-foreground">
                Mobile Gateway Server
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 py-5 space-y-3">
        {/* Node Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="p-4 bg-card border border-border shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-accent/10 rounded-md">
                  <Activity className="w-3.5 h-3.5 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">Node Status</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Gateway running
                  </p>
                </div>
              </div>
              <Badge
                className={`${
                  isOnline
                    ? "bg-accent/15 text-accent border-accent/40 text-xs"
                    : "bg-destructive/15 text-destructive border-destructive/40 text-xs"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <motion.div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOnline ? "bg-accent" : "bg-destructive"
                    }`}
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {isOnline ? "Online" : "Offline"}
                </div>
              </Badge>
            </div>

            <div className="h-px bg-border/60 my-3"></div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  Uptime
                </div>
                <div className="font-mono text-sm text-foreground">
                  12h 34m
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  Latency
                </div>
                <div className="font-mono text-sm text-accent">24ms</div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Storage Device Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <Card className="p-4 bg-card border border-border shadow-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-1.5 bg-primary/10 rounded-md">
                <HardDrive className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Storage Device
                </h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  SanDisk Ultra USB 3.0
                </p>
              </div>
            </div>

            <div className="h-px bg-border/60 my-3"></div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Used Space</span>
                  <span className="font-mono text-foreground">
                    {storageUsed} GB / {storageTotal} GB
                  </span>
                </div>
                <Progress value={usagePercent} className="h-1.5" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 text-center">
                  <div className="text-xs text-muted-foreground">Read</div>
                  <div className="font-mono text-xs text-primary">
                    150 MB/s
                  </div>
                </div>
                <div className="space-y-1 text-center">
                  <div className="text-xs text-muted-foreground">Write</div>
                  <div className="font-mono text-xs text-primary">
                    90 MB/s
                  </div>
                </div>
                <div className="space-y-1 text-center">
                  <div className="text-xs text-muted-foreground">Files</div>
                  <div className="font-mono text-xs text-foreground">
                    1,247
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Relay Connection Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <Card className="p-4 bg-card border border-border shadow-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-1.5 bg-highlight/10 rounded-md">
                <Wifi className="w-3.5 h-3.5 text-highlight" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Relay Connection
                </h3>
                <p className="text-xs text-muted-foreground">
                  Tunnel established
                </p>
              </div>
            </div>

            <div className="h-px bg-border/60 my-3"></div>

            <div className="space-y-2.5">
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">
                  Node Code
                </div>
                <div className="font-mono text-xs text-foreground">
                  x7k9m-cloud-node
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1.5">
                  Public URL
                </div>
                <div className="font-mono text-xs text-primary break-all">
                  https://easy-cloud-x7k9m.relay.io
                </div>
              </div>

              <Button
                onClick={copyPublicUrl}
                className="w-full bg-primary hover:bg-primary/90 shadow-sm"
                size="sm"
              >
                <Copy className="w-3.5 h-3.5 mr-2" />
                Copy Access Link
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
        >
          <h3 className="text-xs font-medium text-muted-foreground mb-2.5 px-0.5">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <Link to="/console">
              <Card className="p-3.5 hover:bg-card/80 transition-all cursor-pointer border border-border shadow-sm hover:shadow">
                <ExternalLink className="w-4 h-4 text-primary mb-2" />
                <div className="text-sm font-medium text-foreground">
                  Web Console
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Open dashboard
                </div>
              </Card>
            </Link>

            <Link to="/browser">
              <Card className="p-3.5 hover:bg-card/80 transition-all cursor-pointer border border-border shadow-sm hover:shadow">
                <FolderOpen className="w-4 h-4 text-accent mb-2" />
                <div className="text-sm font-medium text-foreground">
                  Browse Files
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Local explorer
                </div>
              </Card>
            </Link>

            <Link to="/onboarding">
              <Card className="p-3.5 hover:bg-card/80 transition-all cursor-pointer border border-border shadow-sm hover:shadow">
                <Activity className="w-4 h-4 text-highlight mb-2" />
                <div className="text-sm font-medium text-foreground">
                  Quick Setup
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Tutorial guide
                </div>
              </Card>
            </Link>

            <Card className="p-3.5 hover:bg-card/80 transition-all cursor-pointer border border-border shadow-sm hover:shadow">
              <Link2 className="w-4 h-4 text-highlight mb-2" />
              <div className="text-sm font-medium text-foreground">
                Share Link
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Generate URL
              </div>
            </Card>
          </div>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border shadow-lg">
        <div className="max-w-md mx-auto px-5 py-3">
          <div className="flex justify-around">
            <Link
              to="/"
              className="flex flex-col items-center gap-1 text-primary"
            >
              <Server className="w-4.5 h-4.5" />
              <span className="text-xs">Dashboard</span>
            </Link>
            <Link
              to="/browser"
              className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
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

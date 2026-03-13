import { Link } from "react-router";
import { motion } from "motion/react";
import {
  ChevronLeft,
  Server,
  Wifi,
  Globe,
  Upload,
  FileText,
  Activity,
  FolderOpen,
  Copy,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useState } from "react";

export function AndroidSettings() {
  const [autoStart, setAutoStart] = useState(true);
  const [lanAccess, setLanAccess] = useState(false);
  const [uploadLimit, setUploadLimit] = useState("100");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card/95 border-b border-border sticky top-0 z-10 backdrop-blur-lg shadow-sm">
        <div className="max-w-md mx-auto px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="w-4.5 h-4.5" />
              </Button>
            </Link>
            <h2 className="text-base font-semibold text-foreground">Settings</h2>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Relay Server Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="text-xs font-medium text-muted-foreground mb-2.5 px-0.5">
            Relay Server
          </h3>
          <Card className="p-4 bg-card border border-border shadow-sm space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Node Code
              </Label>
              <div className="flex gap-2">
                <Input
                  value="x7k9m-cloud-node"
                  readOnly
                  className="font-mono text-sm bg-background h-9"
                />
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="h-px bg-border"></div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Public URL
              </Label>
              <div className="flex gap-2">
                <Input
                  value="https://easy-cloud-x7k9m.relay.io"
                  readOnly
                  className="font-mono text-xs bg-background text-primary h-9"
                />
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="h-px bg-border"></div>

            <div className="flex items-center justify-between py-1">
              <div>
                <Label className="text-sm text-foreground">
                  LAN Access Only
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Disable relay tunnel
                </p>
              </div>
              <Switch checked={lanAccess} onCheckedChange={setLanAccess} />
            </div>
          </Card>
        </motion.div>

        {/* Node Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <h3 className="text-xs font-medium text-muted-foreground mb-2.5 px-0.5">
            Node Configuration
          </h3>
          <Card className="p-4 bg-card border border-border shadow-sm space-y-3">
            <div className="flex items-center justify-between py-1">
              <div>
                <Label className="text-sm text-foreground">Auto Start</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Start node on device boot
                </p>
              </div>
              <Switch checked={autoStart} onCheckedChange={setAutoStart} />
            </div>

            <div className="h-px bg-border"></div>

            <div>
              <Label className="text-sm text-foreground mb-2 block">
                Upload Speed Limit (MB/s)
              </Label>
              <Input
                type="number"
                value={uploadLimit}
                onChange={(e) => setUploadLimit(e.target.value)}
                className="font-mono bg-background h-9"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                0 = unlimited
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Diagnostics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <h3 className="text-xs font-medium text-muted-foreground mb-2.5 px-0.5">
            Diagnostics
          </h3>
          <Card className="p-4 bg-card border border-border shadow-sm space-y-2.5">
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-foreground">Uptime</div>
                  <div className="text-xs text-muted-foreground">
                    Server runtime
                  </div>
                </div>
              </div>
              <div className="font-mono text-sm text-foreground">12h 34m</div>
            </div>

            <div className="h-px bg-border"></div>

            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-accent/10 rounded-md">
                  <Wifi className="w-3.5 h-3.5 text-accent" />
                </div>
                <div>
                  <div className="text-sm text-foreground">Latency</div>
                  <div className="text-xs text-muted-foreground">
                    Network ping
                  </div>
                </div>
              </div>
              <div className="font-mono text-sm text-accent">24ms</div>
            </div>

            <div className="h-px bg-border"></div>

            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-highlight/10 rounded-md">
                  <Upload className="w-3.5 h-3.5 text-highlight" />
                </div>
                <div>
                  <div className="text-sm text-foreground">Data Transferred</div>
                  <div className="text-xs text-muted-foreground">
                    Total bandwidth
                  </div>
                </div>
              </div>
              <div className="font-mono text-sm text-foreground">2.4 GB</div>
            </div>

            <div className="h-px bg-border"></div>

            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-[#F59E0B]/10 rounded-md">
                  <Globe className="w-3.5 h-3.5 text-[#F59E0B]" />
                </div>
                <div>
                  <div className="text-sm text-foreground">Active Connections</div>
                  <div className="text-xs text-muted-foreground">
                    Current sessions
                  </div>
                </div>
              </div>
              <div className="font-mono text-sm text-foreground">3</div>
            </div>
          </Card>
        </motion.div>

        {/* Logs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
        >
          <h3 className="text-xs font-medium text-muted-foreground mb-2.5 px-0.5">
            System Logs
          </h3>
          <Card className="p-3.5 bg-card border border-border shadow-sm">
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex gap-2">
                <span className="text-muted-foreground">14:32:12</span>
                <span className="text-accent">[INFO]</span>
                <span className="text-foreground">Node started successfully</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">14:32:15</span>
                <span className="text-primary">[CONN]</span>
                <span className="text-foreground">Relay tunnel established</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">14:32:18</span>
                <span className="text-accent">[INFO]</span>
                <span className="text-foreground">Storage device mounted</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">14:35:42</span>
                <span className="text-primary">[HTTP]</span>
                <span className="text-foreground">GET /api/files - 200 OK</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">14:38:11</span>
                <span className="text-highlight">[UPLD]</span>
                <span className="text-foreground">document.pdf (2.4 MB)</span>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-3 h-8 text-xs" size="sm">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              View Full Logs
            </Button>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
        >
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-between h-10 text-sm">
              <span>Export Configuration</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between h-10 text-sm">
              <span>Clear Cache</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between text-destructive border-destructive/30 hover:bg-destructive/10 h-10 text-sm"
            >
              <span>Reset to Defaults</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
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
              className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <FolderOpen className="w-4.5 h-4.5" />
              <span className="text-xs">Browser</span>
            </Link>
            <Link
              to="/settings"
              className="flex flex-col items-center gap-1 text-primary"
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

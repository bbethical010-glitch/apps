import { Outlet, Link, useLocation } from "react-router";
import { Smartphone, Monitor } from "lucide-react";
import { Button } from "./ui/button";

export function Root() {
  const location = useLocation();
  const isWebConsole = location.pathname === "/console";

  return (
    <div className="min-h-screen bg-background">
      {/* View Switcher */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 bg-card/80 backdrop-blur-lg border border-border rounded-lg p-1">
        <Link to="/">
          <Button
            variant={!isWebConsole ? "default" : "ghost"}
            size="sm"
            className="gap-2"
          >
            <Smartphone className="w-4 h-4" />
            Android
          </Button>
        </Link>
        <Link to="/console">
          <Button
            variant={isWebConsole ? "default" : "ghost"}
            size="sm"
            className="gap-2"
          >
            <Monitor className="w-4 h-4" />
            Web
          </Button>
        </Link>
      </div>

      <Outlet />
    </div>
  );
}

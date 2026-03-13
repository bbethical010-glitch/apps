import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { AndroidDashboard } from "./components/android/AndroidDashboard";
import { AndroidBrowser } from "./components/android/AndroidBrowser";
import { AndroidOnboarding } from "./components/android/AndroidOnboarding";
import { AndroidSettings } from "./components/android/AndroidSettings";
import { WebConsole } from "./components/web/WebConsole";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: AndroidDashboard },
      { path: "browser", Component: AndroidBrowser },
      { path: "onboarding", Component: AndroidOnboarding },
      { path: "settings", Component: AndroidSettings },
      { path: "console", Component: WebConsole },
    ],
  },
]);

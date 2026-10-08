import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { QueryProvider } from "@news-draft/frontend/query/provider";
import "./globals.css";
export const metadata: Metadata = {
  title: "News Draft",
  description: "Read, think, and review.",
  applicationName: "News Draft",
  appleWebApp: { capable: true, title: "News Draft", statusBarStyle: "default" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import "@fontsource-variable/archivo";
import "@fontsource/ibm-plex-mono/400.css";
import { APP_NAME } from "@/lib/config";
import { NavigationFeedback } from "@/components/navigation-feedback";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — keep the receipts`, template: `%s — ${APP_NAME}` },
  description: "The fast, group-first football leaderboard. Pick who showed up, log the stats, and share the receipts.",
  icons: { icon: "/brand/favicon-dot.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body><Suspense fallback={null}><NavigationFeedback /></Suspense>{children}<SiteFooter /></body></html>;
}

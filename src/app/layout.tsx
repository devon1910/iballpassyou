import type { Metadata } from "next";
import { Suspense } from "react";
import "@fontsource-variable/archivo";
import "@fontsource/ibm-plex-mono/400.css";
import { APP_NAME } from "@/lib/config";
import { SITE_URL } from "@/lib/config";
import { NavigationFeedback } from "@/components/navigation-feedback";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${APP_NAME}: keep the receipts`, template: `%s: ${APP_NAME}` },
  description: "The fast, group-first football leaderboard. Pick who showed up, log the stats, and share the receipts.",
  icons: { icon: "/brand/favicon-dot.svg" },
  openGraph: { type: "website", siteName: APP_NAME, title: `${APP_NAME}: keep the receipts`, description: "Casual football stats, clear leaderboards, and proper receipts.", images: ["/brand/pitch-default.jpeg"] },
  twitter: { card: "summary_large_image", title: `${APP_NAME}: keep the receipts`, description: "Casual football stats, clear leaderboards, and proper receipts.", images: ["/brand/pitch-default.jpeg"] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body><Suspense fallback={null}><NavigationFeedback /></Suspense>{children}<SiteFooter /></body></html>;
}

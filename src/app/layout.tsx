import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QueueFlow — Smart Transport Queue Management",
  description: "Digital queue management system for organized, fair, and efficient public transport boarding. Multi-channel access via USSD, SMS, Web, and Agent-assisted modes.",
  keywords: ["QueueFlow", "transport", "queue management", "USSD", "public transit", "developing cities", "boarding system"],
  authors: [{ name: "QueueFlow Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "QueueFlow — Smart Transport Queue Management",
    description: "Eliminate chaotic boarding at transport pickups with digital queue management",
    siteName: "QueueFlow",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QueueFlow — Smart Transport Queue Management",
    description: "Eliminate chaotic boarding at transport pickups with digital queue management",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}

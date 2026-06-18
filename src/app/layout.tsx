import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/components/notification-provider";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Scene Co. | Influencer CRM & Campaign Management Platform",
  description: "A premium, unified CRM platform for marketing agencies to track influencer relationships, brand campaigns, payments, communications, and real-time social metrics.",
  keywords: ["Influencer CRM", "Campaign Management", "The Scene Co", "Marketing Agency Tools", "WhatsApp Outreach", "AI Influencer Score"],
  authors: [{ name: "The Scene Co. Engineering" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200">
        <ClerkProvider>
          <ThemeProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

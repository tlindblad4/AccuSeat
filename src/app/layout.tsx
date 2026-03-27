import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BackgroundBeams from "@/components/ui/BackgroundBeams";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AccuSeat - Premium Seat Views",
  description: "Experience every seat in stunning 360° detail. The future of ticket sales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.variable} font-sans relative`}>
        <BackgroundBeams className="fixed inset-0 z-0" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}

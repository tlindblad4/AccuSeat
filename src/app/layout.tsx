import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
      <body className={`${inter.variable} font-sans`}>
        {/* Background Effect */}
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
            background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 50%, #eef2ff 100%)',
          }}
        >
          {/* Blue orb top-left */}
          <div 
            className="animate-float-slow"
            style={{
              position: 'absolute',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.1) 50%, transparent 70%)',
              top: '-200px',
              left: '-100px',
              animation: 'float1 8s ease-in-out infinite',
            }}
          />
          {/* Purple orb bottom-right */}
          <div 
            style={{
              position: 'absolute',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, rgba(139, 92, 246, 0.1) 50%, transparent 70%)',
              bottom: '-150px',
              right: '-100px',
              animation: 'float2 10s ease-in-out infinite',
            }}
          />
          {/* Indigo orb center-right */}
          <div 
            style={{
              position: 'absolute',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
              top: '30%',
              right: '10%',
              animation: 'float3 6s ease-in-out infinite',
            }}
          />
          {/* Additional pink orb */}
          <div 
            style={{
              position: 'absolute',
              width: '350px',
              height: '350px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, transparent 70%)',
              bottom: '20%',
              left: '5%',
              animation: 'float4 12s ease-in-out infinite',
            }}
          />
        </div>
        
        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}

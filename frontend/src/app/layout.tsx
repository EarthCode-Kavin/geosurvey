import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const lora = Lora({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "GeoSurvey Platform — Geophysical & Geotechnical Analysis",
  description:
    "Open-source web platform for geotechnical and geophysical survey analysis integrating SimPEG and pyGIMLi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${lora.variable} antialiased`} style={{ fontFamily: "var(--font-sans), sans-serif" }}>
        <Sidebar />
        <TopBar />
        <main className="main-content">{children}</main>
      </body>
    </html>
  );
}

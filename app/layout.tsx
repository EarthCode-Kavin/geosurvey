import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "GeoSurvey Virtual Laboratory",
  description:
    "An interactive educational platform for learning geophysical and geotechnical survey methods — build ground models, run virtual surveys, interpret results.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable} antialiased min-h-screen`}>
        <Nav />
        <main>{children}</main>
        <footer className="no-print border-t border-line mt-20 py-10 text-center text-sm text-muted">
          <p>
            GeoSurvey Virtual Laboratory — open-source geoscience education.{" "}
            Physics engine validated against analytic layered-earth solutions.
          </p>
          <p className="mt-1 opacity-70">
            For teaching and training. Synthetic results are simplified and must not replace real site investigation.
          </p>
        </footer>
      </body>
    </html>
  );
}

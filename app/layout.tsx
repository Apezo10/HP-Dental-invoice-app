import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HP Dental",
  description: "Simple invoice and statement app for a dental technician"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

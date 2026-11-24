import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inbox agent",
  description: "A small Claude agent that triages a food bank's shared inbox: labels, FAQ lookups and draft replies.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

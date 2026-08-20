import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "anyfmt: convert images in your browser",
  description:
    "Convert PNG, JPEG, WebP, HEIC, TIFF and more. Fast, private, and entirely in your browser. Nothing is ever uploaded.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}

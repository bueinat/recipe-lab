import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recipe Lab",
  description: "A friendly place to experiment with simple recipes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

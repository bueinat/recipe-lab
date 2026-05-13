import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RecipeProvider } from "@/components/recipe-provider";
import { SiteHeader } from "@/components/site-header";
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

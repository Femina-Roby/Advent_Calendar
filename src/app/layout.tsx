import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Fonts live in the repo (src/fonts) so nothing is fetched at runtime or dev time.
const inter = localFont({
  src: "../fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const fraunces = localFont({
  src: [
    { path: "../fonts/fraunces-latin-wght-normal.woff2", style: "normal", weight: "100 900" },
    { path: "../fonts/fraunces-latin-wght-italic.woff2", style: "italic", weight: "100 900" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Kettuvallam Advent", template: "%s · Kettuvallam Advent" },
  description:
    "Twenty-four doors on a Kerala houseboat. A warm backwater night that slowly freezes into a snowy, lantern-lit Christmas. Open them in order, or make one for someone you love.",
  openGraph: {
    title: "Kettuvallam Advent",
    description: "Twenty-four doors on a Kerala houseboat, and a backwater that turns to winter.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070e1d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

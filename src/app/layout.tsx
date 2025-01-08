import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import localFont from "next/font/local";

const cokieeRun = localFont({
  src: "../../static/font/CookieRun-Regular.ttf",
  display: "swap",
  weight: '100 920',
  variable: "--font-cookieRun",
});

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Near Oil",
  description: "근처 가장 저렴한 주유소 TOP 20 중에 가장 효율적인 주유소를 추천",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="kr" className={`${cokieeRun.variable}`}>
      <body className={cokieeRun.className}>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "大厂策略产品搬砖狗档案馆",
  description: "大厂策略产品搬砖狗的小红书店铺配套资料库",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

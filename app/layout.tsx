import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chicken Hut | نظام الإدارة المتكامل",
  description: "Chicken Hut POS and ERP Management System for branch management, inventory, treasury and payroll.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}


import type { Metadata } from "next";
import "./globals.css";
import SyncProvider from "@/components/SyncProvider";

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
        <SyncProvider>
          {children}
        </SyncProvider>
      </body>
    </html>
  );
}


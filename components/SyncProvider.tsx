"use client";

import { useEffect } from "react";
import { startBackgroundSync } from "@/lib/sync";

export default function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Start background sync every 15 seconds
    startBackgroundSync(15);
  }, []);

  return <>{children}</>;
}

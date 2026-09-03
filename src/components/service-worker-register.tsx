"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal — app still works without the service worker, just
        // without the install-to-home-screen shell cache.
      });
    }
  }, []);
  return null;
}

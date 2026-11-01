// The classroom edition's seam into the rest of the app: the school host (SchoolHost.tsx)
// installs these, and src/io/files.ts calls them. Nothing here depends on React or Google, so
// files.ts can import it without a cycle. Without a host (the desktop app, the tests) every
// hook is absent and the app behaves exactly as before.

/** Where a delivered file went: its name, or null when the person cancelled. */
export type Delivered = { name: string } | null;

export interface SchoolHooks {
  /**
   * Take a saved or exported file (Save, Save As and every export). The classroom edition keeps
   * it in the person's Google Drive and falls back to a browser download when that fails.
   */
  deliver?: (name: string, bytes: Uint8Array, mime: string) => Promise<Delivered>;
}

export const schoolHooks: SchoolHooks = {};

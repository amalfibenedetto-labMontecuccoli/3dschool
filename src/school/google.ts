// Google sign-in and Drive for the classroom edition: sign in with the school's Google account
// (Google Identity Services), keep files in a "3D" folder of the person's Drive with the
// `drive.file` scope (the app sees only files it made), and let nobody in but the school's own
// accounts. Google's own `hd` hint only pre-selects the account, so the address is checked here.

/** The OAuth client of the school's Google Cloud project: public by design (no secret in a browser app). */
const CLIENT_ID = "941646642229-v1amlshet3qalpu0qunksu7bee83dqc9.apps.googleusercontent.com";
const SCOPE = "https://www.googleapis.com/auth/drive.file";
/** The only email domain that may sign in. */
export const SCHOOL_DOMAIN = "smpavullo.com";
export const FOLDER_NAME = "3D";
const GIS_URL = "https://accounts.google.com/gsi/client";
const FILES_URL = "https://www.googleapis.com/drive/v3/files";
const UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
/** Drive's simple upload is meant for small files; bigger ones are downloaded instead. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_OPEN_BYTES = 256 * 1024 * 1024;
const MARGIN_MS = 60_000;
const SESSION_KEY = "school3d_drive_session";

export interface Account {
  name: string;
  email: string;
}

export interface DriveEntry {
  id: string;
  name: string;
  modified: string;
}

interface Token {
  value: string;
  expiresAt: number;
  account: Account;
}

let token: Token | null = null;
let restored = false;
const listeners = new Set<() => void>();

/** Called whenever the signed-in account changes. */
export function onAccountChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function changed(): void {
  listeners.forEach((fn) => fn());
}

/** True when nobody has signed in this tab yet. */
export function driveDisabled(): boolean {
  try {
    return new URLSearchParams(location.search).has("nodrive");
  } catch {
    return false;
  }
}

function restore(): void {
  if (restored) return;
  restored = true;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const kept = JSON.parse(raw) as Token;
    if (kept && typeof kept.value === "string" && typeof kept.expiresAt === "number" && kept.account && isSchoolEmail(kept.account.email) && kept.expiresAt - MARGIN_MS > Date.now()) {
      token = kept;
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {
    /* no storage: the person signs in again */
  }
}

function keep(): void {
  try {
    if (token) sessionStorage.setItem(SESSION_KEY, JSON.stringify(token));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* per-tab convenience only */
  }
}

/** Whether `email` is an address of the school (not of a look-alike domain). */
export function isSchoolEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  const suffix = `@${SCHOOL_DOMAIN}`;
  if (!e.endsWith(suffix)) return false;
  const local = e.slice(0, -suffix.length);
  return local.length > 0 && !local.includes("@");
}

/** The signed-in account while its access is still valid. */
export function account(): Account | null {
  restore();
  return token && token.expiresAt - MARGIN_MS > Date.now() ? token.account : null;
}

/** True until somebody has signed in; after that an expired access only makes the next save ask again. */
export function needsSignIn(): boolean {
  restore();
  return token === null;
}

export function signOut(): void {
  token = null;
  keep();
  changed();
}

let gisLoading: Promise<void> | null = null;

/** Load Google's sign-in script once (call early, so the popup can open straight from a tap). */
export function preload(): Promise<void> {
  if ((window as unknown as { google?: { accounts?: { oauth2?: unknown } } }).google?.accounts?.oauth2) return Promise.resolve();
  if (!gisLoading) {
    gisLoading = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = GIS_URL;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        gisLoading = null;
        s.remove();
        reject(new Error("impossibile caricare il login di Google (rete bloccata?)"));
      };
      document.head.appendChild(s);
    });
  }
  return gisLoading;
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number | string;
  error?: string;
}

function requestToken(): Promise<TokenResponse> {
  return new Promise((resolve, reject) => {
    const g = (window as unknown as { google?: { accounts?: { oauth2?: { initTokenClient: (c: unknown) => { requestAccessToken: () => void } } } } }).google;
    const oauth2 = g?.accounts?.oauth2;
    if (!oauth2) {
      reject(new Error("il login di Google non è disponibile"));
      return;
    }
    const client = oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      hd: SCHOOL_DOMAIN,
      callback: (r: TokenResponse) => resolve(r),
      error_callback: (e: { type?: string }) => reject(new Error(`accesso a Google annullato (${e?.type ?? "errore"})`)),
    });
    client.requestAccessToken();
  });
}

async function api(access: string, method: string, url: string, headers: Record<string, string> = {}, body?: BodyInit): Promise<Response> {
  return fetch(url, { method, headers: { Authorization: `Bearer ${access}`, ...headers }, body });
}

async function json(access: string, method: string, url: string, headers: Record<string, string> = {}, body?: BodyInit): Promise<any> {
  const r = await api(access, method, url, headers, body);
  const text = await r.text();
  if (!r.ok) throw new Error(`Drive ha risposto ${r.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : {};
}

/** Ask Drive whose token this is and let only school accounts in. */
async function verify(access: string): Promise<Account> {
  const a = await json(access, "GET", "https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)");
  const email: string = a?.user?.emailAddress ?? "";
  if (!isSchoolEmail(email)) {
    throw new Error(`l'account ${email || "sconosciuto"} non è della scuola: usa un account @${SCHOOL_DOMAIN}`);
  }
  return { name: a?.user?.displayName ?? email, email };
}

/** Sign in (Google's popup) and return the account; throws when cancelled or not a school account. */
export async function signIn(): Promise<Account> {
  await preload();
  const r = await requestToken();
  if (r.error || !r.access_token) throw new Error(`accesso a Google non riuscito: ${r.error ?? "nessun permesso"}`);
  const acc = await verify(r.access_token);
  const seconds = Number(r.expires_in ?? 3000);
  token = { value: r.access_token, expiresAt: Date.now() + (Number.isFinite(seconds) ? seconds : 3000) * 1000, account: acc };
  keep();
  changed();
  return acc;
}

/** A valid access token: the one kept, or a new one after Google's popup. */
async function access(): Promise<string> {
  restore();
  if (token && token.expiresAt - MARGIN_MS > Date.now()) return token.value;
  await signIn();
  if (!token) throw new Error("accesso a Google non riuscito");
  return token.value;
}

const quote = (s: string) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

async function folder(a: string): Promise<string> {
  const q = `name = '${quote(FOLDER_NAME)}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const found = await json(a, "GET", `${FILES_URL}?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1&spaces=drive`);
  const id: string | undefined = found?.files?.[0]?.id;
  if (id) return id;
  const made = await json(a, "POST", `${FILES_URL}?fields=id`, { "Content-Type": "application/json" }, JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }));
  if (!made?.id) throw new Error("Drive non ha creato la cartella");
  return made.id as string;
}

/** Put `bytes` in the "3D" folder as `name`, replacing the file of that name if it is there. */
export async function save(name: string, bytes: Uint8Array, mime: string): Promise<void> {
  const a = await access();
  const parent = await folder(a);
  const q = `name = '${quote(name)}' and '${quote(parent)}' in parents and trashed = false`;
  const found = await json(a, "GET", `${FILES_URL}?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1&spaces=drive`);
  const existing: string | undefined = found?.files?.[0]?.id;
  const meta = existing ? { name } : { name, parents: [parent] };
  const boundary = "school3d_boundary_4f7a2c19";
  const head = new TextEncoder().encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${mime || "application/octet-stream"}\r\n\r\n`);
  const tail = new TextEncoder().encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(head.length + bytes.length + tail.length);
  body.set(head, 0);
  body.set(bytes, head.length);
  body.set(tail, head.length + bytes.length);
  const url = existing ? `${UPLOAD_URL}/${existing}?uploadType=multipart&fields=id` : `${UPLOAD_URL}?uploadType=multipart&fields=id`;
  await json(a, existing ? "PATCH" : "POST", url, { "Content-Type": `multipart/related; boundary=${boundary}` }, body as BufferSource);
}

/** The person's files in the "3D" folder, newest first. */
export async function list(): Promise<DriveEntry[]> {
  const a = await access();
  const parent = await folder(a);
  const q = `'${quote(parent)}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`;
  const r = await json(a, "GET", `${FILES_URL}?q=${encodeURIComponent(q)}&orderBy=modifiedTime%20desc&pageSize=100&fields=files(id,name,modifiedTime)&spaces=drive`);
  const files: Array<{ id?: string; name?: string; modifiedTime?: string }> = r?.files ?? [];
  return files
    .filter((f) => f.id && f.name)
    .map((f) => ({ id: f.id as string, name: f.name as string, modified: f.modifiedTime ? new Date(f.modifiedTime).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "" }));
}

/** The bytes of a file in Drive. */
export async function open(id: string): Promise<Uint8Array> {
  const a = await access();
  const r = await api(a, "GET", `${FILES_URL}/${encodeURIComponent(id)}?alt=media`);
  if (!r.ok) throw new Error(`Drive ha risposto ${r.status}`);
  const buf = new Uint8Array(await r.arrayBuffer());
  if (buf.length > MAX_OPEN_BYTES) throw new Error("il file è troppo grande");
  return buf;
}

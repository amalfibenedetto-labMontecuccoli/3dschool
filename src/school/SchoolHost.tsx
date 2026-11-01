// The classroom edition around the app: a full-screen sign-in with the school's Google account
// (nobody uses the app before), a small strip at the top with the language, the About window,
// Open from Drive and Sign out, and the Drive delivery of every saved or exported file.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { download } from "../io/files";
import * as google from "./google";
import { schoolHooks } from "./hooks";
import * as i18n from "./i18n";

const REPO = "https://github.com/sawhorse3d/sawhorse";

/** The text in the current language (the school's own texts are written in both). */
function pick(it: string, en: string): string {
  return i18n.lang() === "it" ? it : en;
}

const css = `
.school-cover{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;background:rgba(10,10,12,.88);font-family:"IBM Plex Sans",system-ui,sans-serif}
.school-card{width:min(620px,calc(100vw - 24px));box-sizing:border-box;padding:28px;border-radius:14px;background:var(--panel,#fff);color:var(--text,#222);border:1.5px solid var(--border,#bbb);text-align:center;max-height:calc(100vh - 24px);overflow:auto}
.school-card h1{margin:0 0 12px;font-size:34px}
.school-card p{margin:0 0 20px;font-size:19px;line-height:1.4}
.school-card small{display:block;margin-top:14px;font-size:15px;opacity:.8}
.school-card .school-err{color:#c0392b;margin-top:10px;font-size:15px}
.school-go{width:100%;min-height:68px;font-size:24px;border-radius:10px;border:0;background:#1f6feb;color:#fff;cursor:pointer}
.school-go:disabled{opacity:.6;cursor:wait}
.school-lang{margin-top:12px;padding:6px 14px;font-size:14px;border-radius:8px;border:1px solid var(--border,#999);background:transparent;color:inherit;cursor:pointer}
.school-bar{position:fixed;top:4px;left:50%;transform:translateX(-50%);z-index:90000;display:flex;gap:6px;align-items:center;padding:3px 8px;border-radius:999px;background:rgba(30,30,34,.88);color:#fff;font:12px "IBM Plex Sans",system-ui,sans-serif;max-width:calc(100vw - 16px);overflow-x:auto;white-space:nowrap}
.school-bar button{min-height:28px;padding:2px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;font:inherit;cursor:pointer}
.school-bar .school-name{opacity:.85;max-width:180px;overflow:hidden;text-overflow:ellipsis}
.school-modal{position:fixed;inset:0;z-index:100001;display:flex;align-items:center;justify-content:center;background:rgba(10,10,12,.55);font-family:"IBM Plex Sans",system-ui,sans-serif}
.school-box{width:min(560px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;padding:20px;border-radius:12px;background:var(--panel,#fff);color:var(--text,#222);border:1px solid var(--border,#bbb)}
.school-box h2{margin:0 0 10px;font-size:22px}
.school-box p{margin:0 0 10px;line-height:1.45;font-size:14px}
.school-box .school-files button{display:block;width:100%;text-align:left;margin:4px 0;padding:10px;font-size:15px;border-radius:8px;border:1px solid var(--border,#bbb);background:transparent;color:inherit;cursor:pointer}
.school-box .school-close{margin-top:12px;padding:8px 16px;border-radius:8px;border:1px solid var(--border,#999);background:transparent;color:inherit;cursor:pointer}
.school-toast{position:fixed;left:50%;bottom:48px;transform:translateX(-50%);z-index:100002;max-width:calc(100vw - 24px);padding:10px 16px;border-radius:10px;background:#222;color:#fff;font:14px "IBM Plex Sans",system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.4)}
@media (max-width:560px){.school-card{padding:16px}.school-card h1{font-size:24px}.school-card p{font-size:15px}.school-go{min-height:56px;font-size:19px}}
`;

function useLang(): i18n.Lang {
  const [l, setL] = useState(i18n.lang());
  useEffect(() => i18n.onLangChange(() => setL(i18n.lang())), []);
  return l;
}

function useAccount(): google.Account | null {
  const [a, setA] = useState(google.account());
  useEffect(() => google.onAccountChange(() => setA(google.account())), []);
  return a;
}

export function SchoolHost({ children }: { children: ReactNode }) {
  const lang = useLang();
  const account = useAccount();
  const disabled = useMemo(() => google.driveDisabled(), []);
  const [signedIn, setSignedIn] = useState(() => !google.needsSignIn());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [about, setAbout] = useState(false);
  const [files, setFiles] = useState<google.DriveEntry[] | null>(null);
  const [toast, setToast] = useState("");
  const appRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const say = (text: string) => {
    setToast(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 6000);
  };

  // Google's script is loaded now, so the sign-in popup opens straight from the tap.
  useEffect(() => {
    if (!disabled) void google.preload().catch(() => undefined);
  }, [disabled]);

  useEffect(() => google.onAccountChange(() => setSignedIn(!google.needsSignIn())), []);

  // Behind the cover nothing answers the keyboard.
  const covered = !disabled && !signedIn;
  useEffect(() => {
    const el = appRef.current;
    if (!el) return;
    if (covered) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
  }, [covered]);

  // Saved and exported files go to Drive (a download when Drive isn't possible).
  useEffect(() => {
    if (disabled) return;
    schoolHooks.deliver = async (name, bytes, mime) => {
      const toComputer = (why: string) => {
        download(name, bytes, mime);
        say(pick(`Non sono riuscito a salvare sul Drive (${why}). Il file è stato scaricato sul computer: ${name}`, `Couldn't save to Drive (${why}). The file was downloaded: ${name}`));
        return { name };
      };
      if (bytes.length > google.MAX_UPLOAD_BYTES) return toComputer(pick("file troppo grande", "file too large"));
      try {
        await google.save(name, bytes, mime);
        say(pick(`Salvato nel tuo Google Drive, cartella «${google.FOLDER_NAME}»: ${name}`, `Saved to your Google Drive, folder "${google.FOLDER_NAME}": ${name}`));
        return { name };
      } catch (e) {
        return toComputer(e instanceof Error ? e.message : String(e));
      }
    };
    return () => {
      schoolHooks.deliver = undefined;
    };
  }, [disabled]);

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      await google.signIn();
    } catch (e) {
      setError(pick("Accesso non riuscito: ", "Sign-in failed: ") + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  };

  const openList = async () => {
    try {
      setFiles(await google.list());
    } catch (e) {
      say(pick("Non riesco a leggere il Drive: ", "Can't read Drive: ") + (e instanceof Error ? e.message : String(e)));
    }
  };

  const openFile = async (f: google.DriveEntry) => {
    setFiles(null);
    try {
      const bytes = await google.open(f.id);
      // The app takes files dropped on its window: hand it this one the same way.
      const target = document.getElementById("app");
      if (!target) throw new Error("app non trovata");
      const dt = new DataTransfer();
      dt.items.add(new File([bytes as BlobPart], f.name));
      target.dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }));
    } catch (e) {
      say(pick("Non riesco ad aprire il file dal Drive: ", "Can't open the file from Drive: ") + (e instanceof Error ? e.message : String(e)));
    }
  };

  const toggleLang = () => i18n.setLang(i18n.lang() === "it" ? "en" : "it");

  return (
    <>
      <style>{css}</style>
      <div ref={appRef} style={{ display: "contents" }}>
        {children}
      </div>
      {!disabled && (
        <div className="school-bar" data-no-i18n role="toolbar" aria-label="3Dschool">
          <button type="button" onClick={toggleLang} title={pick("Cambia lingua", "Change language")}>
            {lang === "it" ? "English" : "Italiano"}
          </button>
          <button type="button" onClick={() => void openList()}>
            {pick("Apri da Drive", "Open from Drive")}
          </button>
          <button type="button" onClick={() => setAbout(true)}>
            {pick("Informazioni", "About")}
          </button>
          {account && <span className="school-name">{account.name}</span>}
          {account && (
            <button type="button" onClick={() => google.signOut()}>
              {pick("Esci", "Sign out")}
            </button>
          )}
        </div>
      )}
      {covered && (
        <div className="school-cover" data-no-i18n>
          <div className="school-card" role="dialog" aria-label="3Dschool">
            <h1>{pick("Benvenuto", "Welcome")}</h1>
            <p>
              {pick(
                "Accedi con l'account Google della scuola per usare 3Dschool. I tuoi modelli vengono salvati nel tuo Google Drive.",
                "Sign in with your school Google account to use 3Dschool. Your models are saved in your Google Drive.",
              )}
            </p>
            <button type="button" className="school-go" disabled={busy} onClick={() => void start()}>
              {pick("Accedi con Google", "Sign in with Google")}
            </button>
            <small>
              {pick("Si aprirà una finestra di Google: scegli l'account della scuola, ", "A Google window will open: choose your school account, ")}
              name@{google.SCHOOL_DOMAIN}
            </small>
            {error && <div className="school-err">{error}</div>}
            <button type="button" className="school-lang" onClick={toggleLang}>
              {lang === "it" ? "English" : "Italiano"}
            </button>
          </div>
        </div>
      )}
      {about && (
        <div className="school-modal" data-no-i18n onClick={() => setAbout(false)}>
          <div className="school-box" role="dialog" aria-label={pick("Informazioni", "About")} onClick={(e) => e.stopPropagation()}>
            <h2>3Dschool</h2>
            <p>{pick("Versione didattica per la scuola, basata su Sawhorse.", "Classroom edition for school, based on Sawhorse.")}</p>
            <p>
              {pick(
                "A cura dei docenti della Scuola Secondaria di I grado R. Montecuccoli, Pavullo nel Frignano.",
                "By the teachers of the Scuola Secondaria di I grado R. Montecuccoli, Pavullo nel Frignano (Italy).",
              )}
            </p>
            <p>
              {pick(
                "Sawhorse è software libero (licenza MIT oppure Apache-2.0) dei suoi autori. Questa versione è stata modificata: accesso con l'account Google della scuola, salvataggio e apertura su Google Drive, interfaccia in italiano.",
                "Sawhorse is free software (MIT or Apache-2.0 licence) by its authors. This version was modified: sign-in with the school's Google account, saving to and opening from Google Drive, Italian interface.",
              )}
            </p>
            <p>
              <a href={REPO} target="_blank" rel="noopener noreferrer">
                {pick("Progetto originale: github.com/sawhorse3d/sawhorse", "Original project: github.com/sawhorse3d/sawhorse")}
              </a>
            </p>
            <p>{pick("Non è un prodotto di SketchUp né di Trimble Inc.", "It is not a product of SketchUp or of Trimble Inc.")}</p>
            {account && (
              <p>
                {pick("Accesso effettuato come", "Signed in as")} {account.name} ({account.email})
              </p>
            )}
            <button type="button" className="school-close" onClick={() => setAbout(false)}>
              {pick("Chiudi", "Close")}
            </button>
          </div>
        </div>
      )}
      {files && (
        <div className="school-modal" data-no-i18n onClick={() => setFiles(null)}>
          <div className="school-box" role="dialog" aria-label={pick("Apri da Google Drive", "Open from Google Drive")} onClick={(e) => e.stopPropagation()}>
            <h2>{pick("Apri da Google Drive", "Open from Google Drive")}</h2>
            {files.length === 0 && <p>{pick(`Nessun file nella cartella «${google.FOLDER_NAME}» del tuo Drive. Salva un modello per trovarlo qui.`, `No files in the "${google.FOLDER_NAME}" folder of your Drive. Save a model to find it here.`)}</p>}
            <div className="school-files">
              {files.map((f) => (
                <button key={f.id} type="button" onClick={() => void openFile(f)}>
                  {f.name} <small style={{ opacity: 0.7 }}>{f.modified}</small>
                </button>
              ))}
            </div>
            <button type="button" className="school-close" onClick={() => setFiles(null)}>
              {pick("Chiudi", "Close")}
            </button>
          </div>
        </div>
      )}
      {toast && (
        <div className="school-toast" data-no-i18n role="status">
          {toast}
        </div>
      )}
    </>
  );
}

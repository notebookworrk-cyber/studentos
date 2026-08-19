import { useEffect, useRef, useState } from "react";
import { useOS } from "../../state/os";
import { Icon } from "../Icon";
import { isDesktop } from "../browser/BrowserPage";
import { WALLPAPERS, WALLPAPER_CATEGORIES } from "../../data/wallpapers";
import { AISetup } from "../ai/AISetup";
import { toast } from "../../state/toasts";
import { exportData, importData, downloadJSON } from "../../lib/backup";

const ACCENTS = [
  { id: "blue", label: "Blue", color: "#5f9dff" },
  { id: "purple", label: "Purple", color: "#9a7bff" },
  { id: "cyan", label: "Cyan", color: "#4fd6e8" },
  { id: "green", label: "Green", color: "#59d69a" },
  { id: "amber", label: "Amber", color: "#f2b556" },
  { id: "rose", label: "Rose", color: "#f27b7b" },
] as const;

export function SettingsPage() {
  const { wallpaper, setWallpaper, wallpaperOpacity, setWallpaperOpacity, wallpaperDim, setWallpaperDim, wallpaperBlur, setWallpaperBlur, wallpaperFavorites, toggleWallpaperFavorite, wallpaperRecent, dynamicAtmosphere, setDynamicAtmosphere, autoChange, setAutoChange, randomizeWallpaper, resetData, theme, setTheme, aiStatus, profileName, setProfileName, accent, setAccent, quotesEnabled, setQuotesEnabled, location, setLocation, notificationsEnabled, setNotificationsEnabled } = useOS();
  const [confirmReset, setConfirmReset] = useState(false);
  const [diag, setDiag] = useState<Record<string, unknown> | null>(null);
  const [wpCat, setWpCat] = useState<string>("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const applyImport = (raw: string) => {
    const res = importData(raw);
    if (!res.ok) {
      toast(res.error ?? "Import failed", "err");
      return;
    }
    toast(`${res.count} keys restored`, "ok");
    if (window.confirm("Backup restored. Reload StudentOS now to pick it up?")) window.location.reload();
  };

  const handleExport = async () => {
    const env = exportData();
    const content = JSON.stringify(env, null, 2);
    if (isDesktop && window.studentos?.files) {
      const res = await window.studentos.files.save({
        name: `studentos-backup-${new Date().toISOString().slice(0, 10)}.json`,
        content,
      });
      if (res.ok) toast("Backup saved", "ok");
      else if (!res.canceled) toast("Couldn't save backup", "err");
    } else {
      await downloadJSON(env);
      toast("Backup downloaded", "ok");
    }
  };

  const handleImport = async () => {
    if (isDesktop && window.studentos?.files) {
      const res = await window.studentos.files.open();
      if (res.canceled || !res.ok || res.content == null) return;
      applyImport(res.content);
    } else {
      fileRef.current?.click();
    }
  };

  useEffect(() => {
    if (isDesktop) void window.studentos!.system.diagnostics().then(setDiag).catch(() => {});
  }, []);

  return (
    <div className="page settings-page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Tune your workspace — not a control panel.</p>
        </div>
      </header>

      <section className="study-block surface">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="star" />
            Profile
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-row-label">Name</div>
          <input
            className="settings-input"
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Your name"
            maxLength={30}
          />
        </div>
      </section>

      <section className="study-block surface">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="spark" />
            Accent Color
          </div>
        </div>
        <div className="settings-accent-grid">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              className={`settings-accent-swatch ${accent === a.id ? "active" : ""}`}
              style={{ "--swatch-color": a.color } as React.CSSProperties}
              onClick={() => setAccent(a.id)}
              aria-label={a.label}
            >
              {accent === a.id && <Icon name="check" size={14} />}
            </button>
          ))}
        </div>
      </section>

      <section className="study-block surface">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="settings" />
            Appearance
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-row-label">Theme</div>
          <div className="seg" role="tablist" aria-label="Theme">
            <button
              className={`seg-item ${theme === "light" ? "active" : ""}`}
              role="tab"
              aria-selected={theme === "light"}
              onClick={() => setTheme("light")}
            >
              Light
            </button>
            <button
              className={`seg-item ${theme === "dark" ? "active" : ""}`}
              role="tab"
              aria-selected={theme === "dark"}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
          </div>
        </div>
      </section>

      <section className="study-block surface">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="settings" />
            Wallpaper
          </div>
        </div>

        <div className="wallpaper-preview">
          <div className={`wallpaper-preview-art wp-layer wp-${wallpaper} active`} />
          <div className="wallpaper-preview-meta">
            <span className="wallpaper-preview-name">{WALLPAPERS.find((w) => w.id === wallpaper)?.name ?? wallpaper}</span>
            <span className="wallpaper-preview-cat">{WALLPAPERS.find((w) => w.id === wallpaper)?.category}</span>
          </div>
          <button
            className={`wallpaper-fav ${wallpaperFavorites.includes(wallpaper) ? "active" : ""}`}
            aria-label="Favorite wallpaper"
            onClick={() => toggleWallpaperFavorite(wallpaper)}
          >
            <Icon name="star" size={16} />
          </button>
          <button className="wallpaper-randomize" onClick={randomizeWallpaper}>
            <Icon name="refresh" size={14} /> Random
          </button>
        </div>

        <div className="wallpaper-cats">
          {WALLPAPER_CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`wallpaper-cat ${wpCat === c.id ? "active" : ""}`}
              onClick={() => setWpCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="wallpaper-grid">
          {WALLPAPERS.filter((w) => wpCat === "all" || w.category === wpCat).map((w) => (
            <button
              key={w.id}
              className={`wallpaper-card ${wallpaper === w.id ? "active" : ""}`}
              onClick={() => setWallpaper(w.id)}
            >
              <span className={`wallpaper-card-art wp-layer wp-${w.id} active`} />
              <span className="wallpaper-card-name">{w.name}</span>
              <span className="wallpaper-card-cat">{w.category}</span>
              <span
                className={`wallpaper-card-fav ${wallpaperFavorites.includes(w.id) ? "active" : ""}`}
                onClick={(e) => { e.stopPropagation(); toggleWallpaperFavorite(w.id); }}
              >
                <Icon name="star" size={13} />
              </span>
            </button>
          ))}
        </div>

        {wallpaperRecent.length > 0 && (
          <div className="wallpaper-recent">
            <span className="wallpaper-recent-label">Recently used</span>
            <div className="wallpaper-recent-list">
              {wallpaperRecent.map((id) => (
                <button key={id} className={`wallpaper-recent-chip ${wallpaper === id ? "active" : ""}`} onClick={() => setWallpaper(id)}>
                  <span className={`wp-layer wp-${id} active`} style={{ borderRadius: "inherit", position: "absolute", inset: 0 }} />
                  <span style={{ position: "relative" }}>{WALLPAPERS.find((w) => w.id === id)?.name ?? id}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="settings-sliders">
          <label className="settings-slider">
            <span>Opacity <em>{wallpaperOpacity}%</em></span>
            <input
              type="range"
              min={40}
              max={100}
              value={wallpaperOpacity}
              onChange={(e) => setWallpaperOpacity(Number(e.target.value))}
            />
          </label>
          <label className="settings-slider">
            <span>Darkness <em>{wallpaperDim}%</em></span>
            <input
              type="range"
              min={0}
              max={70}
              value={wallpaperDim}
              onChange={(e) => setWallpaperDim(Number(e.target.value))}
            />
          </label>
          <label className="settings-slider">
            <span>Blur <em>{wallpaperBlur}px</em></span>
            <input
              type="range"
              min={0}
              max={24}
              value={wallpaperBlur}
              onChange={(e) => setWallpaperBlur(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="wallpaper-toggles">
          <label className="wallpaper-toggle">
            <span>
              <strong>Dynamic atmosphere</strong>
              <em>Shift wallpaper with the time of day</em>
            </span>
            <input type="checkbox" checked={dynamicAtmosphere} onChange={(e) => setDynamicAtmosphere(e.target.checked)} />
          </label>
          <label className="wallpaper-toggle">
            <span>
              <strong>Auto-change</strong>
              <em>Rotate wallpaper automatically</em>
            </span>
            <select
              value={autoChange}
              onChange={(e) => setAutoChange(e.target.value as "never" | "daily" | "startup")}
            >
              <option value="never">Never</option>
              <option value="daily">Daily</option>
              <option value="startup">Every startup</option>
            </select>
          </label>
        </div>
      </section>

      <section className="study-block surface">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="notes" />
            Daily Quotes
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-row-label">Show a new quote on the home page each day</div>
          <button
            className={`seg-item ${quotesEnabled ? "active" : ""}`}
            onClick={() => setQuotesEnabled(!quotesEnabled)}
          >
            {quotesEnabled ? "On" : "Off"}
          </button>
        </div>
      </section>

      <section className="study-block surface">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="bell" />
            Notifications
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-row-label">Event reminders, task due times, focus alerts and a daily digest</div>
          <button
            className={`seg-item ${notificationsEnabled ? "active" : ""}`}
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            {notificationsEnabled ? "On" : "Off"}
          </button>
        </div>
      </section>

      <section className="study-block surface">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="search" />
            Location
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-row-label">City for weather</div>
          <input
            className="settings-input"
            type="text"
            value={location?.city ?? ""}
            onChange={(e) => {
              const city = e.target.value.trim();
              setLocation(city ? { city, lat: location?.lat ?? 0, lon: location?.lon ?? 0 } : null);
            }}
            placeholder="Type a city name"
            maxLength={50}
          />
        </div>
        <p className="settings-row-label" style={{ fontSize: "12px", color: "var(--ink-3)", marginTop: "8px" }}>
          {location ? `Saved: ${location.city} (${location.lat.toFixed(2)}, ${location.lon.toFixed(2)})` : "No location set"}
        </p>
        <div className="settings-row" style={{ marginTop: "8px" }}>
          <button className="btn btn-primary btn-sm" onClick={async () => {
            const { detectLocation, geocodeCity, saveLocation } = await import("../../lib/weather");
            const detected = await detectLocation();
            if (detected) {
              saveLocation(detected);
              setLocation(detected);
            } else {
              const city = prompt("Enter your city:");
              if (city) {
                const loc = await geocodeCity(city);
                if (loc) {
                  saveLocation(loc);
                  setLocation(loc);
                }
              }
            }
          }}>
            <Icon name="search" size={13} />
            Auto-detect Location
          </button>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: "8px" }} onClick={async () => {
            const { geocodeCity, saveLocation } = await import("../../lib/weather");
            const city = location?.city ?? "";
            if (!city) return;
            const loc = await geocodeCity(city);
            if (loc) {
              saveLocation(loc);
              setLocation(loc);
            }
          }}>
            <Icon name="check" size={13} />
            Save City
          </button>
        </div>
      </section>

      {isDesktop && (
        <section className="study-block surface">
          <div className="panel-head">
            <div className="panel-title">
              <Icon name="ai" />
              Local AI Model
            </div>
            <span className="badge badge-tint">{aiStatus === "ready" || aiStatus === "loaded" ? "Ready" : aiStatus === "downloading" ? "Downloading" : "Not installed"}</span>
          </div>
          <AISetup />
        </section>
      )}

      <section className="study-block surface">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="trash" />
            Data
          </div>
        </div>
        <div className="settings-row" style={{ marginBottom: 12 }}>
          <div className="settings-row-label">Export everything to a JSON backup, or restore from one</div>
          <div className="settings-row-actions">
            <button className="btn btn-ghost btn-sm" onClick={handleExport}>
              <Icon name="download" size={13} />
              Export
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleImport}>
              <Icon name="folder" size={13} />
              Import
            </button>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              const r = new FileReader();
              r.onload = () => applyImport(String(r.result));
              r.readAsText(f);
            }
            e.target.value = "";
          }}
        />
        <p className="study-res-item-sub" style={{ marginBottom: 12 }}>
          Resets tasks, events, notes, goals, sessions and history to the original starter state.
        </p>
        {!confirmReset ? (
          <button className="btn btn-ghost danger" onClick={() => setConfirmReset(true)}>
            <Icon name="trash" />
            Reset all data
          </button>
        ) : (
          <div className="settings-reset-confirm">
            <span className="pill-warn">
              <Icon name="flag" size={13} />
              This can't be undone. Really reset?
            </span>
            <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                resetData();
                setConfirmReset(false);
              }}
            >
              Yes, reset
            </button>
          </div>
        )}
      </section>

      <section className="study-block surface">
        <div className="panel-head">
          <div className="panel-title">
            <Icon name="focus" />
            Keyboard shortcuts
          </div>
        </div>
        <div className="settings-diag">
          {[
            ["Ctrl / Cmd + K", "Open command palette & global search"],
            ["Ctrl / Cmd + P", "Quick search & project switch"],
            ["Ctrl / Cmd + N", "New item (task, event, or note)"],
            ["Space", "Start / pause the timer"],
            ["Esc", "Close dialogs, menus & palettes"],
          ].map(([k, v]) => (
            <div key={k} className="settings-diag-row">
              <span className="settings-shortcut-key">{k}</span>
              <span className="settings-diag-val">{v}</span>
            </div>
          ))}
        </div>
      </section>

      {isDesktop && (
        <section className="study-block surface">
          <div className="panel-head">
            <div className="panel-title">
              <Icon name="terminal" />
              Diagnostics
            </div>
            <span className="badge badge-tint">desktop engine</span>
          </div>
          {diag ? (
            <div className="settings-diag">
              {Object.entries(diag).map(([k, v]) => (
                <div key={k} className="settings-diag-row">
                  <span className="settings-diag-key">{k}</span>
                  <span className="settings-diag-val">{String(v ?? "—")}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="study-res-empty">Reading system status…</p>
          )}
        </section>
      )}
    </div>
  );
}
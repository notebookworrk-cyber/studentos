import { useEffect, useMemo, useRef } from "react";
import { useOS } from "../state/os";
import { WALLPAPERS } from "../data/wallpapers";

function timeOfDayId(): string | null {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "dawn";
  if (h >= 11 && h < 17) return "lake";
  if (h >= 17 && h < 21) return "haze";
  return "coast";
}

export function Wallpaper() {
  const {
    wallpaper, wallpaperOpacity, wallpaperDim, wallpaperBlur,
    dynamicAtmosphere,
  } = useOS();
  const valid = WALLPAPERS.some((w) => w.id === wallpaper);
  const base = valid ? wallpaper : WALLPAPERS[0].id;

  const effective = useMemo(() => {
    if (dynamicAtmosphere) {
      const tod = timeOfDayId();
      if (tod && WALLPAPERS.some((w) => w.id === tod)) return tod;
    }
    return base;
  }, [dynamicAtmosphere, base]);

  const prev = useRef(effective);
  const id = effective;

  useEffect(() => {
    document.documentElement.style.setProperty("--wp-opacity", String(wallpaperOpacity / 100));
    document.documentElement.style.setProperty("--wp-dim", String(wallpaperDim / 100));
    document.documentElement.style.setProperty("--wp-blur", `${wallpaperBlur}px`);
  }, [wallpaperOpacity, wallpaperDim, wallpaperBlur]);

  useEffect(() => {
    if (prev.current === id) return;
    prev.current = id;
    document.body.classList.add("wp-transitioning");
    const t = setTimeout(() => document.body.classList.remove("wp-transitioning"), 400);
    return () => clearTimeout(t);
  }, [id]);

  useEffect(() => {
    document.body.classList.toggle("wp-reduced-blur", wallpaperBlur === 0 && !dynamicAtmosphere);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => document.body.classList.toggle("wp-reduced-motion", reduced.matches);
    apply();
    reduced.addEventListener("change", apply);
    return () => reduced.removeEventListener("change", apply);
  }, [wallpaperBlur, dynamicAtmosphere]);

  return (
    <div className="wp" aria-hidden>
      {WALLPAPERS.map((w) => (
        <div key={w.id} className={`wp-layer wp-${w.id} ${w.id === id ? "active" : ""}`} />
      ))}
    </div>
  );
}

export type WallpaperCategory = "minimal" | "nature" | "atmospheric" | "space" | "abstract" | "dark" | "light";
export type WallpaperTheme = "dark" | "light" | "both";
export type SafeArea = "left" | "right" | "center" | "top";

export interface WallpaperDef {
  id: string;
  name: string;
  category: WallpaperCategory;
  theme: WallpaperTheme;
  focalArea: string;
  safeArea: SafeArea;
  desc: string;
  favorite?: boolean;
}

export const WALLPAPER_CATEGORIES: { id: WallpaperCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "nature", label: "Nature" },
  { id: "atmospheric", label: "Atmospheric" },
  { id: "space", label: "Space" },
  { id: "abstract", label: "Abstract" },
  { id: "minimal", label: "Minimal" },
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
];

export const WALLPAPERS: WallpaperDef[] = [
  { id: "dawn", name: "Quiet Dawn", category: "atmospheric", theme: "both", focalArea: "horizon glow", safeArea: "left", desc: "Misty mountain sunrise" },
  { id: "lake", name: "Blue Lake", category: "nature", theme: "light", focalArea: "still water", safeArea: "center", desc: "Minimal alpine lake" },
  { id: "haze", name: "Evening Haze", category: "atmospheric", theme: "dark", focalArea: "lavender horizon", safeArea: "center", desc: "Deep lavender horizon" },
  { id: "rain", name: "Rain Glass", category: "nature", theme: "both", focalArea: "raindrops", safeArea: "left", desc: "Soft rainy window" },
  { id: "coast", name: "Midnight Coast", category: "atmospheric", theme: "dark", focalArea: "ocean line", safeArea: "center", desc: "Dark ocean horizon" },
  { id: "paper", name: "Paper Blue", category: "minimal", theme: "light", focalArea: "paper grain", safeArea: "center", desc: "Minimal abstract paper" },
  { id: "aurora", name: "Soft Aurora", category: "abstract", theme: "dark", focalArea: "polar light", safeArea: "right", desc: "Restrained aurora" },
  { id: "lunar", name: "Lunar Quiet", category: "space", theme: "dark", focalArea: "moonlit ridge", safeArea: "right", desc: "Subtle moonlit landscape" },
  { id: "forest", name: "Deep Forest", category: "nature", theme: "dark", focalArea: "tall pines", safeArea: "left", desc: "Dark atmospheric forest" },
  { id: "clouds", name: "Cloud Room", category: "minimal", theme: "light", focalArea: "soft cloud forms", safeArea: "center", desc: "Soft abstract cloud forms" },
  { id: "glass", name: "Glass Current", category: "abstract", theme: "both", focalArea: "flowing form", safeArea: "right", desc: "Minimal translucent flow" },
  { id: "arch", name: "Night Architecture", category: "dark", theme: "dark", focalArea: "quiet skyline", safeArea: "center", desc: "Dark modern architecture" },
  { id: "oceanfog", name: "Ocean Fog", category: "minimal", theme: "both", focalArea: "bare horizon", safeArea: "center", desc: "Minimal horizon line" },
  { id: "pale", name: "Pale Morning", category: "light", theme: "light", focalArea: "open sky", safeArea: "center", desc: "Bright soft sky" },
  { id: "deepspace", name: "Deep Space", category: "space", theme: "dark", focalArea: "faint stars", safeArea: "right", desc: "Subtle stars, low detail" },
  { id: "twilight", name: "Twilight Valley", category: "atmospheric", theme: "dark", focalArea: "mountain silhouette", safeArea: "left", desc: "Quiet mountain silhouette" },
];

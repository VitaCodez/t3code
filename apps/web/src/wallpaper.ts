import type { RetroFontPreset, WallpaperMode, WallpaperPreset } from "@t3tools/contracts";

export interface WallpaperPresetDefinition {
  readonly id: WallpaperPreset;
  readonly label: string;
  readonly description: string;
  readonly accentColor: string;
  readonly url: string;
  readonly pixelated?: boolean;
}

// Inline SVG data URIs for bundled presets to guarantee zero external network dependencies
const SYNTHWAVE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%230b001a"/><stop offset="50%" stop-color="%232b0938"/><stop offset="100%" stop-color="%237b124e"/></linearGradient><linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23fffa65"/><stop offset="70%" stop-color="%23ff007f"/><stop offset="100%" stop-color="%237000ff"/></linearGradient><linearGradient id="grid" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%2301cdfe" stop-opacity="0.8"/><stop offset="100%" stop-color="%23050110"/></linearGradient></defs><rect width="1920" height="1080" fill="url(%23sky)"/><circle cx="960" cy="560" r="280" fill="url(%23sun)"/><path d="M0,560 L1920,560" stroke="%23ff007f" stroke-width="3"/><g opacity="0.6"><path d="M0,560 L0,1080 M192,560 L-100,1080 M384,560 L200,1080 M576,560 L450,1080 M768,560 L700,1080 M960,560 L960,1080 M1152,560 L1220,1080 M1344,560 L1470,1080 M1536,560 L1720,1080 M1728,560 L2020,1080 M1920,560 L1920,1080" stroke="%2301cdfe" stroke-width="2"/><path d="M0,580 L1920,580 M0,610 L1920,610 M0,650 L1920,650 M0,705 L1920,705 M0,780 L1920,780 M0,880 L1920,880 M0,1010 L1920,1010" stroke="%2301cdfe" stroke-width="2"/></g></svg>`;

const LOFI_RAIN_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><defs><linearGradient id="city" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%230a0d1a"/><stop offset="60%" stop-color="%23161a29"/><stop offset="100%" stop-color="%23231d28"/></linearGradient><radialGradient id="glow" cx="0.5" cy="0.6" r="0.4"><stop offset="0%" stop-color="%23f59e0b" stop-opacity="0.35"/><stop offset="100%" stop-color="%23f59e0b" stop-opacity="0"/></radialGradient></defs><rect width="1920" height="1080" fill="url(%23city)"/><circle cx="960" cy="650" r="500" fill="url(%23glow)"/><g opacity="0.15"><rect x="150" y="300" width="80" height="600" fill="%23f59e0b"/><rect x="280" y="220" width="120" height="700" fill="%2338bdf8"/><rect x="450" y="380" width="90" height="550" fill="%23f59e0b"/><rect x="1400" y="250" width="110" height="680" fill="%23ec4899"/><rect x="1560" y="340" width="85" height="580" fill="%2338bdf8"/><rect x="1700" y="200" width="130" height="720" fill="%23f59e0b"/></g><g opacity="0.4" stroke="%2393c5fd" stroke-width="1.2" stroke-linecap="round"><line x1="120" y1="40" x2="110" y2="120"/><line x1="340" y1="150" x2="330" y2="240"/><line x1="600" y1="80" x2="590" y2="160"/><line x1="850" y1="200" x2="840" y2="290"/><line x1="1100" y1="120" x2="1090" y2="200"/><line x1="1350" y1="60" x2="1340" y2="150"/><line x1="1600" y1="180" x2="1590" y2="260"/><line x1="1820" y1="90" x2="1810" y2="170"/><line x1="200" y1="450" x2="190" y2="540"/><line x1="480" y1="520" x2="470" y2="600"/><line x1="750" y1="480" x2="740" y2="570"/><line x1="1250" y1="510" x2="1240" y2="590"/><line x1="1500" y1="460" x2="1490" y2="550"/></g></svg>`;

const MATRIX_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23020904"/><stop offset="100%" stop-color="%23000000"/></linearGradient></defs><rect width="1920" height="1080" fill="url(%23fade)"/><g fill="%2310b981" font-family="monospace" font-size="16" opacity="0.35"><text x="60" y="100">0 1 1 0 1 0 0 1</text><text x="60" y="140">1 0 1 1 0 1 1 0</text><text x="60" y="180">0 0 1 0 1 1 0 1</text><text x="260" y="180">C O D E _ R E L A Y</text><text x="260" y="220">0 1 0 0 0 0 1 1</text><text x="480" y="80">T 3 _ C Y B E R</text><text x="480" y="120">0 1 1 1 0 0 1 1</text><text x="720" y="240">1 1 0 1 0 1 0 0</text><text x="720" y="280">M A T R I X _ P A T H</text><text x="1000" y="110">0 1 0 1 0 1 1 1</text><text x="1240" y="190">A N T I G R A V I T Y</text><text x="1240" y="230">0 0 1 1 0 1 0 1</text><text x="1500" y="90">0 1 1 0 1 0 1 0</text><text x="1720" y="150">1 0 0 1 1 1 0 0</text></g></svg>`;

const DEEP_SPACE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><defs><linearGradient id="space" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%2304030d"/><stop offset="50%" stop-color="%23100b26"/><stop offset="100%" stop-color="%23080514"/></linearGradient><radialGradient id="nebula1" cx="0.3" cy="0.4" r="0.5"><stop offset="0%" stop-color="%239333ea" stop-opacity="0.28"/><stop offset="100%" stop-color="%239333ea" stop-opacity="0"/></radialGradient><radialGradient id="nebula2" cx="0.75" cy="0.6" r="0.45"><stop offset="0%" stop-color="%2306b6d4" stop-opacity="0.22"/><stop offset="100%" stop-color="%2306b6d4" stop-opacity="0"/></radialGradient></defs><rect width="1920" height="1080" fill="url(%23space)"/><rect width="1920" height="1080" fill="url(%23nebula1)"/><rect width="1920" height="1080" fill="url(%23nebula2)"/><g fill="%23ffffff" opacity="0.7"><circle cx="150" cy="180" r="1.5"/><circle cx="380" cy="90" r="1"/><circle cx="620" cy="240" r="2"/><circle cx="890" cy="120" r="1.2"/><circle cx="1140" cy="290" r="1"/><circle cx="1450" cy="80" r="2"/><circle cx="1680" cy="220" r="1.5"/><circle cx="280" cy="680" r="1.5"/><circle cx="520" cy="820" r="1.2"/><circle cx="810" cy="650" r="2"/><circle cx="1200" cy="740" r="1.5"/><circle cx="1550" cy="890" r="1.8"/><circle cx="1780" cy="640" r="1.2"/></g></svg>`;

export const WALLPAPER_PRESET_DEFINITIONS: Readonly<
  Record<WallpaperPreset, WallpaperPresetDefinition>
> = {
  "cyberpunk-kowloon": {
    id: "cyberpunk-kowloon",
    label: "Cyberpunk Kowloon",
    description: "Iconic neon night streetscape in Jordan / Kowloon (Capy style)",
    accentColor: "#00e5ff", // Neon Cyan
    url: "/wallpapers/cyberpunk-kowloon.png",
    pixelated: true,
  },
  "synthwave-sunset": {
    id: "synthwave-sunset",
    label: "Synthwave Grid",
    description: "80s outrun retro grid horizon with glowing synthwave sunset",
    accentColor: "#ff71ce", // Neon Pink
    url: SYNTHWAVE_SVG,
    pixelated: false,
  },
  "lofi-rain": {
    id: "lofi-rain",
    label: "Lo-Fi Tokyo Rain",
    description: "Warm ambient rainy window overlooking night city lights",
    accentColor: "#f59e0b", // Warm Amber
    url: LOFI_RAIN_SVG,
    pixelated: false,
  },
  "matrix-code": {
    id: "matrix-code",
    label: "Matrix Terminal",
    description: "Retro phosphor digital glyph stream across dark glass",
    accentColor: "#10b981", // Phosphor Green
    url: MATRIX_SVG,
    pixelated: true,
  },
  "deep-space": {
    id: "deep-space",
    label: "Cosmic Nebula",
    description: "Deep space nebula with starlight and interstellar dust",
    accentColor: "#a855f7", // Electric Violet
    url: DEEP_SPACE_SVG,
    pixelated: false,
  },
};

export const GOOGLE_RETRO_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Silkscreen:wght@400;700&family=VT323&display=swap";

export const RETRO_FONT_DEFINITIONS: Readonly<
  Record<
    RetroFontPreset,
    { readonly label: string; readonly family: string; readonly description: string }
  >
> = {
  none: {
    label: "Default Font",
    family: "",
    description: "Standard system typeface",
  },
  vt323: {
    label: "VT323",
    family: "'VT323', 'Courier New', 'Lucida Console', monospace",
    description: "Vintage CRT phosphor terminal typeface",
  },
  "press-start": {
    label: "Press Start 2P",
    family: "'Press Start 2P', 'Small Fonts', 'Fixedsys', monospace",
    description: "Classic 8-bit arcade pixel font",
  },
  silkscreen: {
    label: "Silkscreen",
    family: "'Silkscreen', 'Monaco', 'Consolas', monospace",
    description: "Clean modern geometric pixel typeface",
  },
  "retro-code": {
    label: "Retro Monospace",
    family: "'Fixedsys', 'Courier New', 'Courier Prime', monospace",
    description: "Classic fixed-width programmer typewriter font",
  },
};

export function resolveWallpaperUrl(
  mode: WallpaperMode,
  preset: WallpaperPreset,
  customUrl: string,
): string | null {
  if (mode === "none") return null;
  if (mode === "custom") return customUrl.trim() || null;
  const def = WALLPAPER_PRESET_DEFINITIONS[preset];
  return def?.url ?? null;
}

export function resolveWallpaperAccent(
  mode: WallpaperMode,
  preset: WallpaperPreset,
  customAccentColor?: string,
): string {
  if (mode === "custom" && customAccentColor) {
    return customAccentColor;
  }
  const def = WALLPAPER_PRESET_DEFINITIONS[preset];
  return def?.accentColor ?? "#00e5ff";
}

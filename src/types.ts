export type BadgeStyle = 'banner' | 'bubble' | 'stamp' | 'bottom-bar' | 'none';

export type ArtFilter = 'none' | 'cartoon' | 'anime' | 'watercolor' | 'sketch' | 'pop-art' | 'pixel-art';

export interface StickerDecoration {
  id: string;
  type: 'star' | 'heart' | 'fire' | 'emoji' | 'flower' | 'sparkle' | 'balloon';
  content: string; // The character (e.g. ⭐, ❤️, 🔥, etc.)
  x: number;       // Percent offset (0 - 100) on sticker
  y: number;       // Percent offset (0 - 100)
  scale: number;   // Scale factor (e.g. 1)
  rotation: number; // In degrees
}

export interface StickerConfig {
  id: string;
  themeName: string;
  quoteText: string;
  emoji: string;
  backgroundColor: string;
  textColor: string;
  badgeStyle: BadgeStyle;
  
  // Customization adjustments
  fontSize: number;
  fontFamily: 'Inter' | 'Space Grotesk' | 'Playfair Display' | 'JetBrains Mono' | 'Outfit';
  outlineColor: string;
  outlineWidth: number;
  borderThickness: number; // The absolute white sticker die-cut outer outline
  shadowBlur: number;
  shadowColor: string;
  rotation: number;
  scale: number;
  stickerSize: 'small' | 'medium' | 'large';
  
  // Decoration instances added by the user
  decorations: StickerDecoration[];
  
  // Art styling & Image Adjustments
  artFilter: ArtFilter;
  brightness: number;   // percentage, default 100
  contrast: number;     // percentage, default 100
  saturation: number;   // percentage, default 100
  sharpness: number;    // default 0
}

export interface SavedSticker {
  id: string;
  name: string;
  previewUrl: string; // DataURL of final rendered canvas
  originalImage: string; // DataURL of raw uploaded image
  cutoutImage: string;   // DataURL of the cutout image (after bg removal)
  createdAt: string;
  tags: string[];
  favorite: boolean;
  config: StickerConfig;
}

export interface PrintSettings {
  paperSize: 'A4' | 'A5' | 'Letter';
  layoutDensity: 2 | 4 | 8 | 12; // stickers per page
  showGuidelines: boolean;
}

export type ViewType = 'home' | 'editor' | 'history' | 'templates' | 'profile';

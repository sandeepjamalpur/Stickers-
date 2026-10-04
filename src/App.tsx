import React, { useState, useEffect, useRef } from "react";
import { 
  Upload, 
  Camera, 
  Sparkles, 
  Download, 
  Printer, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  Layers, 
  ArrowLeft,
  X,
  Menu,
  Image as ImageIcon,
  Scissors,
  Sliders
} from "lucide-react";
import { renderStickerToCanvas } from "./utils/canvas";
import { StickerConfig, SavedSticker } from "./types";

interface StylePresetInfo {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
  textColor: string;
  fontFamily: 'Inter' | 'Space Grotesk' | 'Playfair Display' | 'JetBrains Mono' | 'Outfit';
  badgeStyle: 'banner' | 'bubble' | 'stamp' | 'bottom-bar' | 'none';
  artFilter: 'none' | 'cartoon' | 'anime' | 'watercolor' | 'sketch' | 'pop-art' | 'pixel-art';
  desc: string;
  accentColor: string;
  gradient: string;
  referenceImage: string;
}



export const STYLE_PRESETS: StylePresetInfo[] = [
  {
    id: "cute",
    name: "Cute & Pastel",
    emoji: "🧸",
    bgColor: "#FFE8EC",
    textColor: "#FF4E72",
    fontFamily: "Outfit",
    badgeStyle: "bottom-bar",
    artFilter: "cartoon",
    desc: "Soft pink shades, cute bubble layouts & adorable pastel cartoon aesthetics.",
    accentColor: "border-pink-200 bg-pink-50/50",
    gradient: "from-pink-400 to-rose-400",
    referenceImage: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "vaporwave",
    name: "90s Vaporwave",
    emoji: "📼",
    bgColor: "#FAF0FF",
    textColor: "#7C4DFF",
    fontFamily: "Space Grotesk",
    badgeStyle: "bubble",
    artFilter: "pop-art",
    desc: "Retro-futuristic purple neon tones, nostalgic layout & vintage dither feel.",
    accentColor: "border-purple-200 bg-purple-50/50",
    gradient: "from-purple-400 to-indigo-500",
    referenceImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Volt",
    emoji: "⚡",
    bgColor: "#1A1A24",
    textColor: "#00FFCC",
    fontFamily: "JetBrains Mono",
    badgeStyle: "banner",
    artFilter: "anime",
    desc: "Tech-focused electric cyan elements & high-contrast anime style render.",
    accentColor: "border-cyan-200 bg-cyan-50/50",
    gradient: "from-cyan-400 to-blue-600",
    referenceImage: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "cottagecore",
    name: "Cozy Cottagecore",
    emoji: "🍀",
    bgColor: "#F4F1EA",
    textColor: "#5D6B54",
    fontFamily: "Playfair Display",
    badgeStyle: "stamp",
    artFilter: "watercolor",
    desc: "Warm earth tones, organic textures & elegant arched stamp styling.",
    accentColor: "border-emerald-200 bg-emerald-50/50",
    gradient: "from-emerald-400 to-teal-600",
    referenceImage: "https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "comic",
    name: "Graffiti Comic",
    emoji: "💥",
    bgColor: "#FFF2E6",
    textColor: "#FF6B00",
    fontFamily: "Outfit",
    badgeStyle: "banner",
    artFilter: "pop-art",
    desc: "Bold half-tones, pop art illustration filters & street graffiti banner quotes.",
    accentColor: "border-orange-200 bg-orange-50/50",
    gradient: "from-orange-400 to-amber-500",
    referenceImage: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "study",
    name: "Smart Study",
    emoji: "💡",
    bgColor: "#EAF2FF",
    textColor: "#1A73E8",
    fontFamily: "Inter",
    badgeStyle: "bottom-bar",
    artFilter: "none",
    desc: "Clean minimal layouts, academic dark blue colors & legible classic styling.",
    accentColor: "border-blue-200 bg-blue-50/50",
    gradient: "from-blue-400 to-sky-500",
    referenceImage: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&auto=format&fit=crop&q=80"
  }
];

const SAMPLE_IMAGES = [
  {
    name: "🐱 Playful Kitten",
    url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "☕ Cozy Coffee",
    url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "🌵 Succulent",
    url: "https://images.unsplash.com/photo-1520302630591-fd1c66ed11db?w=600&auto=format&fit=crop&q=80"
  }
];


interface ScatteredSticker {
  id: string;
  emoji: string;
  name: string;
  url: string;
  top: number;
  left: number;
  tilt: number;
  pinColor: string;
  borderRadius: string;
}

const STICKER_POOL = [
  { emoji: "🌵", name: "Succulent", url: "https://images.unsplash.com/photo-1520302630591-fd1c66ed11db?w=600&auto=format&fit=crop&q=80" },
  { emoji: "🐱", name: "Kitten", url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80" },
  { emoji: "☕", name: "Coffee", url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80" },
  { emoji: "🚀", name: "Doodle", url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80" },
  { emoji: "🍄", name: "Mushroom", url: "https://images.unsplash.com/photo-1594911774802-8822a707cbb3?w=600&auto=format&fit=crop&q=80" },
  { emoji: "🧸", name: "Teddy", url: "https://images.unsplash.com/photo-1559251606-c623743a6d76?w=600&auto=format&fit=crop&q=80" },
  { emoji: "🌈", name: "Rainbow", url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80" },
  { emoji: "🍦", name: "Ice Cream", url: "https://images.unsplash.com/photo-1501443762531-d25b40f6e1c9?w=600&auto=format&fit=crop&q=80" },
  { emoji: "🍕", name: "Pizza", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80" },
  { emoji: "🥑", name: "Avocado", url: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&auto=format&fit=crop&q=80" }
];

const PIN_COLORS = ["bg-pink", "bg-mint", "bg-yellow", "bg-purple-500", "bg-blue-500", "bg-orange-500"];
const BORDER_SHAPES = [
  "rounded-[38%_62%_55%_45%_/_45%_40%_60%_55%]",
  "rounded-[45%_55%_40%_60%_/_50%_40%_60%_50%]",
  "rounded-[60%_40%_50%_50%_/_40%_50%_50%_60%]",
  "rounded-[50%]",
  "rounded-[30%_70%_70%_30%_/_50%_30%_70%_50%]",
  "rounded-[40%_60%_35%_65%_/_60%_35%_65%_40%]"
];

const generateRandomScatteredStickers = (): ScatteredSticker[] => {
  return [
    {
      id: "sticker-cactus",
      emoji: "🌵",
      name: "Succulent",
      url: "https://images.unsplash.com/photo-1520302630591-fd1c66ed11db?w=600&auto=format&fit=crop&q=80",
      top: 1.6,
      left: -7,
      tilt: -12,
      pinColor: "bg-pink",
      borderRadius: "rounded-[45%_55%_40%_60%_/_50%_40%_60%_50%]"
    },
    {
      id: "sticker-cat",
      emoji: "🐱",
      name: "Kitten",
      url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80",
      top: 74,
      left: 8,
      tilt: 10,
      pinColor: "bg-pink",
      borderRadius: "rounded-[38%_62%_55%_45%_/_45%_40%_60%_55%]"
    },
    {
      id: "sticker-rocket",
      emoji: "🚀",
      name: "Doodle",
      url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
      top: 18,
      left: 91,
      tilt: 20,
      pinColor: "bg-pink",
      borderRadius: "rounded-[40%_60%_35%_65%_/_60%_35%_65%_40%]"
    },
    {
      id: "sticker-mushroom",
      emoji: "🍄",
      name: "Mushroom",
      url: "https://images.unsplash.com/photo-1594911774802-8822a707cbb3?w=600&auto=format&fit=crop&q=80",
      top: 58,
      left: 80,
      tilt: -10,
      pinColor: "bg-pink",
      borderRadius: "rounded-[60%_40%_50%_50%_/_40%_50%_50%_60%]"
    }
  ];
};

export default function App() {
  const [selectedPreset, setSelectedPreset] = useState<StylePresetInfo>(STYLE_PRESETS[0]);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [cutoutImage, setCutoutImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [customText, setCustomText] = useState<string>("");
  
  // HD Image Quality Fine-Tuning states
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [sharpness, setSharpness] = useState<number>(25); // Default to 25% sharpness for a solid crisp look
  
  // Precise Cut & Background isolation states
  const [tolerance, setTolerance] = useState<number>(55); // Background threshold (10-120)
  const [feather, setFeather] = useState<number>(2); // Smoothing iterations (0-5)
  const [activeArtFilter, setActiveArtFilter] = useState<string>("none");
  const [borderThickness, setBorderThickness] = useState<number>(24);
  const [shadowBlur, setShadowBlur] = useState<number>(14);
  const [isTuningPanelOpen, setIsTuningPanelOpen] = useState<boolean>(true);

  // Sync activeArtFilter with the selected style preset on load or change
  useEffect(() => {
    setActiveArtFilter(selectedPreset.artFilter || "none");
  }, [selectedPreset]);
  const [removeBgResult, setRemoveBgResult] = useState<string | null>(null);
  const [isUsingRemoveBg, setIsUsingRemoveBg] = useState<boolean | null>(null);
  const [removeBgError, setRemoveBgError] = useState<string | null>(null);
  
  // Sticker options returned by the server
  const [stickerOptions, setStickerOptions] = useState<any[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const [finalStickerDataUrl, setFinalStickerDataUrl] = useState<string>("");
  const [downloading4K, setDownloading4K] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"create" | "library">("create");
  const [currentPage, setCurrentPage] = useState<"creator" | "how-it-works" | "finishes" | "about">("creator");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateTo = (page: "creator" | "how-it-works" | "finishes" | "about") => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [scatteredStickers, setScatteredStickers] = useState<ScatteredSticker[]>([]);

  useEffect(() => {
    setScatteredStickers(generateRandomScatteredStickers());
  }, []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Force light mode only by ensuring documentElement does not have "dark" class
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // Background removal utility running on client side (using boundary-connected BFS flood-fill)
  const processCutout = (imageSrc: string, toleranceVal = 55, featherPasses = 2): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      if (!imageSrc.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => {
        // Resize to 1600px max dimension for ultra-high-definition (HD) processing
        const maxDim = 1600;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);

        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          const width = canvas.width;
          const height = canvas.height;

          // Visited array to mark pixels that are part of the outer background
          const visited = new Uint8Array(width * height);

          // Sample 4 corner colors
          const corners = [
            { r: data[0], g: data[1], b: data[2] },
            { r: data[(width - 1) * 4], g: data[(width - 1) * 4 + 1], b: data[(width - 1) * 4 + 2] },
            { r: data[(height - 1) * width * 4], g: data[(height - 1) * width * 4 + 1], b: data[(height - 1) * width * 4 + 2] },
            { r: data[data.length - 4], g: data[data.length - 3], b: data[data.length - 2] }
          ];

          // BFS Flat Queue
          const queue = new Int32Array(width * height);
          let head = 0;
          let tail = 0;

          // Helper to check if a pixel is similar to any of the corner/background colors
          // Adjusted threshold dynamically based on the toleranceVal slider
          const seedThreshold = toleranceVal;
          const isBackgroundSeed = (r: number, g: number, b: number) => {
            if (r > 235 && g > 235 && b > 235) return true;
            for (const corner of corners) {
              const dist = Math.sqrt(
                Math.pow(r - corner.r, 2) +
                Math.pow(g - corner.g, 2) +
                Math.pow(b - corner.b, 2)
              );
              if (dist < seedThreshold) return true;
            }
            return false;
          };

          const push = (x: number, y: number) => {
            const idx = y * width + x;
            if (visited[idx] === 0) {
              visited[idx] = 1;
              queue[tail++] = idx;
            }
          };

          // Seed outer bounds of the image (top and bottom edges)
          for (let x = 0; x < width; x++) {
            // Top row
            let i = x * 4;
            if (isBackgroundSeed(data[i], data[i+1], data[i+2])) {
              push(x, 0);
            }
            // Bottom row
            i = ((height - 1) * width + x) * 4;
            if (isBackgroundSeed(data[i], data[i+1], data[i+2])) {
              push(x, height - 1);
            }
          }

          // Seed left and right edges
          for (let y = 0; y < height; y++) {
            // Left col
            let i = (y * width) * 4;
            if (isBackgroundSeed(data[i], data[i+1], data[i+2])) {
              push(0, y);
            }
            // Right col
            i = (y * width + (width - 1)) * 4;
            if (isBackgroundSeed(data[i], data[i+1], data[i+2])) {
              push(width - 1, y);
            }
          }

          // Neighbors offsets
          const neighborX = [-1, 1, 0, 0];
          const neighborY = [0, 0, -1, 1];

          // Run high-speed boundary-connected BFS flood fill
          while (head < tail) {
            const idx = queue[head++];
            const x = idx % width;
            const y = Math.floor(idx / width);

            for (let i = 0; i < 4; i++) {
              const nx = x + neighborX[i];
              const ny = y + neighborY[i];

              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = ny * width + nx;
                if (visited[nIdx] === 0) {
                  const p = nIdx * 4;
                  if (isBackgroundSeed(data[p], data[p+1], data[p+2])) {
                    visited[nIdx] = 1;
                    queue[tail++] = nIdx;
                  }
                }
              }
            }
          }

          // Form an alpha mask: Opaque (255) for subject, Transparent (0) for background
          const mask = new Uint8ClampedArray(width * height);
          mask.fill(255);
          for (let i = 0; i < width * height; i++) {
            if (visited[i] === 1) {
              mask[i] = 0;
            }
          }

          // Smooth/Feather the edges of the mask to prevent jagged borders
          const smoothedMask = new Uint8ClampedArray(width * height);
          smoothedMask.set(mask);

          for (let pass = 0; pass < featherPasses; pass++) {
            for (let y = 1; y < height - 1; y++) {
              for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                if (mask[idx] > 0) {
                  let sum = 0;
                  let count = 0;
                  for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                      sum += mask[(y + dy) * width + (x + dx)];
                      count++;
                    }
                  }
                  smoothedMask[idx] = Math.round(sum / count);
                }
              }
            }
            mask.set(smoothedMask);
          }

          // Apply smoothed mask to pixel alpha channels
          for (let i = 0; i < width * height; i++) {
            data[i * 4 + 3] = Math.min(data[i * 4 + 3], mask[i]);
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (err) {
          console.error("Image processing error", err);
          resolve(imageSrc);
        }
      };
      img.onerror = () => resolve(imageSrc);
      img.src = imageSrc;
    });
  };

  // Compress and resize the original image for the Gemini AI model to process without memory/alpha-transparency failures
  const compressAndResizeImage = (dataUrl: string, maxDimension: number = 600): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      if (!dataUrl.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => {
        try {
          let width = img.width || 512;
          let height = img.height || 512;
          if (width <= 0) width = 512;
          if (height <= 0) height = 512;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width) || 1;
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height) || 1;
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          // Fill white background first so transparent regions in PNG are not drawn as black in JPEG
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          // Export as JPEG with 0.8 quality to minimize size and remove transparent/alpha-channel complications
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } catch (err) {
          console.error("Error resizing/compressing image:", err);
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Prepare and normalize the image to a safe max dimension (e.g. 2048px) before sending it to the background removal API.
  // This guarantees that massive or complex image payloads (HEIC, corrupt EXIF orientations, giant dimensions) are cleaned and normalized.
  const prepareImageForRemoveBg = (dataUrl: string, maxDimension: number = 2048): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      if (!dataUrl.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => {
        try {
          let width = img.width || 512;
          let height = img.height || 512;
          if (width <= 0) width = 512;
          if (height <= 0) height = 512;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width) || 1;
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height) || 1;
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Solid white background to safely flatten transparent PNG files and avoid alpha-channel/black issues in JPEG export
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } catch (err) {
          console.error("Error preparing image for background removal:", err);
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Main sticker generator pipeline
  const generateStickerPipeline = async (imageSrc: string) => {
    setGenerating(true);
    setError(null);
    setWarning(null);
    setOriginalImage(imageSrc);
    setRemoveBgResult(null);
    setIsUsingRemoveBg(null);
    setRemoveBgError(null);

    try {
      // Step 1: Background removal via Remove.bg with automatic client-side fallback
      setGenerationStep(" Isolating background subject...");
      let cutout = "";
      try {
        const optimizedSrc = await prepareImageForRemoveBg(imageSrc, 2048);
        const response = await fetch("/api/remove-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: optimizedSrc })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.dataUrl) {
            cutout = data.dataUrl;
            setRemoveBgResult(data.dataUrl);
            setIsUsingRemoveBg(true);
            setRemoveBgError(null);
            console.log("Isolated background with high-precision Remove.bg API.");
          }
        } else {
          const data = await response.json().catch(() => ({}));
          if (data.code === "MISSING_API_KEY") {
            setIsUsingRemoveBg(false);
          } else {
            console.warn("Remove.bg API failed:", data.error);
            setRemoveBgError(data.error || "Remove.bg API failed");
            setIsUsingRemoveBg(false);
          }
        }
      } catch (err: any) {
        console.warn("Failed to contact background removal API:", err);
        setIsUsingRemoveBg(false);
      }

      if (!cutout) {
        try {
          console.log("Attempting client-side AI background removal using @imgly/background-removal...");
          setGenerationStep(" Removing background using local AI (first time takes a few seconds)...");
          const { removeBackground } = await import("@imgly/background-removal");
          const imageBlob = await removeBackground(imageSrc, {
            progress: (key, current, total) => {
              const pct = total ? Math.round((current / total) * 100) : "";
              setGenerationStep(` Loading local AI models (${pct}%)...`);
            }
          });
          cutout = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(imageBlob);
          });
          setRemoveBgResult(cutout);
          setIsUsingRemoveBg(true);
          setRemoveBgError(null);
          console.log("Isolated background with client-side AI background removal successfully.");
        } catch (imglyErr: any) {
          console.warn("Client-side AI background removal failed:", imglyErr);
          setRemoveBgError(imglyErr.message || "Local AI background removal failed");
        }
      }

      if (!cutout) {
        // Fallback to high-definition client-side flood fill
        setGenerationStep(" Isolating subject using color tolerance...");
        cutout = await processCutout(imageSrc, tolerance, feather);
      }
      setCutoutImage(cutout);

      // Step 2: Request personalized styles from server
      setGenerationStep(" Generating custom quotes & design presets...");
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stylePreset: selectedPreset.id,
          customText: customText
        })
      });

      if (!response.ok) {
        throw new Error("Sticker generation service returned an error. Please try again.");
      }

      const data = await response.json();
      if (data.stickers && data.stickers.length > 0) {
        setStickerOptions(data.stickers);
        setSelectedOptionIndex(0);
        if (data.warning) {
          setWarning(data.warning);
        }
      } else {
        throw new Error("Failed to design smart layouts.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during generation.");
    } finally {
      setGenerating(false);
    }
  };

  // Generate a sticker from a text description using AI
  const generateStickerFromText = async (promptText: string) => {
    if (!promptText.trim()) {
      setError("Please type a description of the sticker you want to generate first!");
      return;
    }
    setGenerating(true);
    setGenerationStep(" Creating your custom illustration using AI...");
    setError(null);
    setWarning(null);
    setOriginalImage(null);
    setCutoutImage(null);
    setStickerOptions([]);
    setFinalStickerDataUrl("");
    setRemoveBgResult(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          stylePreset: selectedPreset.name
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate image. Please check your AI API key configuration.");
      }

      const data = await response.json();
      if (!data.dataUrl) {
        throw new Error("No image data returned from AI image generator.");
      }

      console.log("Image successfully generated using AI. Isolate background using background removal...");
      setGenerationStep(" Isolating sticker background subject...");
      
      // Call the main pipeline to remove background and design layouts
      await generateStickerPipeline(data.dataUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate AI sticker.");
      setGenerating(false);
    }
  };

  // Automatically re-run precise cutout when originalImage, tolerance or feather changes
  useEffect(() => {
    if (!originalImage || generating) return;
    
    // If we successfully retrieved a Remove.bg cutout, skip client-side re-processing to preserve quality and credits
    if (removeBgResult) {
      setCutoutImage(removeBgResult);
      return;
    }

    const timer = setTimeout(() => {
      processCutout(originalImage, tolerance, feather).then((cutout) => {
        setCutoutImage(cutout);
      });
    }, 120); // Smooth dragging debounce
    return () => clearTimeout(timer);
  }, [originalImage, tolerance, feather, generating, removeBgResult]);

  // Re-render sticker to the master canvas whenever cutout image or sticker configs change
  useEffect(() => {
    if (!cutoutImage || stickerOptions.length === 0 || !canvasRef.current) return;

    const opt = stickerOptions[selectedOptionIndex];
    const config: StickerConfig = {
      id: opt.id,
      themeName: opt.themeName,
      quoteText: opt.quoteText,
      emoji: opt.emoji || selectedPreset.emoji,
      backgroundColor: opt.backgroundColor || selectedPreset.bgColor,
      textColor: opt.textColor || selectedPreset.textColor,
      badgeStyle: opt.badgeStyle || selectedPreset.badgeStyle,
      fontSize: 28,
      fontFamily: selectedPreset.fontFamily,
      outlineColor: "#ffffff",
      outlineWidth: 4,
      borderThickness: borderThickness,
      shadowBlur: shadowBlur,
      shadowColor: "rgba(0,0,0,0.18)",
      rotation: 0,
      scale: 1,
      stickerSize: "medium",
      decorations: [],
      artFilter: activeArtFilter as any,
      brightness: brightness,
      contrast: contrast,
      saturation: saturation,
      sharpness: sharpness
    };

    renderStickerToCanvas(canvasRef.current, cutoutImage, config).then(() => {
      if (canvasRef.current) {
        setFinalStickerDataUrl(canvasRef.current.toDataURL("image/png"));
      }
    });
  }, [cutoutImage, stickerOptions, selectedOptionIndex, selectedPreset, generating, brightness, contrast, saturation, sharpness, borderThickness, shadowBlur, activeArtFilter]);

  // Handle uploaded files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if the file is a JPG/JPEG
    const isJpg = file.type === "image/jpeg" || file.type === "image/jpg" || 
                  file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".jpeg");

    if (!isJpg) {
      setError("Supports only JPG & JPEG format");
      setGenerating(false);
      setOriginalImage(null);
      setCutoutImage(null);
      setStickerOptions([]);
      setFinalStickerDataUrl("");
      // Reset input value so the same file can be selected again
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        generateStickerPipeline(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle preset sample images
  const handleSampleSelect = async (url: string) => {
    setGenerating(true);
    setGenerationStep(" Fetching sample image...");
    try {
      const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error("Failed to load proxy sample");
      }
      const data = await response.json();
      if (data.dataUrl) {
        generateStickerPipeline(data.dataUrl);
      } else {
        throw new Error("Sample format invalid");
      }
    } catch (err: any) {
      console.error(err);
      setError("Unable to download the sample image due to a network error.");
      setGenerating(false);
    }
  };

  // Trigger Download
  const downloadSticker = async () => {
    if (!cutoutImage || stickerOptions.length === 0) return;
    setDownloading4K(true);

    try {
      const opt = stickerOptions[selectedOptionIndex];
      const config: StickerConfig = {
        id: opt.id,
        themeName: opt.themeName,
        quoteText: opt.quoteText,
        emoji: opt.emoji || selectedPreset.emoji,
        backgroundColor: opt.backgroundColor || selectedPreset.bgColor,
        textColor: opt.textColor || selectedPreset.textColor,
        badgeStyle: opt.badgeStyle || selectedPreset.badgeStyle,
        fontSize: 28,
        fontFamily: selectedPreset.fontFamily,
        outlineColor: "#ffffff",
        outlineWidth: 4,
        borderThickness: borderThickness,
        shadowBlur: shadowBlur,
        shadowColor: "rgba(0,0,0,0.18)",
        rotation: 0,
        scale: 1,
        stickerSize: "medium",
        decorations: [],
        artFilter: activeArtFilter as any,
        brightness: brightness,
        contrast: contrast,
        saturation: saturation,
        sharpness: sharpness
      };

      // Create an offscreen canvas for professional high-fidelity 4K rendering (4000x4000 px)
      const offscreenCanvas = document.createElement("canvas");
      await renderStickerToCanvas(offscreenCanvas, cutoutImage, config, 4000);

      // Export using high-performance Blob and Object URL instead of memory-heavy base64 string
      const blob = await new Promise<Blob | null>((resolve) => offscreenCanvas.toBlob(resolve, "image/png"));
      if (!blob) {
        throw new Error("Failed to create high-resolution PNG blob from canvas.");
      }
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.style.display = "none";
      link.download = `sticker_4k_${selectedPreset.id}_${Date.now()}.png`;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err: any) {
      console.error("Failed to generate high-resolution 4K image:", err);
      // Fallback to downloading the preview canvas data if offscreen generation fails
      if (finalStickerDataUrl) {
        try {
          const res = await fetch(finalStickerDataUrl);
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.style.display = "none";
          link.download = `sticker_fallback_${selectedPreset.id}_${Date.now()}.png`;
          link.href = blobUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } catch (fallbackErr) {
          const link = document.createElement("a");
          link.style.display = "none";
          link.download = `sticker_fallback_${selectedPreset.id}_${Date.now()}.png`;
          link.href = finalStickerDataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } finally {
      setDownloading4K(false);
    }
  };

  // Trigger Sheet Printing
  const printStickerSheet = () => {
    window.print();
  };

  // Reset/Start over
  const handleStartOver = () => {
    setOriginalImage(null);
    setCutoutImage(null);
    setStickerOptions([]);
    setFinalStickerDataUrl("");
    setCustomText("");
    setError(null);
    setWarning(null);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSharpness(25);
    setTolerance(55);
    setFeather(2);
    setBorderThickness(24);
    setShadowBlur(14);
    setActiveArtFilter("none");
  };

  return (
    <div className="min-h-screen bg-kraft dark:bg-zinc-950 text-ink flex flex-col font-sans transition-colors duration-200 animate-fade-in">
      
      {/* RETRO STICKY STICKR NAV BAR */}
      <nav className="sticky top-3 z-50 bg-[#FFFDF8] dark:bg-zinc-900 border-3 border-ink rounded-2xl shadow-[4px_4px_0_var(--ink)] mx-4 my-2 print:hidden transition-all duration-200">
        <div className="flex items-center justify-between px-3 md:px-4 py-2.5 max-w-6xl mx-auto gap-3">
          
          {/* Left: Mobile Hamburger and Branding */}
          <div className="flex items-center gap-2.5">
            {/* Hamburger Button (only visible on mobile, hidden on desktop md:hidden) */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 border-2 border-ink bg-[#FFFDF8] dark:bg-zinc-800 rounded-xl hover:bg-yellow active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-ink dark:text-white" /> : <Menu className="w-4 h-4 text-ink dark:text-white" />}
            </button>

            {/* Brand Logo & Name */}
            <div 
              className="flex items-center gap-1.5 sm:gap-2 font-fredoka font-bold text-base sm:text-lg md:text-xl cursor-pointer select-none shrink-0" 
              onClick={() => { navigateTo("creator"); handleStartOver(); }}
            >
              <span className="w-6 h-6 sm:w-7 sm:h-7 bg-pink text-white rounded-[40%_60%_55%_45%_/_50%_45%_55%_50%] border-2 border-ink flex items-center justify-center text-[10px] sm:text-xs rotate-[-8deg] shadow-sm shrink-0">★</span>
              <span className="text-ink dark:text-white inline">Stickr</span>
            </div>
          </div>
          
          {/* Middle: Desktop-only Page Tabs */}
          <div className="hidden md:flex items-center gap-5 md:gap-7 font-sans font-semibold text-[0.85rem] md:text-[0.95rem]">
            <button 
              onClick={() => navigateTo("creator")} 
              className={`hover:text-pink transition-all duration-150 cursor-pointer whitespace-nowrap pb-0.5 border-b-2 ${currentPage === "creator" ? "border-pink text-pink font-bold scale-105" : "border-transparent text-ink/60 dark:text-white/60"}`}
            >
              Home
            </button>
            <button 
              onClick={() => navigateTo("how-it-works")} 
              className={`hover:text-pink transition-all duration-150 cursor-pointer whitespace-nowrap pb-0.5 border-b-2 ${currentPage === "how-it-works" ? "border-pink text-pink font-bold scale-105" : "border-transparent text-ink/60 dark:text-white/60"}`}
            >
              How it works
            </button>
            <button 
              onClick={() => navigateTo("finishes")} 
              className={`hover:text-pink transition-all duration-150 cursor-pointer whitespace-nowrap pb-0.5 border-b-2 ${currentPage === "finishes" ? "border-pink text-pink font-bold scale-105" : "border-transparent text-ink/60 dark:text-white/60"}`}
            >
              Finishes
            </button>
            <button 
              onClick={() => navigateTo("about")} 
              className={`hover:text-pink transition-all duration-150 cursor-pointer whitespace-nowrap pb-0.5 border-b-2 ${currentPage === "about" ? "border-pink text-pink font-bold scale-105" : "border-transparent text-ink/60 dark:text-white/60"}`}
            >
              About
            </button>
          </div>

          {/* Right: Start Over Action Button */}
          <button 
            onClick={() => {
              navigateTo("creator");
              handleStartOver();
            }}
            className="nav-cta bg-ink text-white dark:bg-white dark:text-ink px-2.5 py-1.5 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full font-fredoka font-semibold text-[9px] sm:text-[10px] md:text-xs border-2 border-ink transition-all hover:scale-105 hover:rotate-[-1deg] hover:bg-pink hover:text-ink hover:border-ink cursor-pointer shrink-0"
          >
            Start Over ★
          </button>
        </div>

        {/* Mobile Left Sidebar Drawer Overlay & Backdrop */}
        <div 
          className={`fixed inset-0 bg-ink/20 z-50 transition-opacity duration-300 md:hidden print:hidden ${
            mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />
        
        <div 
          className={`fixed top-0 left-0 h-full w-[200px] bg-[#FFFDF8] dark:bg-zinc-900 border-r-2 border-ink z-51 shadow-xl transition-transform duration-300 ease-out md:hidden print:hidden flex flex-col justify-between ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div>
            {/* Drawer Header */}
            <div className="p-3 border-b border-dashed border-ink/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-fredoka font-bold text-sm">
                <span className="w-5.5 h-5.5 bg-pink text-white rounded-[40%_60%_55%_45%_/_50%_45%_55%_50%] border-1.5 border-ink flex items-center justify-center text-[10px] rotate-[-8deg] shadow-xs">★</span>
                <span className="text-ink dark:text-white">Stickr</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 border border-ink bg-white dark:bg-zinc-800 rounded-lg hover:bg-pink transition-all cursor-pointer flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-3.5 h-3.5 text-ink dark:text-white" />
              </button>
            </div>

            {/* Vertical Links List */}
            <div className="p-2.5 flex flex-col gap-1 font-sans font-semibold text-xs">
              <button 
                onClick={() => navigateTo("creator")} 
                className={`text-left py-1.5 px-2.5 rounded-lg border hover:bg-[#FFE3EC] transition-all flex items-center justify-between cursor-pointer ${currentPage === "creator" ? "border-ink bg-[#FFE3EC] text-pink font-bold" : "border-transparent text-ink dark:text-white"}`}
              >
                <span>Home</span>
              </button>
              <button 
                onClick={() => navigateTo("how-it-works")} 
                className={`text-left py-1.5 px-2.5 rounded-lg border hover:bg-[#FFE3EC] transition-all flex items-center justify-between cursor-pointer ${currentPage === "how-it-works" ? "border-ink bg-[#FFE3EC] text-pink font-bold" : "border-transparent text-ink dark:text-white"}`}
              >
                <span>How it works</span>
              </button>
              <button 
                onClick={() => navigateTo("finishes")} 
                className={`text-left py-1.5 px-2.5 rounded-lg border hover:bg-[#FFE3EC] transition-all flex items-center justify-between cursor-pointer ${currentPage === "finishes" ? "border-ink bg-[#FFE3EC] text-pink font-bold" : "border-transparent text-ink dark:text-white"}`}
              >
                <span>Finishes</span>
              </button>
              <button 
                onClick={() => navigateTo("about")} 
                className={`text-left py-1.5 px-2.5 rounded-lg border hover:bg-[#FFE3EC] transition-all flex items-center justify-between cursor-pointer ${currentPage === "about" ? "border-[#FF4E72] bg-[#FFE3EC] text-pink font-bold" : "border-transparent text-ink dark:text-white"}`}
              >
                <span>About</span>
              </button>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-3 border-t border-dashed border-ink/10 text-[9px] font-mono text-[#8a7a60] dark:text-amber-100/40 text-center">
            <span>© 2026 Stickr</span>
          </div>
        </div>
      </nav>

      {/* RENDER ACTIVE STATE-DRIVEN PAGE */}
      <main className="flex-1">
        {currentPage === "creator" && (
          <>
            {/* CORKBOARD HERO SECTION */}
            {!(originalImage && !generating) && (
              <section className="relative py-16 md:py-20 px-6 border-b-2 border-dashed border-line overflow-hidden bg-[repeating-linear-gradient(135deg,rgba(185,154,103,0.1)_0px,rgba(185,154,103,0.1)_2px,transparent_2px,transparent_18px)] bg-kraft-dark transition-colors duration-200 print:hidden">
                
                {/* Scattered background stickers across the entire section container */}
                {scatteredStickers.map((sticker) => {
                  // Responsive positioning classes based on sticker id to fit elegantly in both mobile & desktop
                  let placementClass = "";
                  if (sticker.id === "sticker-cactus") {
                    placementClass = "left-2 sm:left-[-7%]";
                  } else if (sticker.id === "sticker-cat") {
                    placementClass = "left-3 sm:left-[8%]";
                  } else if (sticker.id === "sticker-rocket") {
                    placementClass = "right-2 sm:right-auto sm:left-[91%]";
                  } else if (sticker.id === "sticker-mushroom") {
                    placementClass = "right-3 sm:right-auto sm:left-[80%]";
                  } else {
                    placementClass = `left-[${sticker.left}%]`;
                  }

                  return (
                    <div 
                      key={sticker.id}
                      className={`absolute pin-sticker transition-all duration-300 z-20 scale-75 md:scale-100 opacity-90 md:opacity-100 hover:opacity-100 hover:scale-105 active:scale-95 ${placementClass}`} 
                      style={{ 
                        top: `${sticker.top}%`, 
                        transform: `rotate(${sticker.tilt}deg)`,
                        "--tilt": `${sticker.tilt}deg` 
                      } as React.CSSProperties}
                    >
                      {/* The Sticker Peel Card */}
                      <div 
                        className={`peel w-20 h-20 sm:w-26 sm:h-26 bg-white border-3 border-ink flex flex-col items-center justify-center shadow-md text-center group font-sans relative ${sticker.borderRadius}`}
                      >
                        <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">{sticker.emoji}</span>
                        <span className="text-[8px] sm:text-[9px] font-mono font-bold text-ink/70 mt-1 uppercase truncate max-w-full px-1">{sticker.name}</span>
                      </div>
                    </div>
                  );
                })}

                <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Hero Content */}
                <div className="lg:col-span-7 space-y-6">
                  <span className="eyebrow inline-flex items-center gap-2 bg-white dark:bg-ink border-2 border-ink px-3.5 py-1.5 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider rotate-[-2deg] shadow-[3px_3px_0_var(--ink)]">
                    ● No design skills needed
                  </span>
                  <h1 className="font-fredoka font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.98] tracking-tight text-ink">
                    Turn anything into a <span className="text-pink drop-shadow-[2.5px_2.5px_0_var(--ink)]" style={{ WebkitTextStroke: "2px var(--ink)" }}>sticker</span>
                  </h1>
                  <p className="text-lg md:text-xl text-[#4a3c2c] dark:text-amber-100/70 max-w-[44ch] leading-relaxed">
                    Describe it, doodle it, or drop in a photo. Stickr generates die-cut-ready sticker art in seconds — then ships it to your door.
                  </p>

                  {/* Micro input or active status */}
                  {!originalImage && !generating && (
                    <div className="space-y-4 max-w-xl">
                      <div className="machine bg-white dark:bg-zinc-900 border-3 border-ink rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-[6px_6px_0_var(--ink)]">
                        <input 
                          type="text" 
                          placeholder="Describe a sticker (e.g. 'a cute wizard frog') or enter quote..." 
                          className="flex-1 border-none bg-transparent font-sans text-base px-4 py-3 text-ink focus:outline-none dark:placeholder-amber-100/50"
                          id="hero-quote-input"
                          value={customText}
                          onChange={(e) => setCustomText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              generateStickerFromText(customText);
                            }
                          }}
                        />
                        <div className="flex gap-2 sm:flex-row flex-col">
                          <button 
                            onClick={() => {
                              if (customText.trim()) {
                                generateStickerFromText(customText);
                              } else {
                                document.getElementById("creator")?.scrollIntoView({ behavior: "smooth" });
                                fileInputRef.current?.click();
                              }
                            }}
                            className="bg-yellow hover:bg-pink text-ink font-fredoka font-bold text-xs border-2 border-ink rounded-xl px-5 py-3 cursor-pointer transition-all hover:scale-105 hover:rotate-[-0.5deg] flex items-center justify-center gap-1.5 shrink-0 shadow-[2px_2px_0_var(--ink)]"
                            id="upload-design-btn"
                          >
                            <span>Upload & design</span>
                          </button>
                        </div>
                      </div>
                      <p className="hint font-mono text-[11px] text-[#6b5b45] dark:text-amber-100/60 text-center font-bold">
                        *Supports only JPG & JPEG format
                      </p>
                    </div>
                  )}

                  {generating && (
                    <div className="bg-white dark:bg-zinc-900 border-3 border-ink rounded-2xl p-6 shadow-[6px_6px_0_var(--ink)] max-w-xl animate-fade-in space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 shrink-0">
                          <div className="absolute inset-0 rounded-full border-2 border-[#B99A67]/20"></div>
                          <div className="absolute inset-0 rounded-full border-2 border-pink border-t-transparent animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center text-lg">{selectedPreset.emoji}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-fredoka font-bold text-lg text-ink">Processing image...</h3>
                          <p className="font-mono text-xs text-ink/70 mt-1 animate-pulse truncate">
                            {generationStep || "Initializing AI pipeline..."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {originalImage && !generating && (
                    <div className="bg-white dark:bg-zinc-900 border-3 border-ink rounded-2xl p-5 shadow-[6px_6px_0_var(--ink)] max-w-xl animate-fade-in flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl border-2 border-ink overflow-hidden bg-kraft-dark shrink-0">
                          <img src={originalImage} className="w-full h-full object-cover" alt="Source" />
                        </div>
                        <div>
                          <h3 className="font-fredoka font-bold text-sm text-ink">Active Sticker Session</h3>
                          <p className="text-[10px] font-mono text-[#6b5b45] dark:text-amber-100/60">Subject cutout isolated</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleStartOver}
                        className="px-4 py-2 bg-[#FFE3EC] text-pink border-2 border-ink rounded-xl font-fredoka font-bold text-xs hover:bg-pink hover:text-white transition-all cursor-pointer"
                      >
                        Start Over
                      </button>
                    </div>
                  )}

                </div>

                {/* Right Column: Interactive Peeling Corkboard Stickers OR LIVE Canvas Workspace */}
                <div className="lg:col-span-5 flex justify-center relative">
                  
                  {/* WORKSPACE PREVIEW FRAME (When Image Session Active) */}
                  {(originalImage || generating) && (
                    <div className="w-full max-w-[340px] bg-white dark:bg-zinc-900 border-3 border-ink rounded-3xl p-5 shadow-[8px_8px_0_var(--ink)] relative animate-fade-in">
                      
                      <div className="w-full aspect-square bg-[#fafaf9] dark:bg-zinc-950/80 rounded-2xl border-2 border-ink/20 p-2 flex items-center justify-center overflow-hidden relative shadow-inner">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,#dfdfdf_25%,transparent_25%),linear-gradient(-45deg,#dfdfdf_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#dfdfdf_75%),linear-gradient(-45deg,transparent_75%,#dfdfdf_75%)] bg-[size:10px_10px] bg-[position:0_0,0_5px,5px_-5px,5px_0px] opacity-25 z-0"></div>
                        
                        {generating ? (
                          <div className="relative z-10 flex flex-col items-center space-y-2">
                            <div className="w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin"></div>
                            <span className="text-xs font-mono text-ink/70">Processing image</span>
                          </div>
                        ) : (
                          <canvas 
                            ref={canvasRef} 
                            className="w-full h-full object-contain relative z-10 filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.18)]"
                            id="master-sticker-canvas"
                          />
                        )}
                      </div>
                      
                      <div className="text-center mt-3">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#8a7a60] dark:text-amber-100/50">
                          Die-Cut Sticker Live Preview
                        </span>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </section>
            )}

      {/* PRINT-ONLY MASTER SHEET VIEW CONTAINER */}
      <div className="hidden print:block w-full text-center">
        <h2 className="text-2xl font-fredoka font-bold mb-6 text-ink">My Custom Stickers</h2>
        <div className="grid grid-cols-3 gap-8 justify-items-center">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="w-48 h-48 flex items-center justify-center border border-dashed border-line rounded-2xl p-2 bg-white shadow-xs">
              {finalStickerDataUrl ? (
                <img src={finalStickerDataUrl} alt="Sticker Copy" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="text-xs text-ink/40">Loading...</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CREATOR WORKSPACE NOTEPAD SECTION (Only active during an active image session) */}
      {(originalImage || generating) && (
        <section className="py-12 px-6 print:hidden max-w-6xl w-full mx-auto" id="creator">
          
          {/* ACTIVE DESIGNER WORKSPACE (Result screen) */}
          {originalImage && !generating && (
          <div className="bg-white dark:bg-zinc-900 border-3 border-ink rounded-3xl p-6 md:p-8 shadow-[8px_8px_0_var(--kraft-dark),_8px_8px_0_3px_var(--ink)] space-y-6 animate-fade-in">
            
            {/* Control Bar */}
            <div className="flex items-center justify-between border-b-2 border-dashed border-ink/10 pb-4">
              <button 
                onClick={handleStartOver}
                className="flex items-center gap-1.5 text-xs font-fredoka font-bold text-[#231a12]/75 hover:text-ink cursor-pointer transition-colors"
                id="back-btn"
              >
                <ArrowLeft className="w-4 h-4 text-pink" />
                <span>Start Over</span>
              </button>
              <span className="font-mono text-[10px] bg-[#EADFC5] dark:bg-zinc-800 text-ink px-3 py-1 rounded-full border border-ink font-bold uppercase tracking-wider">
                Workspace Active
              </span>
            </div>

            {/* Warning / Fallback Notice */}
            {warning && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border-3 border-ink text-ink rounded-2xl p-4 flex items-start gap-3 text-xs animate-fade-in shadow-[4px_4px_0_var(--ink)]">
                <span className="text-xl"></span>
                <div className="space-y-1">
                  <p className="font-fredoka font-bold text-[#b45309] dark:text-amber-200">Creative Presets Loaded</p>
                  <p className="text-ink/80 leading-relaxed font-mono text-[10px]">{warning}</p>
                </div>
              </div>
            )}

            {/* Workspace Editing Layout - side-by-side dual panel for all devices */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
              
              {/* Left Column: Big Sticker Canvas (always side-by-side) */}
              <div className="col-span-12 lg:col-span-6 flex flex-col items-center justify-center space-y-3">
                <div className="relative w-full aspect-square max-w-[340px] sm:max-w-[420px] lg:max-w-[500px] bg-[#FFFDF8] dark:bg-zinc-950 border-3 border-ink rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-[5px_5px_0_rgba(35,26,18,0.15)] sm:shadow-[8px_8px_0_rgba(35,26,18,0.15)] flex items-center justify-center overflow-hidden">
                  
                  {/* Grid background */}
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,#dfdfdf_25%,transparent_25%),linear-gradient(-45deg,#dfdfdf_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#dfdfdf_75%),linear-gradient(-45deg,transparent_75%,#dfdfdf_75%)] bg-[size:10px_10px] bg-[position:0_0,0_5px,5px_-5px,5px_0px] opacity-25 z-0"></div>
                  
                  <canvas 
                    ref={canvasRef} 
                    className="w-full h-full object-contain relative z-10 filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.18)]"
                    id="master-sticker-canvas"
                  />
                </div>
                <span className="text-[9px] sm:text-[11px] text-[#8a7a60] dark:text-amber-100/50 font-mono tracking-wider uppercase text-center font-bold">
                  Live Preview Canvas
                </span>
              </div>

              {/* Right Column: Style customization sliders and controls */}
              <div className="col-span-12 lg:col-span-6 space-y-4 sm:space-y-6">
                
                {/* Sticker Variations layout */}
                {stickerOptions.length > 0 && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-[8px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-[#8a7a60] dark:text-amber-100/50">
                      Choose layout preset:
                    </label>
                    <div className="grid grid-cols-1 gap-1.5 max-h-28 sm:max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {stickerOptions.map((opt, idx) => {
                        const isCurrent = selectedOptionIndex === idx;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => setSelectedOptionIndex(idx)}
                            className={`w-full text-left p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border-1.5 sm:border-2 transition-all duration-150 cursor-pointer flex items-center justify-between ${
                              isCurrent 
                                ? "border-ink bg-[#FFE3EC] shadow-sm scale-[1.01]"
                                : "border-ink/15 bg-[#FFFDF8] dark:bg-zinc-850 hover:border-ink/40 text-ink"
                            }`}
                            id={`option-card-${idx}`}
                          >
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                              <div className="truncate">
                                <p className="text-[7px] sm:text-[9px] font-mono font-bold text-ink/40 uppercase tracking-wide">
                                  {opt.themeName}
                                </p>
                                <p className="text-[10px] sm:text-xs font-fredoka font-semibold text-ink truncate">
                                  "{opt.quoteText}"
                                </p>
                              </div>
                            </div>
                            {isCurrent && (
                              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-ink text-white dark:bg-white dark:text-ink flex items-center justify-center text-[7px] sm:text-[8px] shrink-0">
                                <Check className="w-2.5 h-2.5 sm:w-3 h-3 stroke-[3px]" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quote direct manual tuning input */}
                {stickerOptions.length > 0 && stickerOptions[selectedOptionIndex] && (
                  <div className="space-y-1.5 sm:space-y-3 bg-[#EADFC5]/20 dark:bg-zinc-950/30 border-1.5 sm:border-2 border-ink rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-inner">
                    <label className="block text-[8px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-[#8a7a60] dark:text-amber-100/50">
                       Customize Active Quote Text
                    </label>
                    <div className="flex gap-1.5 sm:gap-2.5">
                      {/* Quote text input */}
                      <div className="flex-1 min-w-0">
                        <label className="block text-[7px] sm:text-[8px] text-ink/50 uppercase font-bold mb-0.5 sm:mb-1">Quote Text Badge</label>
                        <input
                          type="text"
                          value={stickerOptions[selectedOptionIndex].quoteText || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStickerOptions(prev => {
                              const updated = [...prev];
                              updated[selectedOptionIndex] = {
                                ...updated[selectedOptionIndex],
                                quoteText: val
                              };
                              return updated;
                            });
                          }}
                          className="w-full p-1.5 sm:p-2.5 border-1.5 sm:border-2 border-ink rounded-lg sm:rounded-xl text-[10px] sm:text-xs bg-white dark:bg-zinc-800 text-ink font-fredoka font-medium focus:outline-none"
                          placeholder="Type a custom quote..."
                          maxLength={80}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 🔧 COLLAPSIBLE STICKER CRAFT FINE-TUNER */}
                <div className="bg-[#FFFDF8] dark:bg-zinc-850 border-2 border-ink rounded-2xl overflow-hidden shadow-[4px_4px_0_var(--ink)]">
                  <button
                    onClick={() => setIsTuningPanelOpen(!isTuningPanelOpen)}
                    className="w-full text-left px-4 py-3 bg-[#EADFC5]/40 hover:bg-[#EADFC5]/60 transition-colors border-b-2 border-ink flex items-center justify-between font-fredoka font-bold text-xs sm:text-sm text-ink cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-pink" />
                      <span>🔧 Sticker Tuning Controls</span>
                    </span>
                    <span className="text-xs transition-transform duration-200">
                      {isTuningPanelOpen ? "▲ Collapse" : "▼ Expand & Fine-Tune"}
                    </span>
                  </button>

                  {isTuningPanelOpen && (
                    <div className="p-4 space-y-4 text-xs">
                      
                      {/* 1. ARTISTIC STYLES SELECT */}
                      <div className="space-y-1">
                        <label className="block font-mono text-[9px] uppercase tracking-wider text-[#8a7a60] dark:text-amber-100/50 font-bold">
                          Artistic Style / Filter
                        </label>
                        <select
                          value={activeArtFilter}
                          onChange={(e) => setActiveArtFilter(e.target.value)}
                          className="w-full p-2 border-2 border-ink rounded-xl bg-white dark:bg-zinc-800 text-ink font-sans text-xs focus:outline-none"
                        >
                          <option value="none">✨ High Fidelity Original (Recommended for Photos)</option>
                          <option value="cartoon">🎨 Cute Illustrated Cartoon</option>
                          <option value="anime">⚡ Cyber High-Contrast Anime</option>
                          <option value="watercolor">🍀 Watercolor Wash Effect</option>
                          <option value="sketch">✏️ Charcoal Pencil Sketch</option>
                          <option value="pop-art">💥 Pop Art Neon Saturation</option>
                          <option value="pixel-art">👾 8-Bit Retro Pixel Art</option>
                        </select>
                        <p className="text-[10px] font-mono text-ink/50 mt-1">
                          {activeArtFilter === "none" 
                            ? "// Keeps original photo pixels perfectly clean and high resolution." 
                            : "// Applies artistic filters over the cutout subject."}
                        </p>
                      </div>

                      {/* 2. DIE-CUT OUTLINE TUNING */}
                      <div className="border-t border-dashed border-ink/10 pt-3 space-y-3">
                        <h4 className="font-fredoka font-bold text-xs text-ink flex items-center gap-1.5">
                          <span>✂️</span> Die-Cut Outline & Shadow
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {/* Border Thickness */}
                          <div className="space-y-1">
                            <div className="flex justify-between font-mono text-[9px] text-ink/70">
                              <span>Border Thickness</span>
                              <span className="font-bold">{borderThickness}px</span>
                            </div>
                            <input
                              type="range"
                              min={8}
                              max={48}
                              value={borderThickness}
                              onChange={(e) => setBorderThickness(Number(e.target.value))}
                              className="w-full accent-pink cursor-pointer"
                            />
                          </div>

                          {/* Shadow Blur */}
                          <div className="space-y-1">
                            <div className="flex justify-between font-mono text-[9px] text-ink/70">
                              <span>Shadow Smoothness</span>
                              <span className="font-bold">{shadowBlur}px</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={30}
                              value={shadowBlur}
                              onChange={(e) => setShadowBlur(Number(e.target.value))}
                              className="w-full accent-pink cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. COLOR & LIGHT QUALITY ADJUSTMENTS */}
                      <div className="border-t border-dashed border-ink/10 pt-3 space-y-3">
                        <h4 className="font-fredoka font-bold text-xs text-ink flex items-center gap-1.5">
                          <span>🎨</span> Color & Sharpness Fine-Tuning
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Brightness */}
                          <div className="space-y-1">
                            <div className="flex justify-between font-mono text-[9px] text-ink/70">
                              <span>Brightness</span>
                              <span className="font-bold">{brightness}%</span>
                            </div>
                            <input
                              type="range"
                              min={50}
                              max={150}
                              value={brightness}
                              onChange={(e) => setBrightness(Number(e.target.value))}
                              className="w-full accent-pink cursor-pointer"
                            />
                          </div>

                          {/* Contrast */}
                          <div className="space-y-1">
                            <div className="flex justify-between font-mono text-[9px] text-ink/70">
                              <span>Contrast</span>
                              <span className="font-bold">{contrast}%</span>
                            </div>
                            <input
                              type="range"
                              min={50}
                              max={150}
                              value={contrast}
                              onChange={(e) => setContrast(Number(e.target.value))}
                              className="w-full accent-pink cursor-pointer"
                            />
                          </div>

                          {/* Saturation */}
                          <div className="space-y-1">
                            <div className="flex justify-between font-mono text-[9px] text-ink/70">
                              <span>Saturation</span>
                              <span className="font-bold">{saturation}%</span>
                            </div>
                            <input
                              type="range"
                              min={50}
                              max={150}
                              value={saturation}
                              onChange={(e) => setSaturation(Number(e.target.value))}
                              className="w-full accent-pink cursor-pointer"
                            />
                          </div>

                          {/* Sharpness */}
                          <div className="space-y-1">
                            <div className="flex justify-between font-mono text-[9px] text-ink/70">
                              <span>Crisp Sharpness</span>
                              <span className="font-bold">{sharpness}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={sharpness}
                              onChange={(e) => setSharpness(Number(e.target.value))}
                              className="w-full accent-pink cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 4. EDGE DETECTOR ADJUSTMENTS */}
                      {(!isUsingRemoveBg || isUsingRemoveBg === false) && (
                        <div className="border-t border-dashed border-ink/10 pt-3 space-y-3 bg-[#FFE3EC]/20 p-3 rounded-xl border border-dashed border-ink/10">
                          <h4 className="font-fredoka font-bold text-xs text-ink flex items-center gap-1.5">
                            <span>🔍</span> Manual Background Erasing
                          </h4>
                          <p className="text-[10px] text-ink/60 leading-relaxed font-mono">
                            Adjust detector parameters to clean up fuzzy/stray background colors.
                          </p>

                          <div className="grid grid-cols-2 gap-4">
                            {/* Tolerance */}
                            <div className="space-y-1">
                              <div className="flex justify-between font-mono text-[9px] text-ink/70">
                                <span>Eraser Range</span>
                                <span className="font-bold">{tolerance}</span>
                              </div>
                              <input
                                type="range"
                                min={10}
                                max={120}
                                value={tolerance}
                                onChange={(e) => setTolerance(Number(e.target.value))}
                                className="w-full accent-pink cursor-pointer"
                              />
                            </div>

                            {/* Feather */}
                            <div className="space-y-1">
                              <div className="flex justify-between font-mono text-[9px] text-ink/70">
                                <span>Border Smoothing</span>
                                <span className="font-bold">{feather}px</span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={5}
                                value={feather}
                                onChange={(e) => setFeather(Number(e.target.value))}
                                className="w-full accent-pink cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-1">
                  <button
                    onClick={downloadSticker}
                    disabled={downloading4K}
                    className="py-2 sm:py-3.5 px-2.5 sm:px-5 rounded-xl sm:rounded-2xl bg-ink text-white hover:bg-pink hover:text-ink font-fredoka font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-[2px_2px_0_var(--ink)] sm:shadow-[3px_3px_0_var(--ink)] transition-all border-1.5 sm:border-2 border-ink hover:scale-102 disabled:opacity-85 disabled:cursor-wait"
                    id="download-sticker-btn"
                  >
                    {downloading4K ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{downloading4K ? "Generating 4K PNG..." : "Download 4K PNG"}</span>
                  </button>

                  <button
                    onClick={printStickerSheet}
                    className="py-2 sm:py-3.5 px-2.5 sm:px-5 rounded-xl sm:rounded-2xl bg-[#FFFDF8] dark:bg-zinc-800 border-1.5 sm:border-2 border-ink hover:bg-yellow text-ink font-fredoka font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition-all shadow-[2px_2px_0_var(--ink)] sm:shadow-[3px_3px_0_var(--ink)] hover:scale-102"
                    id="print-sheet-btn"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print 12-Pack Sheet</span>
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ERROR STATUS CONTAINER */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/40 border-2 border-ink text-ink rounded-2xl flex items-start gap-2.5 text-xs animate-fade-in" id="error-banner">
            <AlertCircle className="w-4 h-4 text-pink shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-fredoka font-bold">Design Error Occurred</p>
              <p className="text-xs font-mono">{error}</p>
              <button 
                onClick={handleStartOver} 
                className="mt-1 text-xs font-bold underline cursor-pointer text-pink"
              >
                Try again
              </button>
            </div>
          </div>
        )}

            </section>
          )}
        </>
      )}

        {currentPage === "how-it-works" && (
          <section className="py-16 px-6 bg-[#FFFDF8] dark:bg-zinc-900 min-h-[70vh] flex items-center print:hidden">
            <div className="max-w-4xl mx-auto w-full space-y-12 animate-fade-in">
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <span className="eyebrow inline-flex items-center gap-2 bg-yellow border-2 border-ink px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider rotate-[-1deg] shadow-[3px_3px_0_var(--ink)]">
                   3-Step Process
                </span>
                <h1 className="font-fredoka font-bold text-4xl md:text-5xl lg:text-6xl text-ink leading-tight">
                  How Stickr Works
                </h1>
                <p className="text-sm md:text-base text-[#5a4a38] dark:text-amber-100/70 max-w-xl mx-auto">
                  Discover the high-definition magic behind our boundary-connected cutting path and real-time custom vinyl styling pipeline.
                </p>
              </div>

              {/* Steps Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
                <div className="bg-white border-3 border-ink rounded-2xl p-8 shadow-[6px_6px_0_var(--kraft-dark),_6px_6px_0_3px_var(--ink)] relative hover:scale-[1.02] transition-transform duration-200">
                  <span className="font-fredoka font-bold text-5xl text-pink mb-4 block" style={{ WebkitTextStroke: "1px var(--ink)" }}>01</span>
                  <h3 className="font-fredoka font-bold text-xl text-ink mb-3">Describe &amp; Upload</h3>
                  <p className="text-xs text-[#5a4a38] leading-relaxed mb-4">
                    Drag and drop a JPG/PNG or upload any image. Our dynamic algorithm isolates the subject immediately.
                  </p>
                  <div className="border-t border-dashed border-ink/10 pt-4 font-mono text-[9px] text-[#8a7a60]">
                    <strong className="text-ink">Under the hood:</strong>
                    <p className="mt-1">Multi-seed edge scan running completely in your browser for instant background extraction.</p>
                  </div>
                </div>

                <div className="bg-white border-3 border-ink rounded-2xl p-8 shadow-[6px_6px_0_var(--kraft-dark),_6px_6px_0_3px_var(--ink)] relative hover:scale-[1.02] transition-transform duration-200">
                  <span className="font-fredoka font-bold text-5xl text-mint mb-4 block" style={{ WebkitTextStroke: "1px var(--ink)" }}>02</span>
                  <h3 className="font-fredoka font-bold text-xl text-ink mb-3">Stylize &amp; Customize</h3>
                  <p className="text-xs text-[#5a4a38] leading-relaxed mb-4">
                    Type a customized quote, choose hand-painted filter presets, and select customized badge backgrounds or emojis.
                  </p>
                  <div className="border-t border-dashed border-ink/10 pt-4 font-mono text-[9px] text-[#8a7a60]">
                    <strong className="text-ink">Under the hood:</strong>
                    <p className="mt-1">Dynamic coordinate scaling overlays perfect graphic elements and text badges on your canvas.</p>
                  </div>
                </div>

                <div className="bg-white border-3 border-ink rounded-2xl p-8 shadow-[6px_6px_0_var(--kraft-dark),_6px_6px_0_3px_var(--ink)] relative hover:scale-[1.02] transition-transform duration-200">
                  <span className="font-fredoka font-bold text-5xl text-yellow mb-4 block" style={{ WebkitTextStroke: "1px var(--ink)" }}>03</span>
                  <h3 className="font-fredoka font-bold text-xl text-ink mb-3">Print &amp; Download</h3>
                  <p className="text-xs text-[#5a4a38] leading-relaxed mb-4">
                    Download transparent 300DPI PNG files, or output a print-ready 12-pack sheet with customized margins!
                  </p>
                  <div className="border-t border-dashed border-ink/10 pt-4 font-mono text-[9px] text-[#8a7a60]">
                    <strong className="text-ink">Under the hood:</strong>
                    <p className="mt-1">Vectorized cutting guidelines map precise plotter paths for beautiful physical sticker peeling.</p>
                  </div>
                </div>
              </div>

              {/* Sandbox Tracer Simulator */}
              <div className="bg-white border-3 border-ink rounded-3xl p-6 md:p-8 shadow-[8px_8px_0_var(--kraft-dark),_8px_8px_0_3px_var(--ink)] space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-fredoka font-bold text-xl text-ink"> Boundary Tracing Sandbox</h3>
                    <p className="text-xs text-[#8a7a60] font-mono mt-0.5">Interact below to see how our auto-die-cutter wraps your shapes!</p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentPage("creator");
                      window.scrollTo(0, 0);
                    }}
                    className="bg-pink text-white font-fredoka font-bold text-xs border-2 border-ink px-4 py-2.5 rounded-xl shadow-[3px_3px_0_var(--ink)] hover:scale-105 transition-all cursor-pointer"
                  >
                    Launch Creator Workspace
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <p className="text-sm text-ink/80 leading-relaxed">
                      Most programs leave messy white fragments around your artwork or cut through critical graphic elements.
                    </p>
                    <p className="text-xs text-[#5a4a38] leading-relaxed">
                      Our dynamic tracer scans pixel color values to calculate precise boundaries, then inflates outward by <strong>20 pixels</strong> to generate a thick, smooth sticker border that guarantees durable peel-off performance on laptops, bottles, or cases.
                    </p>
                    <div className="p-4 bg-kraft/40 rounded-2xl border-2 border-dashed border-ink/20 flex gap-3">
                      <span className="text-2xl shrink-0">💡</span>
                      <p className="text-[11px] font-mono text-[#5a4a38]">
                        Pro Tip: The calculated outline provides professional bleed-margin protection automatically. Your printed designs look flawless.
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-2 border-ink bg-kraft rounded-2xl p-6 flex flex-col items-center justify-center relative min-h-[220px]">
                    <div className="absolute top-3 left-3 font-mono text-[9px] uppercase tracking-wider text-ink/40">Trace Engine Visualizer</div>
                    <div className="relative w-28 h-28 flex items-center justify-center bg-white border-2 border-ink rounded-full shadow-md animate-bounce">
                      <span className="text-5xl animate-spin" style={{ animationDuration: "12s" }}>🌵</span>
                      <div className="absolute inset-[-8px] rounded-full border-4 border-dashed border-pink/60 animate-spin" style={{ animationDuration: "8s" }}></div>
                      <div className="absolute inset-[-14px] rounded-full border-2 border-ink/20"></div>
                    </div>
                    <span className="text-[10px] font-mono text-ink/60 mt-6 animate-pulse">Calculating outer path (148 points)...</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {currentPage === "finishes" && (
          <section className="py-16 px-6 bg-[#FFFDF8] dark:bg-zinc-900 min-h-[70vh] flex items-center print:hidden">
            <div className="max-w-5xl mx-auto w-full space-y-12 animate-fade-in">
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <span className="eyebrow inline-flex items-center gap-2 bg-mint border-2 border-ink px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider rotate-[1deg] shadow-[3px_3px_0_var(--ink)]">
                   Tactical Vinyl Coatings
                </span>
                <h1 className="font-fredoka font-bold text-4xl md:text-5xl lg:text-6xl text-ink leading-tight">
                  Premium Textures &amp; Finishes
                </h1>
                <p className="text-sm md:text-base text-[#5a4a38] dark:text-amber-100/70 max-w-xl mx-auto">
                  Every sticker needs the perfect reflection. Explore our 5 heavy-duty vinyl coatings designed to withstand weathering and sunlight.
                </p>
              </div>

              {/* 5 Tactile Coatings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Matte White */}
                <div className="bg-white border-3 border-ink rounded-2xl p-6 shadow-[5px_5px_0_var(--kraft-dark),_5px_5px_0_2.5px_var(--ink)] hover:translate-y-[-4px] transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-16 h-16 rounded-full border-2.5 border-ink bg-white shadow-[inset_0_0_0_8px_var(--kraft-dark)] mb-5 flex items-center justify-center text-xl font-bold">M</div>
                    <h3 className="font-fredoka font-bold text-lg text-ink mb-1">Matte White</h3>
                    <p className="font-mono text-[10px] text-pink uppercase tracking-wider font-bold mb-3">Satin Classic • Glare-Free</p>
                    <p className="text-xs text-[#5a4a38] leading-relaxed mb-4">
                      An elegant, premium look with soft tactile feedback. Perfect for illustrative designs, clean typography, and organic setups.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPreset(STYLE_PRESETS[3]); // cottagecore / matte
                      setCurrentPage("creator");
                      window.scrollTo(0, 0);
                    }}
                    className="w-full text-center py-2.5 bg-yellow hover:bg-pink font-fredoka font-bold text-xs border-2 border-ink rounded-xl transition-all cursor-pointer shadow-[2px_2px_0_var(--ink)] active:scale-95"
                  >
                    Select Matte Style 
                  </button>
                </div>

                {/* Holographic */}
                <div className="bg-white border-3 border-ink rounded-2xl p-6 shadow-[5px_5px_0_var(--kraft-dark),_5px_5px_0_2.5px_var(--ink)] hover:translate-y-[-4px] transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-16 h-16 rounded-xl border-2.5 border-ink bg-gradient-to-tr from-[#ffd1e6] via-[#c9f7ff] to-[#fff3b0] mb-5 flex items-center justify-center text-xl font-bold text-ink">H</div>
                    <h3 className="font-fredoka font-bold text-lg text-ink mb-1">Holographic</h3>
                    <p className="font-mono text-[10px] text-mint uppercase tracking-wider font-bold mb-3">Shimmering • Prismatic • Retro</p>
                    <p className="text-xs text-[#5a4a38] leading-relaxed mb-4">
                      Prismatic light-splitting coating that reflects rainbow gradients. Exceptional for cyberpunk motifs and digital collectibles.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPreset(STYLE_PRESETS[1]); // vaporwave
                      setCurrentPage("creator");
                      window.scrollTo(0, 0);
                    }}
                    className="w-full text-center py-2.5 bg-yellow hover:bg-pink font-fredoka font-bold text-xs border-2 border-ink rounded-xl transition-all cursor-pointer shadow-[2px_2px_0_var(--ink)] active:scale-95"
                  >
                    Select Holographic Style 
                  </button>
                </div>

                {/* Clear Vinyl */}
                <div className="bg-white border-3 border-ink rounded-2xl p-6 shadow-[5px_5px_0_var(--kraft-dark),_5px_5px_0_2.5px_var(--ink)] hover:translate-y-[-4px] transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-16 h-16 rounded-xl border-2.5 border-ink bg-zinc-200 mb-5 flex items-center justify-center text-xl font-bold text-ink">C</div>
                    <h3 className="font-fredoka font-bold text-lg text-ink mb-1">Clear Vinyl</h3>
                    <p className="font-mono text-[10px] text-[#8a7a60] uppercase tracking-wider font-bold mb-3">Ultra-Transparent • Clean</p>
                    <p className="text-xs text-[#5a4a38] leading-relaxed mb-4">
                      Crystal clear boundaries that let whatever is underneath show through. Ideal for window decals and laptop backs.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPreset(STYLE_PRESETS[4]); // minimalist / clear
                      setCurrentPage("creator");
                      window.scrollTo(0, 0);
                    }}
                    className="w-full text-center py-2.5 bg-yellow hover:bg-pink font-fredoka font-bold text-xs border-2 border-ink rounded-xl transition-all cursor-pointer shadow-[2px_2px_0_var(--ink)] active:scale-95"
                  >
                    Select Clear Style 
                  </button>
                </div>

                {/* Glow-In-The-Dark */}
                <div className="bg-white border-3 border-ink rounded-2xl p-6 shadow-[5px_5px_0_var(--kraft-dark),_5px_5px_0_2.5px_var(--ink)] hover:translate-y-[-4px] transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-16 h-16 rounded-xl border-2.5 border-ink bg-mint shadow-[inset_2px_2px_0_var(--ink)] mb-5 flex items-center justify-center text-xl font-bold text-ink">G</div>
                    <h3 className="font-fredoka font-bold text-lg text-ink mb-1">Glow-In-The-Dark</h3>
                    <p className="font-mono text-[10px] text-pink uppercase tracking-wider font-bold mb-3">Luminescent • Neon glow</p>
                    <p className="text-xs text-[#5a4a38] leading-relaxed mb-4">
                      Stores light energy to emit a brilliant bright green luminescence in pitch darkness. Terrific for hardware keys and badges.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPreset(STYLE_PRESETS[2]); // cyberpunk
                      setCurrentPage("creator");
                      window.scrollTo(0, 0);
                    }}
                    className="w-full text-center py-2.5 bg-yellow hover:bg-pink font-fredoka font-bold text-xs border-2 border-ink rounded-xl transition-all cursor-pointer shadow-[2px_2px_0_var(--ink)] active:scale-95"
                  >
                    Select Glow Style ✂
                  </button>
                </div>

                {/* Glitter */}
                <div className="bg-white border-3 border-ink rounded-2xl p-6 shadow-[5px_5px_0_var(--kraft-dark),_5px_5px_0_2.5px_var(--ink)] hover:translate-y-[-4px] transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-16 h-16 rounded-[50%_20%_50%_20%] border-2.5 border-ink bg-pink mb-5 flex items-center justify-center text-xl font-bold text-white">S</div>
                    <h3 className="font-fredoka font-bold text-lg text-ink mb-1">Glitter Sparkle</h3>
                    <p className="font-mono text-[10px] text-mint uppercase tracking-wider font-bold mb-3">Metallic flake • Kawaii</p>
                    <p className="text-xs text-[#5a4a38] leading-relaxed mb-4">
                      Embedded metallic sparkle flakes that dance in the sunlight. Extremely eye-catching, cute, and full of character.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPreset(STYLE_PRESETS[0]); // cute / glitter
                      setCurrentPage("creator");
                      window.scrollTo(0, 0);
                    }}
                    className="w-full text-center py-2.5 bg-yellow hover:bg-pink font-fredoka font-bold text-xs border-2 border-ink rounded-xl transition-all cursor-pointer shadow-[2px_2px_0_var(--ink)] active:scale-95"
                  >
                    Select Glitter Style 
                  </button>
                </div>

                {/* Weatherproof Details */}
                <div className="bg-[#FFE3EC] border-3 border-ink rounded-2xl p-6 shadow-[5px_5px_0_var(--kraft-dark),_5px_5px_0_2.5px_var(--ink)] flex flex-col justify-between">
                  <div>
                    <span className="text-3xl mb-3 block">🛡️</span>
                    <h3 className="font-fredoka font-bold text-lg text-ink mb-2">Built to Last</h3>
                    <p className="text-xs text-[#5a4a38] leading-relaxed">
                      Every single finish utilizes high-grade vinyl sealed under a defensive UV blocking laminate. It's completely weatherproof, waterproof, and 100% dishwasher-safe!
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-pink font-bold uppercase tracking-wider mt-4">
                    // 2 to 4 years UV protection
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}

        {currentPage === "about" && (
          <section className="py-16 px-6 bg-[#FFFDF8] dark:bg-zinc-900 min-h-[70vh] flex items-center print:hidden">
            <div className="max-w-4xl mx-auto w-full space-y-12 animate-fade-in">
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <span className="eyebrow inline-flex items-center gap-2 bg-pink border-2 border-ink px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider rotate-[-2deg] shadow-[3px_3px_0_var(--ink)] text-white">
                  ★ sticker obsessives
                </span>
                <h1 className="font-fredoka font-bold text-4xl md:text-5xl lg:text-6xl text-ink leading-tight">
                  Our Brand Manifesto
                </h1>
                <p className="text-sm md:text-base text-[#5a4a38] dark:text-amber-100/70 max-w-xl mx-auto">
                  Stickr was founded by visual designers who believe laptops, water bottles, and gear are modern canvases of personal identity.
                </p>
              </div>

              {/* Story Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-kraft/20 border-3 border-ink rounded-3xl p-6 md:p-8 shadow-[8px_8px_0_var(--kraft-dark),_8px_8px_0_3px_var(--ink)]">
                <div className="space-y-4">
                  <h3 className="font-fredoka font-bold text-2xl text-ink">We Stick Together</h3>
                  <p className="text-sm text-[#5a4a38] leading-relaxed">
                    Custom stickers used to require purchasing 50 copies of the exact same image. We thought that was boring. Why limit your expression to just one graphic?
                  </p>
                  <p className="text-sm text-[#5a4a38] leading-relaxed">
                    Stickr lets you design and print custom sheets containing 12 entirely different adhesive designs. Each high-definition graphic is individually contour-cut, giving you complete artistic freedom!
                  </p>
                </div>

                {/* Dexter Interactive Mascot */}
                <div className="flex flex-col items-center justify-center p-6 bg-white border-2 border-ink rounded-2xl relative shadow-md">
                  <div className="absolute top-2 left-2 font-mono text-[8px] text-ink/30 uppercase tracking-widest">Peel &amp; Shake</div>
                  
                  <div className="w-32 h-32 relative cursor-pointer group active:scale-95 transition-transform">
                    <div className="w-full h-full bg-[#FFE3EC] rounded-[50%_40%_45%_55%_/_45%_55%_40%_60%] border-3 border-ink flex flex-col items-center justify-center text-center p-2 shadow-md group-hover:animate-bounce relative">
                      <span className="text-4xl group-hover:rotate-12 transition-transform">🐶</span>
                      <span className="text-[10px] font-mono font-bold text-pink mt-1 uppercase tracking-wide">Mascot Dexter</span>
                      <div className="absolute -top-1.5 -right-1 bg-yellow border border-ink text-ink text-[7px] font-bold px-1.5 py-0.5 rounded-full rotate-12 animate-pulse">Pet me!</div>
                    </div>
                  </div>
                  
                  <p className="text-[11px] font-mono text-[#8a7a60] text-center mt-4">
                    Give <strong>Dexter</strong> a pat! He is dishwasher-safe and resistant to coffee cup steam!
                  </p>
                </div>
              </div>

              {/* FAQs Accordion */}
              <div className="space-y-6">
                <h3 className="font-fredoka font-bold text-2xl text-ink text-center">Frequently Asked Questions</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border-2 border-ink rounded-xl p-5 shadow-[4px_4px_0_var(--ink)]">
                    <h4 className="font-fredoka font-bold text-sm text-ink mb-1.5">What formats can I upload?</h4>
                    <p className="text-xs text-[#5a4a38] leading-relaxed">
                      We support PNG, JPEG, and WEBP. Images with vibrant foreground subjects yield the cleanest contours automatically!
                    </p>
                  </div>

                  <div className="bg-white border-2 border-ink rounded-xl p-5 shadow-[4px_4px_0_var(--ink)]">
                    <h4 className="font-fredoka font-bold text-sm text-ink mb-1.5">Is worldwide shipping free?</h4>
                    <p className="text-xs text-[#5a4a38] leading-relaxed">
                      Yes! High-DPI digital files download instantly, while physical sheets ship with free tracking worldwide.
                    </p>
                  </div>

                  <div className="bg-white border-2 border-ink rounded-xl p-5 shadow-[4px_4px_0_var(--ink)]">
                    <h4 className="font-fredoka font-bold text-sm text-ink mb-1.5">How thick are physical stickers?</h4>
                    <p className="text-xs text-[#5a4a38] leading-relaxed">
                      We print on a substantial 6 mil thick vinyl film layered with a defensive 3 mil protective laminate coating.
                    </p>
                  </div>

                  <div className="bg-white border-2 border-ink rounded-xl p-5 shadow-[4px_4px_0_var(--ink)]">
                    <h4 className="font-fredoka font-bold text-sm text-ink mb-1.5">Can they be peeled off safely?</h4>
                    <p className="text-xs text-[#5a4a38] leading-relaxed">
                      Absolutely. We use non-residue adhesives so your laptop or bottle peels cleanly without any sticky gunk.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* FOOTER BAR */}
      <footer className="bg-white dark:bg-zinc-900 border-t-2 border-dashed border-line py-16 px-6 print:hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
          <div>
            <h4 className="font-fredoka font-bold text-3xl text-ink leading-tight max-w-[14ch]">
              Ready to stick something?
            </h4>
          </div>
          <div className="flex gap-16 text-sm text-ink/70">
            <div className="flex flex-col gap-2">
              <strong className="font-mono text-xs uppercase tracking-wider text-[#8a7a60] dark:text-amber-100/50">Product</strong>
              <button 
                onClick={() => { setCurrentPage("how-it-works"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="text-left hover:text-pink transition-colors cursor-pointer"
              >
                How it works
              </button>
              <button 
                onClick={() => { setCurrentPage("finishes"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="text-left hover:text-pink transition-colors cursor-pointer"
              >
                Finishes
              </button>
              <button 
                onClick={() => { setCurrentPage("creator"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="text-left hover:text-pink transition-colors cursor-pointer"
              >
                Home
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <strong className="font-mono text-xs uppercase tracking-wider text-[#8a7a60] dark:text-amber-100/50">Company</strong>
              <button 
                onClick={() => { setCurrentPage("about"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="text-left hover:text-pink transition-colors cursor-pointer"
              >
                About
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-dashed border-ink/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-[#8a7a60] dark:text-amber-100/50">
          <span>© 2026 Stickr</span>
        
        </div>
      </footer>

      {/* Hidden inputs to support file uploads and camera captures triggered by the Hero action button */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".jpg,.jpeg,image/jpeg,image/jpg"
        className="hidden" 
      />

    </div>
  );
}

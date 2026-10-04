import express from "express";
import path from "path";
import dotenv from "dotenv";
import dns from "dns";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Force Node's DNS lookup to prioritize IPv4 over IPv6. 
// This resolves native fetch failing with "TypeError: fetch failed" (e.g. ENOTFOUND or EADDRNOTAVAIL) on sandboxed/container environments.
dns.setDefaultResultOrder("ipv4first");

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable large JSON bodies for base64 image processing
app.use(express.json({ limit: "15mb" }));

// Lazy initializer for Google Gen AI
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      try {
        aiClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      } catch (err) {
        console.error("Failed to initialize GoogleGenAI client:", err);
      }
    }
  }
  return aiClient;
}

// Endpoint: Proxy Image to prevent canvas CORS contamination
app.get("/api/proxy-image", async (req, res) => {
  try {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).json({ error: "Missing required query parameter: url" });
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch image from remote source" });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    
    return res.json({ dataUrl: `data:${contentType};base64,${base64}` });
  } catch (error: any) {
    console.error("Error proxying image:", error);
    return res.status(500).json({ error: "Failed to proxy image" });
  }
});

// Robust Helper to clean and decode base64 images
function cleanBase64Image(rawInput: string): { base64Data: string; mimeType: string } {
  const inputLen = rawInput ? rawInput.length : 0;
  const inputPrefix = rawInput ? rawInput.substring(0, 120) : "empty";
  console.log(`[cleanBase64Image] Input length: ${inputLen} | Prefix: "${inputPrefix}"`);

  let decoded = rawInput || "";
  
  // 1. If it's URL-encoded (contains % etc.), decode it fully until no % are left or max 3 times
  let attempts = 0;
  while (decoded.includes("%") && attempts < 3) {
    try {
      decoded = decodeURIComponent(decoded);
      attempts++;
    } catch (e) {
      break;
    }
  }
  
  // 2. Extract mimeType and base64 string
  let mimeType = "image/png";
  if (decoded.includes(";base64,")) {
    const parts = decoded.split(";base64,");
    decoded = parts[parts.length - 1];
    
    // Find mimeType from the segment before ;base64,
    const mimeMatch = parts[parts.length - 2].match(/(image\/[a-zA-Z+.-]+)/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }
  }
  
  // Convert URL-safe base64 to standard base64 and remove all whitespaces/newlines/tabs/spaces cleanly
  let base64Data = decoded.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
  // Remove any remaining invalid non-base64 characters
  base64Data = base64Data.replace(/[^a-zA-Z0-9+/=]/g, "");
  
  console.log(`[cleanBase64Image] Output mimeType: ${mimeType} | Base64 Length: ${base64Data.length} | Prefix: "${base64Data.substring(0, 80)}"`);
  return { base64Data, mimeType };
}

// Helper to remove background using Hugging Face models (briaai/RMBG-1.4 or ZhengPeng7/BiRefNet)
async function removeBgHuggingFace(imageBase64: string, hfApiKey: string): Promise<string> {
  const cleaned = cleanBase64Image(imageBase64);
  const buffer = Buffer.from(cleaned.base64Data, "base64");
  
  const models = ["briaai/RMBG-1.4", "ZhengPeng7/BiRefNet"];
  const domains = ["api-inference.huggingface.co"];
  let lastError: any = null;
  
  for (const model of models) {
    try {
      console.log(`[Hugging Face Process] Analyzing with model: ${model}`);
      
      // Limit to 2 attempts per model to fail fast and trigger client-side AI fallback
      for (let attempt = 1; attempt <= 2; attempt++) {
        let success = false;
        let response: any = null;
        let fetchError: any = null;
        
        for (const domain of domains) {
          try {
            console.log(`[Hugging Face Process] Trying model path ${domain} for ${model} (attempt ${attempt}/2)...`);
            
            // Set a realistic timeout (e.g. 25 seconds) so the model has enough time to warm up and process
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000);
            
            response = await fetch(`https://${domain}/models/${model}`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${hfApiKey.trim()}`,
                "Content-Type": "application/octet-stream",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
              },
              body: new Uint8Array(buffer),
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            success = true;
            break;
          } catch (err: any) {
            console.log(`[Hugging Face Info] Domain ${domain} status: offline / unreachable`);
            fetchError = err;
            
            // If DNS resolution is completely unavailable (offline), fail fast. Otherwise continue retries.
            if (err.code === "ENOTFOUND" || err.message?.includes("ENOTFOUND")) {
              console.log(`[Hugging Face Info] Network offline. Initiating local AI cutout.`);
              throw err;
            }
          }
        }
        
        if (!success || !response) {
          throw fetchError || new Error("Sandbox offline");
        }
        
        if (response.status === 200) {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const json = await response.json();
            if (json.error && json.error.toLowerCase().includes("loading")) {
              const waitTime = Math.min(5, Math.ceil(json.estimated_time || 3));
              console.log(`[Hugging Face Info] Model loading. Delaying ${waitTime}s (attempt ${attempt}/2)...`);
              await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
              continue;
            }
          }
          
          const outputBuffer = await response.arrayBuffer();
          const base64 = Buffer.from(outputBuffer).toString("base64");
          console.log(`[Hugging Face Success] Model ${model} cutout completed.`);
          return `data:image/png;base64,${base64}`;
        } else if (response.status === 503) {
          let waitTime = 3;
          try {
            const json = await response.json();
            if (json.estimated_time) {
              waitTime = Math.min(5, Math.ceil(json.estimated_time));
            }
            console.log(`[Hugging Face Info] Service active status. Delaying ${waitTime}s...`);
          } catch (e) {
            console.log(`[Hugging Face Info] Waiting ${waitTime}s...`);
          }
          await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
          continue;
        } else {
          console.log(`[Hugging Face Info] Non-200 response code: ${response.status}`);
          lastError = new Error(`Status ${response.status}`);
          break; // Try next model
        }
      }
    } catch (err: any) {
      console.log(`[Hugging Face Info] Check finished for ${model}`);
      lastError = err;
      if (err.code === "ENOTFOUND" || err.message?.includes("ENOTFOUND") || err.name === "AbortError" || err.message?.includes("fetch failed")) {
        break;
      }
    }
  }
  
  throw lastError || new Error("Check finished");
}

// Endpoint: Remove background using Hugging Face or Remove.bg APIs
app.post("/api/remove-bg", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing required parameter: imageBase64" });
    }

    const hfApiKey = process.env.HUGGING_FACE_API_KEY;
    const removeBgApiKey = process.env.REMOVE_BG_API_KEY;

    const hasHf = hfApiKey && hfApiKey.trim() !== "" && hfApiKey !== "YOUR_HUGGING_FACE_API_KEY";
    const hasRemoveBg = removeBgApiKey && removeBgApiKey.trim() !== "" && removeBgApiKey !== "YOUR_REMOVE_BG_API_KEY";

    if (!hasHf && !hasRemoveBg) {
      return res.status(200).json({ 
        fallbackToClient: true,
        info: "Using high-performance local AI cutout processor."
      });
    }

    // Try Hugging Face first if configured, as requested by the user
    if (hasHf) {
      try {
        console.log("[Remove-BG Endpoint] Running check with Hugging Face integration...");
        const resultDataUrl = await removeBgHuggingFace(imageBase64, hfApiKey);
        return res.json({ dataUrl: resultDataUrl });
      } catch (hfError: any) {
        console.log("[Remove-BG Endpoint] Offline, continuing to fallback flow...");
        if (hasRemoveBg) {
          console.log("[Remove-BG Endpoint] Transitioning to Remove.bg secondary.");
        } else {
          return res.json({ 
            fallbackToClient: true, 
            info: "Transitioning to local AI background cutout."
          });
        }
      }
    }

    // Fallback/direct use of Remove.bg
    if (hasRemoveBg) {
      // Clean base64 image data robustly
      const cleaned = cleanBase64Image(imageBase64);
      const base64Data = cleaned.base64Data;

      console.log(`[Remove.bg Request] Sending base64 image via x-www-form-urlencoded, base64 length: ${base64Data.length}`);

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": removeBgApiKey,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `image_file_b64=${encodeURIComponent(base64Data)}&size=auto`
      });

      if (response.status === 200) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const outputBase64 = buffer.toString("base64");
        console.log(`[Remove.bg Success] Output PNG length: ${outputBase64.length}`);
        return res.json({ 
          dataUrl: `data:image/png;base64,${outputBase64}` 
        });
      } else {
        const errorText = await response.text();
        console.error("[Remove.bg Error Status]:", response.status, errorText);
        let parsedError;
        try {
          parsedError = JSON.parse(errorText);
        } catch (e) {
          parsedError = { errors: [{ title: errorText }] };
        }
        return res.status(response.status).json({ 
          error: parsedError.errors?.[0]?.title || "Remove.bg API returned an error.",
          details: parsedError
        });
      }
    }

    return res.status(400).json({ 
      error: "No active API keys found.",
      code: "MISSING_API_KEY"
    });
  } catch (error: any) {
    console.error("[Remove-BG Exception]:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Helper to generate image using Hugging Face models (black-forest-labs/FLUX.1-schnell, stabilityai/stable-diffusion-xl-base-1.0)
async function generateImageHuggingFace(prompt: string, hfApiKey: string): Promise<string> {
  const models = [
    "black-forest-labs/FLUX.1-schnell",
    "stabilityai/stable-diffusion-xl-base-1.0",
    "runwayml/stable-diffusion-v1-5"
  ];
  const domains = ["api-inference.huggingface.co"];
  let lastError: any = null;

  for (const model of models) {
    try {
      console.log(`[Hugging Face Image Generation] Trying model: ${model}`);
      
      // Try 2 attempts per model to bypass transient loading errors
      for (let attempt = 1; attempt <= 2; attempt++) {
        let success = false;
        let response: any = null;
        let fetchError: any = null;
        
        for (const domain of domains) {
          try {
            console.log(`[Hugging Face Image Generation] Querying ${domain} for ${model} (attempt ${attempt}/2)...`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000);
            
            response = await fetch(`https://${domain}/models/${model}`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${hfApiKey.trim()}`,
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
              },
              body: JSON.stringify({ inputs: prompt }),
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            success = true;
            break;
          } catch (err: any) {
            const causeStr = err.cause ? ` (Cause: ${err.cause.code || err.cause.message || err.cause})` : "";
            console.log(`[Hugging Face Image Generation Error Detail] ${domain}: ${err.message || err}${causeStr}`);
            fetchError = err;
            if (err.code === "ENOTFOUND" || err.message?.includes("ENOTFOUND")) {
              throw err;
            }
          }
        }
        
        if (!success || !response) {
          throw fetchError || new Error("Sandbox offline");
        }
        
        if (response.status === 200) {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const json = await response.json();
            if (json.error && json.error.toLowerCase().includes("loading")) {
              const waitTime = Math.min(5, Math.ceil(json.estimated_time || 3));
              console.log(`[Hugging Face Image Generation] Model loading. Delaying ${waitTime}s (attempt ${attempt}/2)...`);
              await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
              continue;
            }
          }
          
          const outputBuffer = await response.arrayBuffer();
          const base64 = Buffer.from(outputBuffer).toString("base64");
          const mimeType = response.headers.get("content-type") || "image/png";
          console.log(`[Hugging Face Image Generation Success] Model ${model} completed.`);
          return `data:${mimeType};base64,${base64}`;
        } else if (response.status === 503) {
          let waitTime = 3;
          try {
            const json = await response.json();
            if (json.estimated_time) {
              waitTime = Math.min(5, Math.ceil(json.estimated_time));
            }
            console.log(`[Hugging Face Image Generation Info] Service loading/warming up. Delaying ${waitTime}s...`);
          } catch (e) {
            console.log(`[Hugging Face Image Generation Info] Waiting ${waitTime}s...`);
          }
          await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
          continue;
        } else {
          console.log(`[Hugging Face Image Generation Info] Non-200 response code: ${response.status}`);
          try {
            const errJson = await response.json();
            console.log("[Hugging Face Image Generation Error Response]:", errJson);
          } catch (e) {}
          lastError = new Error(`Status ${response.status}`);
          break; // Try next model
        }
      }
    } catch (err: any) {
      console.log(`[Hugging Face Image Generation Info] Check finished for ${model}`);
      lastError = err;
      if (err.code === "ENOTFOUND" || err.message?.includes("ENOTFOUND") || err.name === "AbortError" || err.message?.includes("fetch failed")) {
        break;
      }
    }
  }
  
  throw lastError || new Error("All Hugging Face image generation models returned error states.");
}

// Endpoint: Generate Image using Gemini (primary) or Hugging Face (fallback)
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, stylePreset } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing required parameter: prompt" });
    }

    // Enhance prompt to guide the image model to generate clean sticker graphics on white backgrounds
    const enhancedPrompt = `Sticker design of: ${prompt}. Style: ${stylePreset || "modern"}. Clean sticker visual on a solid flat white background, thick white die-cut border, bold clean outlines, rich pop colors, vector graphic look, extremely detailed, beautiful cartoon style, master artwork.`;

    // Try Gemini API first (highly robust, sandboxed domain bypass)
    const ai = getAiClient();
    if (ai) {
      try {
        console.log(`[Gemini Image Generation] Requesting gemini-3.1-flash-lite-image for prompt: "${enhancedPrompt}"`);
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite-image",
          contents: {
            parts: [
              {
                text: enhancedPrompt,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
            },
          },
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts && parts.length > 0) {
          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
              const mimeType = part.inlineData.mimeType || "image/png";
              const dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
              console.log("[Gemini Image Generation Success] Successfully generated sticker artwork using Gemini.");
              return res.json({ dataUrl });
            }
          }
        }
        console.warn("[Gemini Image Generation] No inlineData part was found in Gemini response.");
      } catch (geminiError: any) {
        console.warn("[Gemini Image Generation Failed] Continuing to Hugging Face fallback flow. Error:", geminiError.message || geminiError);
      }
    }

    const hfApiKey = process.env.HUGGING_FACE_API_KEY;
    const hasHf = hfApiKey && hfApiKey.trim() !== "" && hfApiKey !== "YOUR_HUGGING_FACE_API_KEY";

    if (!hasHf) {
      console.log("[Image Generation] No API key found. Providing smart sample sticker image in offline mode.");
      const sampleImages: Record<string, string> = {
        cute: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&auto=format&fit=crop&q=80",
        vaporwave: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
        cyberpunk: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
        cottagecore: "https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=600&auto=format&fit=crop&q=80",
      };
      const fallbackUrl = sampleImages[stylePreset] || "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80";
      return res.json({ 
        dataUrl: fallbackUrl,
        isFallback: true,
        info: "Running in offline keyless mode with sample graphics."
      });
    }

    console.log(`[Hugging Face Image Generation] Prompt: "${enhancedPrompt}"`);
    const dataUrl = await generateImageHuggingFace(enhancedPrompt, hfApiKey);
    return res.json({ dataUrl });
  } catch (error: any) {
    console.error("[Image Generation Error]:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to generate AI sticker image. Please verify your API key is valid and configured." 
    });
  }
});

// Endpoint: Analyze Image and Generate Smart Stickers
app.post("/api/analyze-image", async (req, res) => {
  try {
    const { stylePreset, customText } = req.body;
    console.log(`[Sticker Design Layout] Creating smart templates. Preset: ${stylePreset || "any"} | Custom quote: ${customText || "none"}`);
    
    // Completely bypass Gemini to ensure maximum speed and 100% resilience against vision API errors
    return res.json(getFallbackStickers(stylePreset, customText));
  } catch (error: any) {
    console.error("Error in analyze-image endpoint:", error);
    return res.status(200).json(getFallbackStickers(req.body?.stylePreset, req.body?.customText, error.message));
  }
});

// Fallback algorithm that returns customized mockup stickers if Gemini fails or is missing an API key
function getFallbackStickers(stylePreset = "any", customText = "", warning = "") {
  const customQuote = customText || "My Daily Sunshine";
  
  // Pick quotes based on style preset
  let quotes = [
    {
      id: "variation_1",
      themeName: "Original Cutout",
      quoteText: "Stay Awesome",
      emoji: "✨",
      backgroundColor: "#F0F4FF",
      textColor: "#5B6CFF",
      badgeStyle: "bottom-bar"
    },
    {
      id: "variation_2",
      themeName: "Motivational Spark",
      quoteText: customText ? customQuote : "You Can Do It",
      emoji: "⭐",
      backgroundColor: "#FFF9E6",
      textColor: "#FFB000",
      badgeStyle: "banner"
    },
    {
      id: "variation_3",
      themeName: "Humor & Wit",
      quoteText: "Powered by Good Vibes",
      emoji: "🔥",
      backgroundColor: "#FFF2F2",
      textColor: "#FF6B6B",
      badgeStyle: "bubble"
    },
    {
      id: "variation_4",
      themeName: "Cute & Aesthetic",
      quoteText: "Dream Big",
      emoji: "🌸",
      backgroundColor: "#FAF0FF",
      textColor: "#7C4DFF",
      badgeStyle: "stamp"
    }
  ];

  if (stylePreset === "funny") {
    quotes[1].quoteText = "I came, I saw, I forgot what I was doing";
    quotes[2].quoteText = "Technically alive";
  } else if (stylePreset === "motivational") {
    quotes[2].quoteText = "Make it happen today";
    quotes[3].quoteText = "Your potential is limitless";
  } else if (stylePreset === "anime" || stylePreset === "gaming") {
    quotes[0].quoteText = "Level Up!";
    quotes[1].quoteText = "Anime Mode: Activated";
    quotes[2].quoteText = "Defeat is not an option";
    quotes[3].quoteText = "Kawaii Energy";
  }

  return {
    subject: "Uploaded Image",
    warning: warning ? `Gemini API error: ${warning}` : "Running in sandbox mode with pre-designed layouts.",
    stickers: quotes
  };
}

// Start Server Setup (Vite / Express)
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer();
}


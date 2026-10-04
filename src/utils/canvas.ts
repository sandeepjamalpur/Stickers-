import { StickerConfig, StickerDecoration } from "../types";

/**
 * Draws a solid outline around a transparent image on a canvas.
 */
export function drawImageOutline(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number,
  thickness: number,
  color: string = "#ffffff"
) {
  if (thickness <= 0) return;

  ctx.save();
  
  // To ensure the ultimate crispness and professional die-cut look,
  // we draw the outline directly at full workspace resolution.
  // We use adaptive sampling steps to ensure perfect smoothness with zero scalloping.
  const steps = Math.min(128, Math.max(48, Math.round(thickness * 2.5)));

  // Create an offscreen canvas to isolate the image and fill it with solid outline color
  const offCanvas = document.createElement("canvas");
  offCanvas.width = w + thickness * 2;
  offCanvas.height = h + thickness * 2;
  const oCtx = offCanvas.getContext("2d");
  
  if (oCtx) {
    oCtx.imageSmoothingEnabled = true;
    oCtx.imageSmoothingQuality = "high";
    oCtx.drawImage(img, thickness, thickness, w, h);
    oCtx.globalCompositeOperation = "source-in";
    oCtx.fillStyle = color;
    oCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

    // Create a temporary canvas to aggregate the outline shapes at full resolution
    const outlineTempCanvas = document.createElement("canvas");
    outlineTempCanvas.width = w + thickness * 2;
    outlineTempCanvas.height = h + thickness * 2;
    const otCtx = outlineTempCanvas.getContext("2d");
    
    if (otCtx) {
      otCtx.imageSmoothingEnabled = true;
      otCtx.imageSmoothingQuality = "high";
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const dx = Math.cos(angle) * thickness;
        const dy = Math.sin(angle) * thickness;
        otCtx.drawImage(offCanvas, dx, dy);
      }
      
      // Draw the beautiful, sharp aggregated outline to the target canvas
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        outlineTempCanvas, 
        0, 
        0, 
        outlineTempCanvas.width, 
        outlineTempCanvas.height, 
        x - thickness, 
        y - thickness, 
        w + thickness * 2, 
        h + thickness * 2
      );
    }
  }
  ctx.restore();
}

/**
 * Sharpens a canvas using a high-performance 3x3 convolution sharpen kernel.
 */
export function sharpenCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number
) {
  if (amount <= 0) return;
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const original = new Uint8ClampedArray(data);

    // amount goes from 0 to 1 (passed from slider 0-100 converted to 0-1)
    const a = amount;
    const b = 1 + 4 * a;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        if (original[idx + 3] === 0) continue; // Skip fully transparent pixels

        // Red
        const r = b * original[idx] - a * (
          original[idx - 4] + original[idx + 4] +
          original[idx - width * 4] + original[idx + width * 4]
        );
        // Green
        const g = b * original[idx + 1] - a * (
          original[idx - 3] + original[idx + 5] +
          original[idx - width * 4 + 1] + original[idx + width * 4 + 1]
        );
        // Blue
        const b_val = b * original[idx + 2] - a * (
          original[idx - 2] + original[idx + 6] +
          original[idx - width * 4 + 2] + original[idx + width * 4 + 2]
        );

        data[idx] = Math.max(0, Math.min(255, r));
        data[idx + 1] = Math.max(0, Math.min(255, g));
        data[idx + 2] = Math.max(0, Math.min(255, b_val));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    console.error("Failed to sharpen canvas:", e);
  }
}

/**
 * Applies native art filters and adjustments to a canvas context.
 */
export function applyArtFilter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filterType: string,
  brightness = 100,
  contrast = 100,
  saturation = 100,
  sharpness = 0
) {
  // If no adjustments or custom filters are requested, skip processing to avoid subpixel blurriness
  if (
    (!filterType || filterType === "none") &&
    brightness === 100 &&
    contrast === 100 &&
    saturation === 100 &&
    sharpness === 0
  ) {
    return;
  }

  // 1. Basic sliders using canvas filter context
  let filterStr = "";
  if (brightness !== 100 || contrast !== 100 || saturation !== 100) {
    filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  }

  if (filterType === "watercolor") {
    filterStr += (filterStr ? " " : "") + "blur(1px) saturate(140%) contrast(110%)";
  } else if (filterType === "pop-art") {
    filterStr += (filterStr ? " " : "") + "saturate(220%) contrast(140%) hue-rotate(15deg)";
  }

  if (filterStr) {
    ctx.filter = filterStr;

    // Draw the canvas on itself to bake the basic filters
    const temp = document.createElement("canvas");
    temp.width = width;
    temp.height = height;
    temp.getContext("2d")?.drawImage(ctx.canvas, 0, 0);
    
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(temp, 0, 0);
    ctx.filter = "none"; // reset
  }

  // 2. Complex procedural pixel manipulations
  if (filterType === "pixel-art") {
    const pixelSize = 10;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = Math.max(16, width / pixelSize);
    tempCanvas.height = Math.max(16, height / pixelSize);
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.imageSmoothingEnabled = false;
      tempCtx.drawImage(ctx.canvas, 0, 0, tempCanvas.width, tempCanvas.height);
      
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tempCanvas, 0, 0, width, height);
    }
  } else if (filterType === "sketch") {
    // Charcoal pencil sketch simulation
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    
    // Grayscale + edge enhancement
    const grayData = new Uint8ClampedArray(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      grayData[i / 4] = gray;
    }

    // Sobel edge filtering
    const edgeData = new Uint8ClampedArray(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const gX =
          -1 * grayData[idx - width - 1] + 1 * grayData[idx - width + 1] +
          -2 * grayData[idx - 1]         + 2 * grayData[idx + 1] +
          -1 * grayData[idx + width - 1] + 1 * grayData[idx + width + 1];

        const gY =
          -1 * grayData[idx - width - 1] - 2 * grayData[idx - width] - 1 * grayData[idx - width + 1] +
          1 * grayData[idx + width - 1] + 2 * grayData[idx + width] + 1 * grayData[idx + width + 1];

        const magnitude = Math.sqrt(gX * gX + gY * gY);
        edgeData[idx] = magnitude > 45 ? 50 : 255; // high-contrast lines
      }
    }

    // Replace canvas pixel values with charcoal style
    for (let i = 0; i < data.length; i += 4) {
      const val = edgeData[Math.floor(i / 4)];
      if (data[i + 3] > 10) { // Keep transparency
        // Draw dark pencil lines, light gray shading
        const shade = val === 50 ? 40 : 245;
        data[i] = shade;
        data[i + 1] = shade;
        data[i + 2] = shade;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } else if (filterType === "cartoon" || filterType === "anime") {
    // Posterize colors & darken lines with higher levels for professional, smooth, high-fidelity results
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const levels = 16;
    const step = 255 / (levels - 1);

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 10) {
        data[i] = Math.round(data[i] / step) * step;
        data[i + 1] = Math.round(data[i + 1] / step) * step;
        data[i + 2] = Math.round(data[i + 2] / step) * step;
        
        // Add vibrant tint for anime style
        if (filterType === "anime") {
          data[i] = Math.min(255, data[i] * 1.15); // boost red
          data[i + 2] = Math.min(255, data[i + 2] * 1.05); // boost blue
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // 3. HD Sharpening pass
  if (sharpness > 0) {
    sharpenCanvas(ctx, width, height, sharpness / 100);
  }
}

/**
 * Draws text along a custom arc/curve path
 */
function drawTextCurve(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  radius: number,
  angleInRadians: number
) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(-angleInRadians / 2);

  const len = text.length;
  const angleStep = angleInRadians / (len - 1 || 1);

  for (let i = 0; i < len; i++) {
    ctx.save();
    ctx.rotate(i * angleStep);
    ctx.translate(0, -radius);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Render a complete beautiful customized sticker to a Canvas in High Definition (HD).
 */
export async function renderStickerToCanvas(
  canvas: HTMLCanvasElement,
  cutoutSrc: string, // Base64 or ObjectURL of cutout image
  config: StickerConfig,
  customSize?: number
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Use the provided customSize (e.g. 4000 for 4K) or default to 1600 for sharp live preview
  const size = customSize || 1600;
  const scaleMultiplier = size / 800; // Proportional scaling multiplier
  canvas.width = size;
  canvas.height = size;

  // Clear canvas transparent
  ctx.clearRect(0, 0, size, size);

  // Load the cutout image
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    if (!cutoutSrc.startsWith("data:")) {
      i.crossOrigin = "anonymous";
    }
    i.onload = () => resolve(i);
    i.onerror = (e) => reject(e);
    i.src = cutoutSrc;
  });

  // Calculate bounding box for the centered object inside standard sticker workspace
  const stickerWorkspace = size * 0.75; // 1200px (proportional container)
  const scaleRatio = Math.min(
    stickerWorkspace / img.width,
    stickerWorkspace / img.height
  ) * config.scale;

  const w = img.width * scaleRatio;
  const h = img.height * scaleRatio;

  // Center coordinates of image on canvas
  const cx = size / 2;
  const cy = size / 2 - 30 * scaleMultiplier; // offset slightly up to make space for text badge below
  const x = cx - w / 2;
  const y = cy - h / 2;

  // Create an offscreen canvas to process the cutout with custom visual filters first
  const objectCanvas = document.createElement("canvas");
  objectCanvas.width = size;
  objectCanvas.height = size;
  const objCtx = objectCanvas.getContext("2d");

  if (!objCtx) return;

  objCtx.imageSmoothingEnabled = true;
  objCtx.imageSmoothingQuality = "high";

  // Draw filtered image on offscreen objectCanvas
  objCtx.save();
  objCtx.translate(cx, cy);
  objCtx.rotate((config.rotation * Math.PI) / 180);
  objCtx.drawImage(img, -w / 2, -h / 2, w, h);
  objCtx.restore();

  // Apply filters to object canvas (brightness, contrast, filters)
  applyArtFilter(
    objCtx,
    size,
    size,
    config.artFilter,
    config.brightness,
    config.contrast,
    config.saturation,
    config.sharpness
  );

  // Set up font styling for rendering badges and captions with scaled font sizes
  const fontName = config.fontFamily;
  const fontSize = config.fontSize * scaleMultiplier;
  ctx.font = `bold ${fontSize}px "${fontName}", "Inter", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Measure text sizes in high-resolution space
  const quote = config.quoteText;
  const textMetrics = ctx.measureText(quote);
  const textWidth = Math.max(120 * scaleMultiplier, textMetrics.width + 50 * scaleMultiplier);
  const textHeight = fontSize + 30 * scaleMultiplier;

  // Determine positions of the text badge
  const bx = size / 2;
  const by = cy + h / 2 + 35 * scaleMultiplier; // slightly below the cutout object

  // Create another offscreen canvas to compile the entire STICKER BODY (Cutout + text badge)
  // This is required so we can draw a unified solid outline around both the object AND its quote banner!
  const stickerBodyCanvas = document.createElement("canvas");
  stickerBodyCanvas.width = size;
  stickerBodyCanvas.height = size;
  const sCtx = stickerBodyCanvas.getContext("2d");

  if (!sCtx) return;

  sCtx.imageSmoothingEnabled = true;
  sCtx.imageSmoothingQuality = "high";

  // 1. Draw the processed cutout object onto the unified sticker body
  sCtx.drawImage(objectCanvas, 0, 0);

  // 2. Draw user customization decorations (Emojis, Sparkles, Hearts, stars)
  config.decorations.forEach((dec) => {
    sCtx.save();
    // Convert percent coordinates back to pixel coordinates relative to the object
    const px = x + (dec.x / 100) * w;
    const py = y + (dec.y / 100) * h;
    sCtx.translate(px, py);
    sCtx.rotate((dec.rotation * Math.PI) / 180);
    
    // Font for decoration - scaled proportionally
    const decSize = Math.max(20 * scaleMultiplier, fontSize * 1.1 * dec.scale);
    sCtx.font = `${decSize}px "Inter", sans-serif`;
    sCtx.textAlign = "center";
    sCtx.textBaseline = "middle";
    sCtx.fillText(dec.content, 0, 0);
    sCtx.restore();
  });

  // 3. Draw the Badge Shape & Text onto the unified sticker body
  sCtx.save();
  sCtx.font = `bold ${fontSize}px "${fontName}", "Inter", sans-serif`;
  sCtx.textAlign = "center";
  sCtx.textBaseline = "middle";

  if (config.badgeStyle !== "none" && quote.trim() !== "") {
    sCtx.fillStyle = config.backgroundColor;
    sCtx.shadowColor = "rgba(0,0,0,0.05)";
    sCtx.shadowBlur = 4 * scaleMultiplier;

    if (config.badgeStyle === "banner") {
      // Draw a stylish layered ribbon banner
      const bannerW = textWidth + 40 * scaleMultiplier;
      const bannerH = textHeight;

      // Ribbon background
      sCtx.beginPath();
      sCtx.roundRect(bx - bannerW / 2, by - bannerH / 2, bannerW, bannerH, 12 * scaleMultiplier);
      sCtx.fill();

      // Ribbon side ears for a cute 3D folded effect
      sCtx.fillStyle = config.textColor + "22"; // matching tint semi-transparent
      sCtx.beginPath();
      // left ear
      sCtx.moveTo(bx - bannerW / 2, by - bannerH / 4);
      sCtx.lineTo(bx - bannerW / 2 - 25 * scaleMultiplier, by - bannerH / 2);
      sCtx.lineTo(bx - bannerW / 2 - 15 * scaleMultiplier, by + bannerH / 4);
      sCtx.closePath();
      sCtx.fill();
      // right ear
      sCtx.moveTo(bx + bannerW / 2, by - bannerH / 4);
      sCtx.lineTo(bx + bannerW / 2 + 25 * scaleMultiplier, by - bannerH / 2);
      sCtx.lineTo(bx + bannerW / 2 + 15 * scaleMultiplier, by + bannerH / 4);
      sCtx.closePath();
      sCtx.fill();

      // Text
      sCtx.fillStyle = config.textColor;
      sCtx.fillText(quote, bx, by);

    } else if (config.badgeStyle === "bubble") {
      // Speech bubble with small pointing triangle
      const bubbleW = textWidth;
      const bubbleH = textHeight;

      sCtx.beginPath();
      sCtx.roundRect(bx - bubbleW / 2, by - bubbleH / 2, bubbleW, bubbleH, 20 * scaleMultiplier);
      sCtx.fill();

      // triangle pointer pointing up to the item
      sCtx.beginPath();
      sCtx.moveTo(bx - 15 * scaleMultiplier, by - bubbleH / 2);
      sCtx.lineTo(bx, by - bubbleH / 2 - 12 * scaleMultiplier);
      sCtx.lineTo(bx + 15 * scaleMultiplier, by - bubbleH / 2);
      sCtx.closePath();
      sCtx.fill();

      // Text
      sCtx.fillStyle = config.textColor;
      sCtx.fillText(quote, bx, by);

    } else if (config.badgeStyle === "stamp") {
      // Wave circle stamp badge
      const radius = Math.max(65 * scaleMultiplier, (textWidth) / 4);
      const sY = cy + h / 2 - 5 * scaleMultiplier; // reposition to overlap bottom corner slightly as a badge stamp

      sCtx.beginPath();
      const points = 36;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const waveRadius = radius + (i % 2 === 0 ? 8 * scaleMultiplier : -2 * scaleMultiplier);
        const sx = bx + Math.cos(angle) * waveRadius;
        const sy = sY + Math.sin(angle) * waveRadius;
        if (i === 0) sCtx.moveTo(sx, sy);
        else sCtx.lineTo(sx, sy);
      }
      sCtx.closePath();
      sCtx.fill();

      // Circular text stamp effect! Let's do elegant arched text
      sCtx.fillStyle = config.textColor;
      const stampFontSize = Math.max(10 * scaleMultiplier, fontSize * 0.7);
      sCtx.font = `bold ${stampFontSize}px "${fontName}", sans-serif`;
      drawTextCurve(sCtx, quote, bx, sY, radius - 15 * scaleMultiplier, Math.PI * 1.1);

      // Draw center decorative emoji
      sCtx.font = `${radius * 0.7}px "Inter", sans-serif`;
      sCtx.fillText(config.emoji, bx, sY);

    } else if (config.badgeStyle === "bottom-bar") {
      // Elegant rounded pill bar
      const pillW = textWidth + 10 * scaleMultiplier;
      const pillH = textHeight - 5 * scaleMultiplier;

      sCtx.beginPath();
      sCtx.roundRect(bx - pillW / 2, by - pillH / 2, pillW, pillH, 30 * scaleMultiplier);
      sCtx.fill();

      // Text
      sCtx.fillStyle = config.textColor;
      sCtx.fillText(`${config.emoji} ${quote}`, bx, by);
    }
  } else if (quote.trim() !== "") {
    // Text-only mode: Draw text with thick stroke outline directly onto body
    sCtx.fillStyle = config.textColor;
    sCtx.strokeStyle = "#ffffff";
    sCtx.lineWidth = 10 * scaleMultiplier;
    sCtx.lineJoin = "round";
    sCtx.miterLimit = 2;
    sCtx.strokeText(quote, bx, by);
    sCtx.fillText(quote, bx, by);
  }
  sCtx.restore();

  // 4. NOW: We compile the unified sticker onto the primary canvas!
  // First draw the physical floating shadow underneath the entire outline!
  // We draw the outline to an offscreen canvas first, then render that canvas ONCE with shadow enabled.
  // This completely prevents multiple overlapping shadows from casting a stacked "ghost" or "step-like" pattern.
  const outlineCanvas = document.createElement("canvas");
  outlineCanvas.width = size;
  outlineCanvas.height = size;
  const outlineCtx = outlineCanvas.getContext("2d");
  
  if (outlineCtx) {
    outlineCtx.imageSmoothingEnabled = true;
    outlineCtx.imageSmoothingQuality = "high";
    
    // Draw outline onto outlineCanvas without casting shadow
    drawImageOutline(
      outlineCtx,
      stickerBodyCanvas,
      0,
      0,
      size,
      size,
      config.borderThickness * scaleMultiplier,
      "#ffffff" // Pure white die-cut backing border
    );
    
    // Now draw the entire outline canvas ONCE on the primary canvas with shadow enabled!
    ctx.save();
    ctx.shadowColor = config.shadowColor || "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = (config.shadowBlur || 15) * scaleMultiplier;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10 * scaleMultiplier;
    
    ctx.drawImage(outlineCanvas, 0, 0);
    ctx.restore();
  } else {
    // Fallback if offscreen canvas context fails
    ctx.save();
    ctx.shadowColor = config.shadowColor || "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = (config.shadowBlur || 15) * scaleMultiplier;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10 * scaleMultiplier;
    
    drawImageOutline(
      ctx,
      stickerBodyCanvas,
      0,
      0,
      size,
      size,
      config.borderThickness * scaleMultiplier,
      "#ffffff"
    );
    ctx.restore();
  }

  // Draw the sticker itself directly inside the baked border
  ctx.drawImage(stickerBodyCanvas, 0, 0);
}

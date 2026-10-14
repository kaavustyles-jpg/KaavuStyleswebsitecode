import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[\/\\]/g, "-")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function getClientIp(): string {
  if (typeof window !== "undefined") {
    let ip = localStorage.getItem("kavvu_guest_ip");
    if (!ip) {
      ip = "192.168.1." + Math.floor(Math.random() * 254 + 1);
      localStorage.setItem("kavvu_guest_ip", ip);
    }
    return ip;
  }
  return "127.0.0.1";
}

/**
 * Optimize images only if they are high-resolution (>1600px) or large file size (>1MB).
 * Keeps normal resolution photos untouched and original.
 */
export async function compressAndOptimizeImage(
  file: File,
  maxDimension = 1600,
  quality = 0.85,
  alwaysOptimize = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("File is not an image"));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const sizeInMB = file.size / (1024 * 1024);

      // If file size is normal (<= 1MB) and dimensions are normal (<= 1600px), keep original untouched!
      if (!alwaysOptimize && sizeInMB <= 1 && width <= maxDimension && height <= maxDimension) {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      // High-resolution or large file -> optimize with canvas
      let newWidth = width;
      let newHeight = height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          newHeight = Math.round((height * maxDimension) / width);
          newWidth = maxDimension;
        } else {
          newWidth = Math.round((width * maxDimension) / height);
          newHeight = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      try {
        const dataUrl = canvas.toDataURL("image/webp", quality);
        if (dataUrl && dataUrl.startsWith("data:image/webp")) {
          resolve(dataUrl);
          return;
        }
      } catch (e) {
        // Fallback to JPEG
      }

      const jpegDataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(jpegDataUrl);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}

"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Upload, X, Link as LinkIcon, Plus, Loader2 } from "lucide-react";
import { compressAndOptimizeImage } from "@/lib/utils";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  single?: boolean;
  label?: string;
  noOptimize?: boolean;
  maxDimension?: number;
  quality?: number;
  alwaysOptimize?: boolean;
  folder?: string;
}

interface ImageDimension {
  url: string;
  width: number;
  height: number;
}

export default function ImageUploader({
  images,
  onChange,
  single = false,
  label = "Upload Product Images",
  noOptimize = false,
  maxDimension = 1600,
  quality = 0.85,
  alwaysOptimize = false,
  folder = "products",
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [dimensions, setDimensions] = useState<Record<string, { width: number; height: number }>>({});

  // Compute image dimensions whenever images array changes
  useEffect(() => {
    images.forEach((imgUrl) => {
      if (!dimensions[imgUrl]) {
        const img = new window.Image();
        img.onload = () => {
          setDimensions((prev) => ({
            ...prev,
            [imgUrl]: { width: img.naturalWidth, height: img.naturalHeight },
          }));
        };
        img.src = imgUrl;
      }
    });
  }, [images, dimensions]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    const fileList = Array.from(files);

    try {
      let preparedImages: string[] = [];

      if (noOptimize) {
        const promises = fileList.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        );
        preparedImages = await Promise.all(promises);
      } else {
        const promises = fileList.map((file) => compressAndOptimizeImage(file, maxDimension, quality, alwaysOptimize));
        preparedImages = await Promise.all(promises);
      }

      // Upload to Supabase Storage bucket via server API route
      let finalImages: string[] = preparedImages;
      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: preparedImages, folder, name: folder }),
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && Array.isArray(uploadData.urls) && uploadData.urls.length > 0) {
          finalImages = uploadData.urls;
        } else {
          console.warn("Storage upload API error, fallback to prepared:", uploadData);
        }
      } catch (uploadErr) {
        console.warn("Storage bucket upload network error, fallback to prepared:", uploadErr);
      }

      if (single) {
        onChange([finalImages[0]]);
      } else {
        onChange([...images, ...finalImages]);
      }
    } catch (err) {
      console.error("Image upload error:", err);
      alert("Error reading image file. Please try another image.");
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    if (single) {
      onChange([urlInput.trim()]);
    } else {
      onChange([...images, urlInput.trim()]);
    }
    setUrlInput("");
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(images.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsUrlMode(!isUrlMode)}
          className="text-[10px] uppercase tracking-wider text-crimson hover:underline flex items-center space-x-1"
        >
          {isUrlMode ? (
            <>
              <Upload className="w-3 h-3" />
              <span>Switch to Local File Upload</span>
            </>
          ) : (
            <>
              <LinkIcon className="w-3 h-3" />
              <span>Paste Image URL</span>
            </>
          )}
        </button>
      </div>

      {/* Main Upload Drop Area */}
      {!isUrlMode ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-ivory-300 hover:border-gold bg-ivory-50 hover:bg-ivory-100/70 p-6 text-center rounded cursor-pointer transition-colors group space-y-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={!single}
            onChange={handleFileSelect}
            className="hidden"
          />
          {isCompressing ? (
            <div className="py-2 space-y-2">
              <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto" />
              <p className="text-xs font-bold text-gold uppercase tracking-wider">
                ✨ Uploading to Supabase Storage Bucket...
              </p>
              <p className="text-[10px] text-ink-muted">
                Optimizing photo & saving to public cloud storage bucket ({folder}/).
              </p>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-gold/15 text-gold flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-ink uppercase tracking-wider">
                Click to Select Image File(s) from Device
              </p>
              <p className="text-[10px] text-ink-muted">
                High-resolution DSLR & 4K photos will automatically be optimized on-the-fly.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Paste image web link (https://...)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 border border-ivory-300 rounded p-2.5 text-xs text-ink outline-none"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-4 py-2.5 bg-gold text-ivory text-xs uppercase tracking-wider font-semibold flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add URL</span>
          </button>
        </div>
      )}

      {/* Uploaded Images Gallery Preview with Image Dimensions Display */}
      {images.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-[10px] uppercase tracking-wider text-gold font-semibold">
            Uploaded Preview ({images.length} image{images.length > 1 ? "s" : ""})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((imgSrc, idx) => {
              const dim = dimensions[imgSrc];
              return (
                <div
                  key={idx}
                  className="relative bg-ivory-200 border border-gold rounded overflow-hidden group shadow-sm flex flex-col"
                >
                  <div className="relative aspect-square w-full">
                    <Image
                      src={imgSrc}
                      alt={`Preview ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="absolute top-1 right-1 p-1 bg-crimson text-ivory rounded-full shadow hover:scale-110 transition-transform z-10"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-crimson/90 text-ivory text-[8px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wider z-10">
                        Cover
                      </span>
                    )}
                    {imgSrc.includes("/storage/v1/object/public/") && (
                      <span className="absolute bottom-1 right-1 bg-emerald-800/90 text-ivory text-[7px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wider z-10">
                        Storage Bucket
                      </span>
                    )}
                  </div>

                  {/* DIMENSION BADGE DISPLAY */}
                  <div className="p-1.5 bg-ink text-ivory text-[9px] font-mono text-center border-t border-gold/30">
                    {dim ? (
                      <span className="text-gold font-semibold">
                        {dim.width} × {dim.height} px
                      </span>
                    ) : (
                      <span className="text-ivory-300">Reading size...</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Supabase credentials not configured on server" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Ensure bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const hasImages = buckets?.some(
        (b) => b.name === "images" || b.id === "images"
      );
      if (!hasImages) {
        await supabase.storage.createBucket("images", {
          public: true,
          fileSizeLimit: 10485760,
          allowedMimeTypes: [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp",
            "image/gif",
          ],
        });
      }
    } catch {
      // Continue even if listBuckets fails
    }

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const files = formData.getAll("file") as File[];
      const folder = ((formData.get("folder") as string) || "products").replace(
        /[^a-zA-Z0-9_-]/g,
        ""
      );

      if (!files || files.length === 0) {
        return NextResponse.json(
          { error: "No files found in form data" },
          { status: 400 }
        );
      }

      const uploadedUrls: string[] = [];

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const originalName = file.name || "photo.webp";
        const parts = originalName.split(".");
        const extension = (parts.length > 1 ? parts.pop()! : "webp").toLowerCase();
        const safeBaseName = parts
          .join(".")
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .substring(0, 30);
        const fileName = `${safeBaseName || "img"}-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 7)}.${extension}`;
        const filePath = `${folder}/${fileName}`;

        let mimeType = file.type;
        if (!mimeType || mimeType === "application/octet-stream") {
          mimeType =
            extension === "png"
              ? "image/png"
              : extension === "jpg" || extension === "jpeg"
              ? "image/jpeg"
              : extension === "gif"
              ? "image/gif"
              : "image/webp";
        }

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          return NextResponse.json(
            { error: uploadError.message },
            { status: 500 }
          );
        }

        const { data: publicUrlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      return NextResponse.json({
        success: true,
        urls: uploadedUrls,
        url: uploadedUrls[0],
      });
    } else {
      // Handle JSON base64 payloads
      const body = await req.json();
      const {
        image,
        images,
        folder = "products",
        name = "photo",
      } = body;

      const itemsToUpload = images || (image ? [image] : []);
      if (!Array.isArray(itemsToUpload) || itemsToUpload.length === 0) {
        return NextResponse.json(
          { error: "No image provided in request body" },
          { status: 400 }
        );
      }

      const cleanFolder = String(folder).replace(/[^a-zA-Z0-9_-]/g, "") || "products";
      const uploadedUrls: string[] = [];

      for (const item of itemsToUpload) {
        if (typeof item === "string" && item.startsWith("data:image/")) {
          const match = item.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            const base64Data = match[2];
            const buffer = Buffer.from(base64Data, "base64");
            const ext =
              mimeType.split("/")[1]?.replace("jpeg", "jpg") || "webp";
            const fileName = `${name}-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 7)}.${ext}`;
            const filePath = `${cleanFolder}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from("images")
              .upload(filePath, buffer, {
                contentType: mimeType,
                upsert: true,
              });

            if (uploadError) {
              console.error("Base64 upload error:", uploadError);
              return NextResponse.json(
                { error: uploadError.message },
                { status: 500 }
              );
            }

            const { data: publicUrlData } = supabase.storage
              .from("images")
              .getPublicUrl(filePath);

            uploadedUrls.push(publicUrlData.publicUrl);
            continue;
          }
        }
        // If already a remote URL, keep as is
        uploadedUrls.push(item);
      }

      return NextResponse.json({
        success: true,
        urls: uploadedUrls,
        url: uploadedUrls[0],
      });
    }
  } catch (error) {
    console.error("Upload route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

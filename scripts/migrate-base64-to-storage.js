const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function uploadBase64(item, folder = "products", prefix = "img") {
  if (typeof item !== "string" || !item.startsWith("data:image/")) {
    return item;
  }

  const match = item.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return item;

  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");
  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "webp";
  const cleanPrefix = String(prefix).replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 20) || "photo";
  const filePath = `${folder}/${cleanPrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    console.error(`Failed to upload ${filePath}:`, uploadError);
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from("images")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

async function migrateAll() {
  console.log("Starting Migration of Base64 Images to Supabase Storage Bucket 'images'...\n");

  // 1. Categories
  console.log("=== 1. Migrating Categories ===");
  const { data: categories, error: catErr } = await supabase.from("categories").select("*");
  if (catErr) console.error("Error fetching categories:", catErr);
  else {
    for (const cat of categories) {
      if (cat.image_url && cat.image_url.startsWith("data:image/")) {
        console.log(`Uploading category image for: ${cat.name}`);
        const newUrl = await uploadBase64(cat.image_url, "categories", "category");
        await supabase.from("categories").update({ image_url: newUrl }).eq("id", cat.id);
        console.log(`✓ Updated category ${cat.name} -> ${newUrl}`);
      }
    }
  }

  // 2. Banners
  console.log("\n=== 2. Migrating Banners ===");
  const { data: banners, error: banErr } = await supabase.from("banners").select("*");
  if (banErr) console.error("Error fetching banners:", banErr);
  else {
    for (const ban of banners) {
      const updates = {};
      if (ban.image_url && ban.image_url.startsWith("data:image/")) {
        console.log(`Uploading banner image for: ${ban.title}`);
        updates.image_url = await uploadBase64(ban.image_url, "banners", "banner-desktop");
      }
      if (ban.mobile_image_url && ban.mobile_image_url.startsWith("data:image/")) {
        console.log(`Uploading banner mobile image for: ${ban.title}`);
        updates.mobile_image_url = await uploadBase64(ban.mobile_image_url, "banners", "banner-mobile");
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from("banners").update(updates).eq("id", ban.id);
        console.log(`✓ Updated banner ${ban.title}`);
      }
    }
  }

  // 3. Instagram Posts
  console.log("\n=== 3. Migrating Instagram Posts ===");
  const { data: igPosts, error: igErr } = await supabase.from("instagram_posts").select("*");
  if (igErr) console.error("Error fetching instagram posts:", igErr);
  else {
    for (const ig of igPosts) {
      if (ig.image_url && ig.image_url.startsWith("data:image/")) {
        console.log(`Uploading instagram post image: ${ig.id}`);
        const newUrl = await uploadBase64(ig.image_url, "instagram", "ig-post");
        await supabase.from("instagram_posts").update({ image_url: newUrl }).eq("id", ig.id);
        console.log(`✓ Updated instagram post ${ig.id} -> ${newUrl}`);
      }
    }
  }

  // 4. Products
  console.log("\n=== 4. Migrating Products ===");
  const { data: products, error: prodErr } = await supabase.from("products").select("*");
  if (prodErr) console.error("Error fetching products:", prodErr);
  else {
    for (const prod of products) {
      let changed = false;
      const updates = {};

      // Migrate product images array
      if (Array.isArray(prod.images)) {
        const newImages = [];
        for (let i = 0; i < prod.images.length; i++) {
          const img = prod.images[i];
          if (typeof img === "string" && img.startsWith("data:image/")) {
            console.log(`Uploading product image #${i + 1} for: ${prod.name}`);
            const uploadedUrl = await uploadBase64(img, "products", "prod");
            newImages.push(uploadedUrl);
            changed = true;
          } else {
            newImages.push(img);
          }
        }
        if (changed) updates.images = newImages;
      }

      // Migrate color_images dictionary
      if (prod.color_images && typeof prod.color_images === "object") {
        const newColorImages = {};
        let colorChanged = false;
        for (const [colorName, imgArr] of Object.entries(prod.color_images)) {
          if (Array.isArray(imgArr)) {
            const uploadedArr = [];
            for (let j = 0; j < imgArr.length; j++) {
              const cImg = imgArr[j];
              if (typeof cImg === "string" && cImg.startsWith("data:image/")) {
                console.log(`Uploading color [${colorName}] img #${j + 1} for: ${prod.name}`);
                const uploadedUrl = await uploadBase64(cImg, "products", `prod-${colorName}`);
                uploadedArr.push(uploadedUrl);
                colorChanged = true;
              } else {
                uploadedArr.push(cImg);
              }
            }
            newColorImages[colorName] = uploadedArr;
          } else {
            newColorImages[colorName] = imgArr;
          }
        }
        if (colorChanged) {
          updates.color_images = newColorImages;
          changed = true;
        }
      }

      if (changed) {
        const { error: updErr } = await supabase.from("products").update(updates).eq("id", prod.id);
        if (updErr) {
          console.error(`Error updating product ${prod.id} (${prod.name}):`, updErr);
        } else {
          console.log(`✓ Updated product ${prod.name} (${prod.id}) with storage URLs.`);
        }
      }
    }
  }

  console.log("\n==========================================");
  console.log("Migration finished! Verifying results...");
  console.log("==========================================");
}

migrateAll();

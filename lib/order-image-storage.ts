import "server-only";
import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { orderImageUrl } from "./order-images";

export async function permanentOrderImage(db: SupabaseClient, image: unknown): Promise<string> {
  if (typeof image !== "string" || !image.startsWith("data:image/")) return orderImageUrl(image);
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(image);
  if (!match || image.length > 35 * 1024 * 1024) throw new Error("This product image needs to be reuploaded before checkout.");
  const bytes = Buffer.from(match[2], "base64");
  const digest = createHash("sha256").update(bytes).digest("hex");
  const object = `order-snapshots/${digest}.${match[1].split("/")[1].replace("jpeg", "jpg")}`;
  const { error } = await db.storage.from("images").upload(object, bytes, { contentType: match[1], cacheControl: "31536000", upsert: true });
  if (error) throw new Error("Could not save the product image for this order. Please retry.");
  return db.storage.from("images").getPublicUrl(object).data.publicUrl;
}

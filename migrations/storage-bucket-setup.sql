-- ===================================================================
-- Kaavu StylesS - SUPABASE STORAGE BUCKET MIGRATION
-- ===================================================================
-- Ensures the public 'images' storage bucket is created and accessible
-- for products, banners, categories, and instagram photos.
-- ===================================================================

-- 1. Create 'images' bucket with public access and 10MB limit
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'images',
    'images',
    true,
    10485760,
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

-- 2. Drop existing policies if any to prevent duplicate errors
DROP POLICY IF EXISTS "Public Read Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Images" ON storage.objects;

-- 3. Allow public read access to all images in the bucket
CREATE POLICY "Public Read Images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- 4. Allow public / authenticated upload access to images bucket
CREATE POLICY "Public Insert Images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images');

-- 5. Allow public / authenticated update access to images bucket
CREATE POLICY "Public Update Images" ON storage.objects
FOR UPDATE USING (bucket_id = 'images');

-- 6. Allow public / authenticated delete access to images bucket
CREATE POLICY "Public Delete Images" ON storage.objects
FOR DELETE USING (bucket_id = 'images');

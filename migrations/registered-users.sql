-- Kaavu Styles Registered Users Migration
-- Run this script in the Supabase SQL Editor to support cloud sync for registered customers

CREATE TABLE IF NOT EXISTS public.registered_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.registered_users ENABLE ROW LEVEL SECURITY;

-- Allow Public & Service Role to read registered users
CREATE POLICY "Allow Public & Admin Read Registered Users" 
    ON public.registered_users 
    FOR SELECT 
    USING (true);

-- Allow Public to register new users (Insert)
CREATE POLICY "Allow Public Insert Registered Users" 
    ON public.registered_users 
    FOR INSERT 
    WITH CHECK (true);

-- Allow Public/Admin to update registered users (Upsert)
CREATE POLICY "Allow Public & Admin Update Registered Users" 
    ON public.registered_users 
    FOR UPDATE 
    USING (true);

-- Allow Admin to delete registered users
CREATE POLICY "Allow Admin Delete Registered Users" 
    ON public.registered_users 
    FOR DELETE 
    USING (true);

-- Seed initial sample registered customers if empty
INSERT INTO public.registered_users (name, email, phone, role) VALUES
('Priya Sharma', 'priya.sharma@example.com', '+91 98450 12345', 'customer'),
('Ananya Rao', 'ananya.rao@example.com', '+91 98765 43210', 'customer'),
('Deepika Patel', 'deepika.patel@example.com', '+91 91234 56789', 'customer')
ON CONFLICT (email) DO NOTHING;

/*
# Multi-Vendor E-Commerce Marketplace Schema

## Overview
This migration creates a complete multi-vendor marketplace database with:
- User profiles with vendor/customer roles
- Product catalog with categories and images
- Shopping cart and order management
- Product reviews and ratings
- Vendor dashboard data

## Tables Created

1. **profiles** - Extends auth.users with role differentiation
   - id (uuid, PK, references auth.users)
   - email (text)
   - full_name (text)
   - role (text) - 'customer' or 'vendor'
   - store_name (text) - for vendors
   - store_description (text) - for vendors
   - avatar_url (text)
   - created_at, updated_at (timestamps)

2. **categories** - Product categories
   - id (uuid, PK)
   - name (text)
   - slug (text, unique)
   - description (text)
   - image_url (text)
   - parent_id (uuid, self-referencing for subcategories)
   - created_at (timestamp)

3. **products** - Vendor products
   - id (uuid, PK)
   - vendor_id (uuid, FK to profiles)
   - category_id (uuid, FK to categories)
   - name (text)
   - slug (text, unique)
   - description (text)
   - price (decimal)
   - compare_price (decimal) - original price for discounts
   - stock_quantity (integer)
   - status (text) - 'draft', 'active', 'archived'
   - featured (boolean)
   - created_at, updated_at (timestamps)

4. **product_images** - Product gallery
   - id (uuid, PK)
   - product_id (uuid, FK to products)
   - url (text)
   - alt_text (text)
   - position (integer)
   - created_at (timestamp)

5. **cart_items** - Shopping cart
   - id (uuid, PK)
   - user_id (uuid, FK to profiles)
   - product_id (uuid, FK to products)
   - quantity (integer)
   - created_at, updated_at (timestamps)

6. **orders** - Customer orders
   - id (uuid, PK)
   - user_id (uuid, FK to profiles)
   - status (text) - 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
   - total_amount (decimal)
   - shipping_address (jsonb)
   - payment_status (text)
   - created_at, updated_at (timestamps)

7. **order_items** - Items within orders
   - id (uuid, PK)
   - order_id (uuid, FK to orders)
   - product_id (uuid, FK to products)
   - vendor_id (uuid, FK to profiles)
   - product_name (text) - snapshot at order time
   - quantity (integer)
   - price (decimal) - snapshot at order time
   - created_at (timestamp)

8. **reviews** - Product reviews
   - id (uuid, PK)
   - product_id (uuid, FK to products)
   - user_id (uuid, FK to profiles)
   - rating (integer, 1-5)
   - comment (text)
   - created_at (timestamp)

9. **vendor_payouts** - Track vendor earnings
   - id (uuid, PK)
   - vendor_id (uuid, FK to profiles)
   - amount (decimal)
   - status (text) - 'pending', 'paid'
   - paid_at (timestamp)
   - created_at (timestamp)

## Security
- RLS enabled on all tables
- Vendors can only manage their own products and view their own orders
- Customers can only access their own cart, orders, and reviews
- Public read access for active products and categories
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    full_name text,
    role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'admin')),
    store_name text,
    store_description text,
    avatar_url text,
    phone text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    image_url text,
    parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    price decimal(10,2) NOT NULL CHECK (price >= 0),
    compare_price decimal(10,2) CHECK (compare_price >= 0),
    stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
    featured boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Product images table
CREATE TABLE IF NOT EXISTS product_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url text NOT NULL,
    alt_text text,
    position integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount decimal(10,2) NOT NULL,
    shipping_address jsonb,
    payment_status text DEFAULT 'pending',
    payment_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE SET NULL,
    vendor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_name text NOT NULL,
    product_image text,
    quantity integer NOT NULL CHECK (quantity > 0),
    price decimal(10,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(product_id, user_id)
);

-- Vendor payouts table
CREATE TABLE IF NOT EXISTS vendor_payouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount decimal(10,2) NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    paid_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_id ON order_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payouts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
    TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
    TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
    TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Categories - public read, admin manage (for now allow authenticated to read)
DROP POLICY IF EXISTS "categories_read" ON categories;
CREATE POLICY "categories_read" ON categories FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_manage" ON categories;
CREATE POLICY "categories_manage" ON categories FOR ALL
    TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Products - public read active products, vendors manage own
DROP POLICY IF EXISTS "products_read_active" ON products;
CREATE POLICY "products_read_active" ON products FOR SELECT
    TO anon, authenticated USING (status = 'active');

DROP POLICY IF EXISTS "products_read_own" ON products;
CREATE POLICY "products_read_own" ON products FOR SELECT
    TO authenticated USING (vendor_id = auth.uid());

DROP POLICY IF EXISTS "products_insert_vendor" ON products;
CREATE POLICY "products_insert_vendor" ON products FOR INSERT
    TO authenticated WITH CHECK (vendor_id = auth.uid());

DROP POLICY IF EXISTS "products_update_vendor" ON products;
CREATE POLICY "products_update_vendor" ON products FOR UPDATE
    TO authenticated USING (vendor_id = auth.uid()) WITH CHECK (vendor_id = auth.uid());

DROP POLICY IF EXISTS "products_delete_vendor" ON products;
CREATE POLICY "products_delete_vendor" ON products FOR DELETE
    TO authenticated USING (vendor_id = auth.uid());

-- Product images - follow product visibility
DROP POLICY IF EXISTS "product_images_read" ON product_images;
CREATE POLICY "product_images_read" ON product_images FOR SELECT
    TO anon, authenticated USING (
        EXISTS (SELECT 1 FROM products WHERE products.id = product_images.product_id AND products.status = 'active')
        OR EXISTS (SELECT 1 FROM products WHERE products.id = product_images.product_id AND products.vendor_id = auth.uid())
    );

DROP POLICY IF EXISTS "product_images_manage" ON product_images;
CREATE POLICY "product_images_manage" ON product_images FOR ALL
    TO authenticated USING (
        EXISTS (SELECT 1 FROM products WHERE products.id = product_images.product_id AND products.vendor_id = auth.uid())
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM products WHERE products.id = product_images.product_id AND products.vendor_id = auth.uid())
    );

-- Cart items - users manage own cart
DROP POLICY IF EXISTS "cart_items_select_own" ON cart_items;
CREATE POLICY "cart_items_select_own" ON cart_items FOR SELECT
    TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "cart_items_insert_own" ON cart_items;
CREATE POLICY "cart_items_insert_own" ON cart_items FOR INSERT
    TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cart_items_update_own" ON cart_items;
CREATE POLICY "cart_items_update_own" ON cart_items FOR UPDATE
    TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cart_items_delete_own" ON cart_items;
CREATE POLICY "cart_items_delete_own" ON cart_items FOR DELETE
    TO authenticated USING (user_id = auth.uid());

-- Orders - users manage own orders, vendors see their order items
DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own" ON orders FOR SELECT
    TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own" ON orders FOR INSERT
    TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "orders_update_own" ON orders;
CREATE POLICY "orders_update_own" ON orders FOR UPDATE
    TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Order items - customers see their orders, vendors see their products in orders
DROP POLICY IF EXISTS "order_items_select" ON order_items;
CREATE POLICY "order_items_select" ON order_items FOR SELECT
    TO authenticated USING (
        EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
        OR vendor_id = auth.uid()
    );

DROP POLICY IF EXISTS "order_items_insert" ON order_items;
CREATE POLICY "order_items_insert" ON order_items FOR INSERT
    TO authenticated WITH CHECK (
        EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
    );

-- Reviews - public read, users manage own reviews
DROP POLICY IF EXISTS "reviews_read" ON reviews;
CREATE POLICY "reviews_read" ON reviews FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT
    TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE
    TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE
    TO authenticated USING (user_id = auth.uid());

-- Vendor payouts - vendors see own payouts
DROP POLICY IF EXISTS "vendor_payouts_select_own" ON vendor_payouts;
CREATE POLICY "vendor_payouts_select_own" ON vendor_payouts FOR SELECT
    TO authenticated USING (vendor_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for auto-creating profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
    ('Electronics', 'electronics', 'Electronic devices and gadgets'),
    ('Fashion', 'fashion', 'Clothing, shoes, and accessories'),
    ('Home & Garden', 'home-garden', 'Home decor, furniture, and garden supplies'),
    ('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear'),
    ('Books & Media', 'books-media', 'Books, music, and movies'),
    ('Health & Beauty', 'health-beauty', 'Health and beauty products'),
    ('Toys & Games', 'toys-games', 'Toys, games, and hobbies'),
    ('Automotive', 'automotive', 'Car parts and accessories')
ON CONFLICT (slug) DO NOTHING;
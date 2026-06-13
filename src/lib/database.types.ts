// ─── Supabase Database Types ─────────────────────────────────────────────────
//
// SQL לביצוע ב-Supabase Dashboard → SQL Editor:
//
// -- הפעל הרחבת UUID
// CREATE EXTENSION IF NOT EXISTS "pgcrypto";
//
// -- משתמשים
// CREATE TABLE users (
//   id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   auth_id       UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
//   first_name    TEXT NOT NULL,
//   last_name     TEXT NOT NULL,
//   email         TEXT UNIQUE NOT NULL,
//   phone         TEXT UNIQUE NOT NULL,
//   address       TEXT,
//   id_image_url  TEXT,
//   is_verified   BOOLEAN DEFAULT FALSE,
//   is_premium    BOOLEAN DEFAULT FALSE,
//   created_at    TIMESTAMPTZ DEFAULT NOW()
// );
//
// -- פריטים
// CREATE TABLE items (
//   id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   seller_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   name        TEXT NOT NULL,
//   brand       TEXT,
//   category    TEXT NOT NULL,
//   price       INTEGER NOT NULL CHECK (price > 0),
//   size        TEXT NOT NULL,
//   condition   TEXT NOT NULL,
//   description TEXT,
//   image_url   TEXT,
//   location    TEXT,
//   is_available BOOLEAN DEFAULT TRUE,
//   created_at  TIMESTAMPTZ DEFAULT NOW()
// );
// CREATE INDEX items_seller_idx ON items(seller_id);
// CREATE INDEX items_category_idx ON items(category);
//
// -- התאמות (לייק של קונה על פריט)
// CREATE TABLE matches (
//   id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   item_id     UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
//   buyer_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   seller_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   status      TEXT NOT NULL DEFAULT 'pending'
//                CHECK (status IN ('pending','accepted','declined')),
//   created_at  TIMESTAMPTZ DEFAULT NOW(),
//   UNIQUE (item_id, buyer_id)
// );
//
// -- הודעות
// CREATE TABLE messages (
//   id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
//   sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   text        TEXT NOT NULL,
//   is_read     BOOLEAN DEFAULT FALSE,
//   created_at  TIMESTAMPTZ DEFAULT NOW()
// );
// CREATE INDEX messages_match_idx ON messages(match_id);
//
// -- RLS (Row Level Security) - אפשר גישה למשתמשים שלהם בלבד
// ALTER TABLE users ENABLE ROW LEVEL SECURITY;
// ALTER TABLE items ENABLE ROW LEVEL SECURITY;
// ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
// ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
//
// CREATE POLICY "users: own row" ON users
//   USING (auth_id = auth.uid());
// CREATE POLICY "items: public read" ON items FOR SELECT USING (true);
// CREATE POLICY "items: own write" ON items FOR ALL
//   USING (seller_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
// CREATE POLICY "matches: participants" ON matches
//   USING (
//     buyer_id  = (SELECT id FROM users WHERE auth_id = auth.uid()) OR
//     seller_id = (SELECT id FROM users WHERE auth_id = auth.uid())
//   );
// CREATE POLICY "messages: match participants" ON messages
//   USING (
//     match_id IN (
//       SELECT id FROM matches WHERE
//         buyer_id  = (SELECT id FROM users WHERE auth_id = auth.uid()) OR
//         seller_id = (SELECT id FROM users WHERE auth_id = auth.uid())
//     )
//   );

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_id: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          address: string | null;
          id_image_url: string | null;
          is_verified: boolean;
          is_premium: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      items: {
        Row: {
          id: string;
          seller_id: string;
          name: string;
          brand: string | null;
          category: string;
          price: number;
          size: string;
          condition: string;
          description: string | null;
          image_url: string | null;
          location: string | null;
          is_available: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['items']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['items']['Insert']>;
      };
      matches: {
        Row: {
          id: string;
          item_id: string;
          buyer_id: string;
          seller_id: string;
          status: 'pending' | 'accepted' | 'declined';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['matches']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['matches']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          text: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
    };
  };
}

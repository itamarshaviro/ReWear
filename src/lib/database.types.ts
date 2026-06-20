// ─── Supabase Database Types ─────────────────────────────────────────────────
//
// הרץ את ה-SQL הבא ב-Supabase Dashboard → SQL Editor:
//
// CREATE EXTENSION IF NOT EXISTS "pgcrypto";
//
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
// CREATE TABLE items (
//   id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   seller_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   seller_name  TEXT NOT NULL,
//   name         TEXT NOT NULL,
//   brand        TEXT,
//   category     TEXT NOT NULL,
//   price        INTEGER NOT NULL CHECK (price > 0),
//   size         TEXT NOT NULL,
//   condition    TEXT NOT NULL,
//   color        TEXT,
//   description  TEXT,
//   image_url    TEXT,
//   location     TEXT,
//   is_available BOOLEAN DEFAULT TRUE,
//   created_at   TIMESTAMPTZ DEFAULT NOW()
// );
// CREATE INDEX items_seller_idx   ON items(seller_id);
// CREATE INDEX items_category_idx ON items(category);
//
// CREATE TABLE matches (
//   id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   item_id     UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
//   buyer_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   seller_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   buyer_name  TEXT NOT NULL,
//   status      TEXT NOT NULL DEFAULT 'pending'
//                CHECK (status IN ('pending','accepted','declined')),
//   created_at  TIMESTAMPTZ DEFAULT NOW(),
//   UNIQUE (item_id, buyer_id)
// );
//
// CREATE TABLE messages (
//   id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   match_id   UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
//   sender_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   text       TEXT NOT NULL,
//   is_read    BOOLEAN DEFAULT FALSE,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
// CREATE INDEX messages_match_idx ON messages(match_id);
//
// CREATE TABLE ratings (
//   id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   match_id     UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
//   reviewer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   score        INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
//   review       TEXT NOT NULL DEFAULT '',
//   role         TEXT NOT NULL CHECK (role IN ('buyer','seller')),
//   created_at   TIMESTAMPTZ DEFAULT NOW(),
//   UNIQUE (match_id, reviewer_id)
// );
//
// -- RLS
// ALTER TABLE users    ENABLE ROW LEVEL SECURITY;
// ALTER TABLE items    ENABLE ROW LEVEL SECURITY;
// ALTER TABLE matches  ENABLE ROW LEVEL SECURITY;
// ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
// ALTER TABLE ratings  ENABLE ROW LEVEL SECURITY;
//
// CREATE POLICY "users: own row" ON users
//   USING (auth_id = auth.uid());
// CREATE POLICY "users: insert own" ON users FOR INSERT
//   WITH CHECK (auth_id = auth.uid());
//
// CREATE POLICY "items: public read" ON items FOR SELECT USING (true);
// CREATE POLICY "items: own write"   ON items FOR ALL
//   USING (seller_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
//
// CREATE POLICY "matches: participants" ON matches
//   USING (
//     buyer_id  = (SELECT id FROM users WHERE auth_id = auth.uid()) OR
//     seller_id = (SELECT id FROM users WHERE auth_id = auth.uid())
//   );
// CREATE POLICY "matches: buyer insert" ON matches FOR INSERT
//   WITH CHECK (buyer_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
//
// CREATE POLICY "messages: match participants" ON messages
//   USING (
//     match_id IN (
//       SELECT id FROM matches WHERE
//         buyer_id  = (SELECT id FROM users WHERE auth_id = auth.uid()) OR
//         seller_id = (SELECT id FROM users WHERE auth_id = auth.uid())
//     )
//   );
// CREATE POLICY "messages: insert participant" ON messages FOR INSERT
//   WITH CHECK (
//     sender_id = (SELECT id FROM users WHERE auth_id = auth.uid())
//   );
//
// CREATE POLICY "ratings: own" ON ratings
//   USING (reviewer_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
// CREATE POLICY "ratings: insert own" ON ratings FOR INSERT
//   WITH CHECK (reviewer_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
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
        Insert: {
          id?: string;
          auth_id?: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          address?: string | null;
          id_image_url?: string | null;
          is_verified?: boolean;
          is_premium?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          auth_id?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          address?: string | null;
          id_image_url?: string | null;
          is_verified?: boolean;
          is_premium?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          seller_id: string;
          seller_name: string;
          name: string;
          brand: string | null;
          category: string;
          price: number;
          size: string;
          condition: string;
          color: string | null;
          description: string | null;
          image_url: string | null;
          location: string | null;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          seller_name: string;
          name: string;
          brand?: string | null;
          category: string;
          price: number;
          size: string;
          condition: string;
          color?: string | null;
          description?: string | null;
          image_url?: string | null;
          location?: string | null;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          seller_name?: string;
          name?: string;
          brand?: string | null;
          category?: string;
          price?: number;
          size?: string;
          condition?: string;
          color?: string | null;
          description?: string | null;
          image_url?: string | null;
          location?: string | null;
          is_available?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          item_id: string;
          buyer_id: string;
          seller_id: string;
          buyer_name: string;
          status: 'pending' | 'accepted' | 'declined';
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          buyer_id: string;
          seller_id: string;
          buyer_name: string;
          status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          buyer_id?: string;
          seller_id?: string;
          buyer_name?: string;
          status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
        };
        Relationships: [];
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
        Insert: {
          id?: string;
          match_id: string;
          sender_id: string;
          text: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          sender_id?: string;
          text?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      ratings: {
        Row: {
          id: string;
          match_id: string;
          reviewer_id: string;
          score: number;
          review: string;
          role: 'buyer' | 'seller';
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          reviewer_id: string;
          score: number;
          review: string;
          role: 'buyer' | 'seller';
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          reviewer_id?: string;
          score?: number;
          review?: string;
          role?: 'buyer' | 'seller';
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

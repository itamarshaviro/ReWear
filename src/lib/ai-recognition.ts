import type { Category, Condition } from '@/data/mock';

const HF_TOKEN = process.env.EXPO_PUBLIC_HUGGINGFACE_TOKEN ?? '';
const HF_MODEL = 'Salesforce/blip-image-captioning-base';

// ── Color maps ────────────────────────────────────────────────────────────────

const COLOR_MAP: [string, string][] = [
  ['dark blue', 'כחול כהה'], ['navy blue', 'נייבי'], ['navy', 'נייבי'],
  ['light blue', 'כחול בהיר'], ['sky blue', 'כחול שמיים'],
  ['dark green', 'ירוק כהה'], ['olive', 'זית'], ['khaki', 'חאקי'],
  ['dark brown', 'חום כהה'], ['light brown', 'חום בהיר'],
  ['hot pink', 'ורוד חם'], ['light pink', 'ורוד בהיר'],
  ['black', 'שחור'], ['white', 'לבן'], ['grey', 'אפור'], ['gray', 'אפור'],
  ['blue', 'כחול'], ['red', 'אדום'], ['green', 'ירוק'], ['brown', 'חום'],
  ['pink', 'ורוד'], ['yellow', 'צהוב'], ['orange', 'כתום'],
  ['purple', 'סגול'], ['beige', 'בז\''], ['cream', 'קרם'], ['tan', 'בז\''],
  ['burgundy', 'בורדו'], ['maroon', 'בורדו'], ['turquoise', 'טורקיז'],
  ['coral', 'קורל'], ['gold', 'זהב'], ['silver', 'כסף'],
];

// Cloudinary predominant hex → named color
const HEX_COLOR_RANGES: [number, number, number, string][] = [
  // [r, g, b, name] — simple nearest-neighbor table
  [0,   0,   0,   'שחור'],
  [255, 255, 255, 'לבן'],
  [128, 128, 128, 'אפור'],
  [0,   0,   128, 'כחול כהה'],
  [0,   0,   255, 'כחול'],
  [135, 206, 250, 'כחול בהיר'],
  [255, 0,   0,   'אדום'],
  [0,   128, 0,   'ירוק'],
  [128, 128, 0,   'זית'],
  [101, 67,  33,  'חום'],
  [245, 245, 220, 'בז\''],
  [255, 192, 203, 'ורוד'],
  [128, 0,   128, 'סגול'],
  [255, 165, 0,   'כתום'],
  [255, 255, 0,   'צהוב'],
  [192, 192, 192, 'כסף'],
  [255, 215, 0,   'זהב'],
  [128, 0,   0,   'בורדו'],
  [0,   128, 128, 'טורקיז'],
];

export function hexToHebrewColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  let best = 'אפור';
  let bestDist = Infinity;
  for (const [cr, cg, cb, name] of HEX_COLOR_RANGES) {
    const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
    if (d < bestDist) { bestDist = d; best = name; }
  }
  return best;
}

// ── Category map ──────────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: [string[], Category][] = [
  [['jeans', 'pants', 'trousers', 'chinos', 'shorts', 'jogger', 'denim'], 'mens-pants'],
  [['shirt', 't-shirt', 'tshirt', 'polo', 'jacket', 'hoodie', 'sweatshirt', 'sweater', 'coat', 'blazer'], 'mens-shirts'],
  [['dress', 'gown', 'skirt'], 'womens-dresses'],
  [['blouse', 'top', 'tank top', 'camisole', 'crop'], 'womens-tops'],
  [['shoes', 'sneakers', 'boots', 'heels', 'sandals', 'loafers', 'trainers', 'footwear'], 'shoes'],
  [['bag', 'purse', 'handbag', 'backpack', 'necklace', 'bracelet', 'watch', 'belt', 'scarf', 'hat'], 'accessories'],
];

const BRANDS: [string, string][] = [
  ['nike', 'Nike'], ['adidas', 'Adidas'], ['zara', 'Zara'], ['h&m', 'H&M'],
  ['mango', 'Mango'], ['gucci', 'Gucci'], ['prada', 'Prada'],
  ["levi's", "Levi's"], ['levis', "Levi's"], ['wrangler', 'Wrangler'],
  ['ralph lauren', 'Ralph Lauren'], ['tommy', 'Tommy Hilfiger'],
  ['calvin klein', 'Calvin Klein'], ['pull&bear', 'Pull&Bear'],
  ['pull and bear', 'Pull&Bear'], ['asos', 'ASOS'], ['gap', 'GAP'],
  ['uniqlo', 'Uniqlo'], ['shein', 'SHEIN'], ['puma', 'Puma'],
  ['new balance', 'New Balance'], ['vans', 'Vans'], ['converse', 'Converse'],
  ['dr martens', 'Dr. Martens'], ['guess', 'Guess'],
];

const CONDITION_KEYWORDS: [string[], Condition][] = [
  [['new with tag', 'brand new', 'with tags', 'bnwt'], 'new-with-tag'],
  [['new without tag', 'unworn', 'never worn', 'nwot'], 'new-without-tag'],
  [['excellent', 'like new', 'mint', 'perfect'], 'perfect'],
  [['good condition', 'gently used', 'light wear'], 'good'],
  [['fair', 'used', 'worn', 'some wear'], 'fair'],
];

// ── Parser ────────────────────────────────────────────────────────────────────

export type RecognitionResult = {
  caption: string;
  name?: string;
  brand?: string;
  color?: string;
  category?: Category;
  condition?: Condition;
  confidence: {
    name: number;
    brand: number;
    category: number;
    condition: number;
    color: number;
  };
};

export function parseCaption(caption: string): RecognitionResult {
  const lower = caption.toLowerCase();

  // Color
  let color: string | undefined;
  for (const [en, he] of COLOR_MAP) {
    if (lower.includes(en)) { color = he; break; }
  }

  // Category
  let category: Category | undefined;
  for (const [keywords, cat] of CATEGORY_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) { category = cat; break; }
  }

  // Brand
  let brand: string | undefined;
  for (const [en, he] of BRANDS) {
    if (lower.includes(en)) { brand = he; break; }
  }

  // Condition
  let condition: Condition | undefined;
  for (const [keywords, cond] of CONDITION_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) { condition = cond; break; }
  }

  // Build Hebrew name
  const CATEGORY_HE: Partial<Record<Category, string>> = {
    'mens-pants': "מכנסיים", 'mens-shirts': 'חולצה', 'womens-dresses': 'שמלה',
    'womens-shirts': 'חולצה', 'womens-tops': 'גופייה', 'shoes': 'נעליים',
    'accessories': 'אביזר',
  };
  const catName = category ? CATEGORY_HE[category] : undefined;
  const name = catName
    ? `${brand ? brand + ' ' : ''}${catName}${color ? ' ' + color : ''}`
    : undefined;

  return {
    caption,
    name,
    brand,
    color,
    category,
    condition,
    confidence: {
      name:      name      ? 0.78 : 0,
      brand:     brand     ? 0.85 : 0,
      category:  category  ? 0.92 : 0,
      condition: condition ? 0.75 : 0,
      color:     color     ? 0.88 : 0,
    },
  };
}

// ── Hugging Face call ─────────────────────────────────────────────────────────

export async function recognizeFromUrl(imageUrl: string): Promise<RecognitionResult | null> {
  try {
    // Fetch the image bytes from the Cloudinary URL
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const blob = await imgRes.blob();

    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream',
    };
    if (HF_TOKEN) headers['Authorization'] = `Bearer ${HF_TOKEN}`;

    const res = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      { method: 'POST', headers, body: blob }
    );

    if (!res.ok) return null;
    const data = await res.json() as { generated_text?: string }[];
    const caption = data[0]?.generated_text ?? '';
    if (!caption) return null;
    return parseCaption(caption);
  } catch {
    return null;
  }
}

export function isHFConfigured(): boolean {
  return HF_TOKEN !== '';
}

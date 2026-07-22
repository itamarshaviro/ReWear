import type { Category, Condition } from '@/data/mock';

const HF_TOKEN      = process.env.EXPO_PUBLIC_HUGGINGFACE_TOKEN ?? '';
const GEMINI_KEY    = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const OPENAI_KEY    = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const GEMINI_MODEL  = 'gemini-1.5-flash';
const CAPTION_MODEL = 'Salesforce/blip-image-captioning-base';
const VQA_MODEL     = 'Salesforce/blip-vqa-base';

// ── Color maps ─────────────────────────────────────────────────────────────────

const COLOR_MAP: [string, string][] = [
  ['dark blue', 'כחול כהה'], ['navy blue', 'נייבי'], ['navy', 'נייבי'],
  ['light blue', 'כחול בהיר'], ['sky blue', 'כחול שמיים'],
  ['dark green', 'ירוק כהה'], ['olive green', 'זית'], ['olive', 'זית'],
  ['dark brown', 'חום כהה'], ['light brown', 'חום בהיר'],
  ['hot pink', 'ורוד חם'], ['light pink', 'ורוד בהיר'], ['neon', 'ניאון'],
  ['black', 'שחור'], ['white', 'לבן'], ['grey', 'אפור'], ['gray', 'אפור'],
  ['blue', 'כחול'], ['red', 'אדום'], ['green', 'ירוק'], ['brown', 'חום'],
  ['pink', 'ורוד'], ['yellow', 'צהוב'], ['orange', 'כתום'], ['khaki', 'חאקי'],
  ['purple', 'סגול'], ['beige', 'בז\''], ['cream', 'קרם'], ['tan', 'בז\''],
  ['burgundy', 'בורדו'], ['maroon', 'בורדו'], ['turquoise', 'טורקיז'],
  ['coral', 'קורל'], ['gold', 'זהב'], ['silver', 'כסף'], ['teal', 'טורקיז'],
  ['mint', 'מנטה'], ['lavender', 'לבנדר'], ['multicolor', 'צבעוני'],
];

export function hexToHebrewColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const table: [number, number, number, string][] = [
    [0, 0, 0, 'שחור'], [255, 255, 255, 'לבן'], [128, 128, 128, 'אפור'],
    [0, 0, 128, 'כחול כהה'], [0, 0, 255, 'כחול'], [135, 206, 250, 'כחול בהיר'],
    [255, 0, 0, 'אדום'], [0, 128, 0, 'ירוק'], [128, 128, 0, 'זית'],
    [101, 67, 33, 'חום'], [245, 245, 220, 'בז\''], [255, 192, 203, 'ורוד'],
    [128, 0, 128, 'סגול'], [255, 165, 0, 'כתום'], [255, 255, 0, 'צהוב'],
    [192, 192, 192, 'כסף'], [128, 0, 0, 'בורדו'], [0, 128, 128, 'טורקיז'],
  ];
  let best = 'אפור', bestDist = Infinity;
  for (const entry of table) {
    const cr = entry[0] as number;
    const cg = entry[1] as number;
    const cb = entry[2] as number;
    const d = (r - cr) * (r - cr) + (g - cg) * (g - cg) + (b - cb) * (b - cb);
    if (d < bestDist) { bestDist = d; best = entry[3] as string; }
  }
  return best;
}

// ── Brand list ─────────────────────────────────────────────────────────────────

// Each entry: [pattern to match (lowercase), canonical display name]
const BRANDS: [string, string][] = [
  // Surf / Outdoor
  ['rip curl', 'Rip Curl'], ['ripcurl', 'Rip Curl'],
  ['billabong', 'Billabong'], ['quiksilver', 'Quiksilver'],
  ["o'neill", "O'Neill"], ['oneill', "O'Neill"], ['volcom', 'Volcom'],
  ['hurley', 'Hurley'], ['patagonia', 'Patagonia'], ['north face', 'The North Face'],
  ['columbia', 'Columbia'], ['timberland', 'Timberland'],
  // Athletic
  ['nike', 'Nike'], ['adidas', 'Adidas'], ['puma', 'Puma'],
  ['new balance', 'New Balance'], ['under armour', 'Under Armour'],
  ['reebok', 'Reebok'], ['asics', 'ASICS'], ['skechers', 'Skechers'],
  ['fila', 'Fila'], ['champion', 'Champion'], ['kappa', 'Kappa'],
  // Fashion
  ['ralph lauren', 'Ralph Lauren'], ['polo ralph', 'Ralph Lauren'],
  ['calvin klein', 'Calvin Klein'], ['tommy hilfiger', 'Tommy Hilfiger'],
  ['tommy', 'Tommy Hilfiger'], ['guess', 'Guess'],
  ['lacoste', 'Lacoste'], ['hugo boss', 'Hugo Boss'], ['boss', 'Hugo Boss'],
  ['versace', 'Versace'], ['armani', 'Armani'], ['burberry', 'Burberry'],
  ['gucci', 'Gucci'], ['prada', 'Prada'], ['louis vuitton', 'Louis Vuitton'],
  ['balenciaga', 'Balenciaga'], ['off white', 'Off-White'],
  // Denim
  ["levi's", "Levi's"], ['levis', "Levi's"], ['wrangler', 'Wrangler'],
  ['lee', 'Lee'], ['diesel', 'Diesel'],
  // Shoes
  ['vans', 'Vans'], ['converse', 'Converse'], ['dr martens', 'Dr. Martens'],
  ['birkenstock', 'Birkenstock'], ['crocs', 'Crocs'],
  // American
  ['american eagle', 'American Eagle'], ['american eagle outfitters', 'American Eagle'],
  ['hollister', 'Hollister'], ['abercrombie', 'Abercrombie & Fitch'],
  // Fast fashion
  ['zara', 'Zara'], ['mango', 'Mango'], ['h&m', 'H&M'],
  ['pull&bear', 'Pull&Bear'], ['pull and bear', 'Pull&Bear'],
  ['bershka', 'Bershka'], ['asos', 'ASOS'], ['gap', 'GAP'],
  ['uniqlo', 'Uniqlo'], ['shein', 'SHEIN'], ['primark', 'Primark'],
  ['stradivarius', 'Stradivarius'], ['massimo dutti', 'Massimo Dutti'],
];

// ── Price suggestion ───────────────────────────────────────────────────────────

const BRAND_BASE_PRICE: Record<string, number> = {
  // Luxury
  'Gucci': 900, 'Prada': 850, 'Louis Vuitton': 1200, 'Balenciaga': 1000,
  'Versace': 750, 'Armani': 600, 'Burberry': 700, 'Off-White': 650,
  // Premium fashion
  'Ralph Lauren': 280, 'Calvin Klein': 220, 'Tommy Hilfiger': 210,
  'Hugo Boss': 260, 'Lacoste': 240, 'Guess': 180, 'Diesel': 250,
  // Athletic premium
  'Nike': 180, 'Adidas': 170, 'Puma': 150, 'New Balance': 200,
  'Under Armour': 160, 'Reebok': 140, 'ASICS': 180, 'Fila': 130, 'Champion': 150,
  // Surf/outdoor
  'Rip Curl': 220, 'Billabong': 200, 'Quiksilver': 190, "O'Neill": 180,
  'Volcom': 170, 'Hurley': 160, 'Patagonia': 350, 'The North Face': 320,
  'Columbia': 250, 'Timberland': 270,
  // Shoes
  'Vans': 150, 'Converse': 140, 'Dr. Martens': 300, 'Birkenstock': 280,
  // Denim
  "Levi's": 180, 'Wrangler': 150, 'Lee': 140, 'Skechers': 160,
  // Mid fashion
  'Zara': 100, 'Mango': 90, 'H&M': 60, 'GAP': 110, 'Uniqlo': 120,
  'Massimo Dutti': 180, 'Stradivarius': 70, 'Bershka': 60,
  'Pull&Bear': 65, 'ASOS': 80,
  // Budget
  'SHEIN': 35, 'Primark': 40,
  // American
  'American Eagle': 130, 'Hollister': 120, 'Abercrombie & Fitch': 160,
};

const CONDITION_MULT: Record<Condition, number> = {
  'new-with-tag':    0.75,
  'new-without-tag': 0.65,
  'perfect':         0.60,
  'good':            0.45,
  'fair':            0.30,
  'for-parts':       0.10,
};

// Sport brands get an extra -20% (sweat items depreciate faster)
const SPORT_BRANDS = new Set([
  'Nike', 'Adidas', 'Puma', 'New Balance', 'Under Armour', 'Reebok', 'ASICS',
  'Fila', 'Champion', 'Kappa', 'Rip Curl', 'Billabong', 'Quiksilver',
  "O'Neill", 'Volcom', 'Hurley', 'Skechers',
]);

const BRAND_TIER_MULT: Record<string, number> = {
  // Luxury +10%
  'Gucci': 1.10, 'Prada': 1.10, 'Louis Vuitton': 1.10, 'Balenciaga': 1.10,
  'Versace': 1.10, 'Armani': 1.10, 'Burberry': 1.10, 'Off-White': 1.10,
  // Premium fashion +5%
  'Ralph Lauren': 1.05, 'Calvin Klein': 1.05, 'Tommy Hilfiger': 1.05,
  'Hugo Boss': 1.05, 'Lacoste': 1.05, 'Diesel': 1.05, 'Patagonia': 1.05,
  'The North Face': 1.05, 'Dr. Martens': 1.05, 'Birkenstock': 1.05,
  // Fast fashion -10%
  'SHEIN': 0.90, 'Primark': 0.90, 'Bershka': 0.90, 'Pull&Bear': 0.90,
  'Stradivarius': 0.90,
};

const CATEGORY_BASE_PRICE: Partial<Record<Category, number>> = {
  'mens-shirts': 110, 'womens-shirts': 100,
  'mens-tops': 70, 'womens-tops': 70,
  'mens-pants': 140, 'womens-pants': 130,
  'womens-dresses': 150,
  'mens-shoes': 190, 'womens-shoes': 180,
  'mens-winter': 240, 'womens-winter': 230,
  'accessories': 90,
};

export function suggestPrice(brand: string | undefined, condition: Condition = 'good', category?: Category): number | undefined {
  const base: number = (brand ? BRAND_BASE_PRICE[brand] : 0) || (category ? CATEGORY_BASE_PRICE[category] : 0) || 0;
  if (!base) return undefined;
  const tierMult  = brand ? (BRAND_TIER_MULT[brand] ?? 1.0) : 1.0;
  const sportMult = brand && SPORT_BRANDS.has(brand) ? 0.80 : 1.0;
  const price = Math.round(base * CONDITION_MULT[condition] * tierMult * sportMult);
  return Math.max(20, Math.round(price / 5) * 5);
}

// ── Category keywords ──────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: [string[], Category][] = [
  [['leggings', 'skirt'], 'womens-pants'],
  [['jeans', 'pants', 'trousers', 'chinos', 'shorts', 'jogger', 'denim', 'sweatpants'], 'mens-pants'],
  [['shirt', 't-shirt', 'tshirt', 'polo', 'jacket', 'hoodie', 'sweatshirt', 'sweater', 'coat', 'blazer', 'cardigan', 'jersey', 'vest'], 'mens-shirts'],
  [['tank top', 'singlet', 'muscle'], 'mens-tops'],
  [['dress', 'gown', 'romper', 'jumpsuit'], 'womens-dresses'],
  [['blouse', 'camisole', 'crop top', 'crop'], 'womens-tops'],
  [['heels', 'pump', 'stiletto', 'wedge', 'ballet flat', 'sandal'], 'womens-shoes'],
  [['shoes', 'sneakers', 'boots', 'loafers', 'trainers', 'footwear', 'slippers', 'flip flop'], 'mens-shoes'],
  [['bag', 'purse', 'handbag', 'backpack', 'necklace', 'bracelet', 'watch', 'belt', 'scarf', 'hat', 'cap', 'socks', 'gloves', 'sunglasses'], 'accessories'],
];

const CONDITION_KEYWORDS: [string[], Condition][] = [
  [['new with tag', 'brand new', 'with tags', 'bnwt', 'still tagged'], 'new-with-tag'],
  [['new without tag', 'unworn', 'never worn', 'nwot'], 'new-without-tag'],
  [['excellent', 'like new', 'mint', 'perfect condition', 'looks new'], 'perfect'],
  [['good condition', 'gently used', 'light wear', 'lightly used', 'lightly worn', 'clean', 'new'], 'good'],
  [['fair', 'some wear', 'visible wear', 'worn out', 'worn', 'heavily worn', 'heavy wear', 'used'], 'fair'],
];

// ── Text parser ────────────────────────────────────────────────────────────────

function parseBrand(text: string): string | undefined {
  const lower = text.toLowerCase();
  // Sort longer names first to avoid partial matches ('tommy' before 'tommy hilfiger')
  const sorted = [...BRANDS].sort((a, b) => b[0].length - a[0].length);
  for (const [pattern, canonical] of sorted) {
    if (lower.includes(pattern)) return canonical;
  }
  return undefined;
}

function parseColor(text: string): string | undefined {
  const lower = text.toLowerCase();
  // Longer entries first (e.g. 'dark blue' before 'blue')
  const sorted = [...COLOR_MAP].sort((a, b) => b[0].length - a[0].length);
  for (const [en, he] of sorted) {
    if (lower.includes(en)) return he;
  }
  return undefined;
}

function parseCategory(text: string): Category | undefined {
  const lower = text.toLowerCase();
  for (const [keywords, cat] of CATEGORY_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) return cat;
  }
  return undefined;
}

function parseCondition(text: string): Condition | undefined {
  const lower = text.toLowerCase();
  for (const [keywords, cond] of CONDITION_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) return cond;
  }
  return undefined;
}

// ── Result type ────────────────────────────────────────────────────────────────

export type RecognitionResult = {
  caption: string;
  name?: string;
  brand?: string;
  color?: string;
  category?: Category;
  condition?: Condition;
  price?: number;
  confidence: {
    name: number;
    brand: number;
    category: number;
    condition: number;
    color: number;
  };
};

// Category → construct state (סמיכות) + grammatical gender (m/f)
const CATEGORY_CONSTRUCT: Partial<Record<Category, { construct: string; gender: 'f' | 'm' | 'p' }>> = {
  'mens-shirts':    { construct: 'חולצת',   gender: 'f' },
  'womens-shirts':  { construct: 'חולצת',   gender: 'f' },
  'mens-tops':      { construct: 'גופיית',  gender: 'f' },
  'womens-tops':    { construct: 'גופיית',  gender: 'f' },
  'mens-pants':     { construct: 'מכנסי',   gender: 'p' },
  'womens-pants':   { construct: 'מכנסי',   gender: 'p' },
  'womens-dresses': { construct: 'שמלת',    gender: 'f' },
  'mens-shoes':     { construct: 'נעלי',    gender: 'p' },
  'womens-shoes':   { construct: 'נעלי',    gender: 'p' },
  'mens-winter':    { construct: 'פריט חורף', gender: 'm' },
  'womens-winter':  { construct: 'פריט חורף', gender: 'm' },
  'accessories':    { construct: 'אביזר של', gender: 'm' },
};

// Color → feminine form (used when category is feminine)
const COLOR_FEMININE: Record<string, string> = {
  'לבן': 'לבנה', 'שחור': 'שחורה', 'אפור': 'אפורה', 'כחול': 'כחולה',
  'כחול כהה': 'כחולה כהה', 'כחול בהיר': 'כחולה בהירה',
  'אדום': 'אדומה', 'ירוק': 'ירוקה', 'ירוק כהה': 'ירוקה כהה',
  'חום': 'חומה', 'חום כהה': 'חומה כהה', 'חום בהיר': 'חומה בהירה',
  'ורוד': 'ורודה', 'ורוד בהיר': 'ורודה בהירה', 'ורוד חם': 'ורודה חמה',
  'צהוב': 'צהובה', 'כתום': 'כתומה', 'סגול': 'סגולה',
  'צבעוני': 'צבעונית',
  // Invariable (foreign/borrowed words stay the same)
  'נייבי': 'נייבי', "בז'": "בז'", 'קרם': 'קרם', 'בורדו': 'בורדו',
  'טורקיז': 'טורקיז', 'זית': 'זית', 'חאקי': 'חאקי',
  'כסף': 'כסף', 'זהב': 'זהב', 'ניאון': 'ניאון', 'מנטה': 'מנטה',
  'לבנדר': 'לבנדר', 'קורל': 'קורל',
};

function genderedColor(color: string, gender: 'f' | 'm' | 'p'): string {
  if (gender === 'f') return COLOR_FEMININE[color] ?? color;
  return color; // masculine/plural — use base form
}

function buildResult(caption: string, brand?: string, color?: string, category?: Category, condition?: Condition, aiPrice?: number): RecognitionResult {
  const catInfo = category ? CATEGORY_CONSTRUCT[category] : undefined;
  const name = catInfo
    ? `${catInfo.construct}${brand ? ' ' + brand : ''}${color ? ' ' + genderedColor(color, catInfo.gender) : ''}`
    : undefined;
  const price = aiPrice ?? suggestPrice(brand, condition ?? 'good', category);

  return {
    caption,
    name,
    brand,
    color,
    category,
    condition,
    price,
    confidence: {
      name:      name      ? 0.80 : 0,
      brand:     brand     ? 0.88 : 0,
      category:  category  ? 0.93 : 0,
      condition: condition ? 0.76 : 0,
      color:     color     ? 0.85 : 0,
    },
  };
}

// ── Blob → base64 ──────────────────────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ── Hugging Face API calls ─────────────────────────────────────────────────────

function hfHeaders(): Record<string, string> {
  return HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {};
}

async function callCaption(blob: Blob): Promise<string> {
  const res = await fetch(
    `https://api-inference.huggingface.co/models/${CAPTION_MODEL}`,
    { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', ...hfHeaders() }, body: blob }
  );
  if (!res.ok) return '';
  const data = await res.json() as { generated_text?: string }[];
  return data[0]?.generated_text ?? '';
}

async function callOCR(blob: Blob): Promise<string> {
  if (!HF_TOKEN) return '';
  const res = await fetch(
    'https://api-inference.huggingface.co/models/microsoft/trocr-base-printed',
    { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', ...hfHeaders() }, body: blob }
  );
  if (!res.ok) return '';
  const data = await res.json() as { generated_text?: string }[];
  return data[0]?.generated_text ?? '';
}

async function callVQA(base64: string, question: string): Promise<string> {
  const res = await fetch(
    `https://api-inference.huggingface.co/models/${VQA_MODEL}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...hfHeaders() },
      body: JSON.stringify({ inputs: { question, image: base64 } }),
    }
  );
  if (!res.ok) return '';
  const data = await res.json() as { answer?: string }[];
  return data[0]?.answer ?? '';
}

// English labels for category hints in VQA prompts
const CATEGORY_EN: Partial<Record<Category, string>> = {
  'mens-pants':     "men's pants or jeans",
  'mens-shirts':    "men's shirt, t-shirt, polo, or jacket",
  'mens-tops':      "men's tank top or muscle shirt",
  'mens-shoes':     "men's shoes or sneakers",
  'womens-pants':   "women's pants, jeans, or leggings",
  'womens-dresses': 'dress or skirt',
  'womens-shirts':  "women's shirt, t-shirt, or jacket",
  'womens-tops':    "women's top, camisole, or crop top",
  'womens-shoes':   "women's shoes, heels, or sandals",
  'mens-winter':    "men's winter clothing — coat, puffer jacket, hoodie, sweater, or fleece",
  'womens-winter':  "women's winter clothing — coat, puffer jacket, hoodie, sweater, or fleece",
  'accessories':    'accessory',
};

export type RecognitionHint = {
  category?: Category;
  gender?: string;
  sellerBrand?: string;
  sellerCondition?: Condition;
  sellerCut?: string;
  sellerSize?: string;
};

// ── Gemini Vision ──────────────────────────────────────────────────────────────

const VALID_CATEGORIES: Category[] = [
  'mens-pants', 'mens-shirts', 'mens-tops', 'mens-shoes',
  'womens-pants', 'womens-dresses', 'womens-shirts', 'womens-tops', 'womens-shoes',
  'mens-winter', 'womens-winter',
  'accessories',
];
const VALID_CONDITIONS: Condition[] = [
  'new-with-tag', 'new-without-tag', 'perfect', 'good', 'fair', 'for-parts',
];

async function callGeminiVision(base64: string, mimeType: string, prompt: string): Promise<string> {
  // AQ. keys are OAuth tokens → use Bearer auth; AIza keys are API keys → use ?key=
  // AQ. keys = OAuth tokens (Bearer); AIza keys = static API keys (?key=)
  const isOAuth = GEMINI_KEY.startsWith('AQ.');
  const url = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent${isOAuth ? '' : `?key=${GEMINI_KEY}`}`;
  const authHeader: Record<string, string> = isOAuth
    ? { Authorization: `Bearer ${GEMINI_KEY}` }
    : {};

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({
      contents: [{ parts: [
        { inline_data: { mime_type: mimeType, data: base64 } },
        { text: prompt },
      ]}],
      generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { code?: number; message?: string } };
    console.error('[Gemini]', res.status, err?.error?.message?.slice(0, 100));
    return '';
  }
  const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function recognizeWithGemini(
  blob: Blob, base64: string, hint?: RecognitionHint
): Promise<RecognitionResult | null> {
  const mimeType = blob.type || 'image/jpeg';
  const categoryHint = hint?.category
    ? `The user said this is: ${CATEGORY_EN[hint.category] ?? hint.category}.`
    : '';
  const sellerHints = [
    hint?.sellerBrand     ? `Brand (seller says): ${hint.sellerBrand}`        : '',
    hint?.sellerCondition ? `Condition (seller says): ${hint.sellerCondition}` : '',
    hint?.sellerCut       ? `Cut/style (seller says): ${hint.sellerCut}`       : '',
    hint?.sellerSize      ? `Size (seller says): ${hint.sellerSize}`           : '',
  ].filter(Boolean).join('. ');

  const prompt = `Analyze this secondhand clothing image for a resale marketplace. ${categoryHint}
${sellerHints ? `Seller-provided details (use as strong hints): ${sellerHints}` : ''}

Read any visible text or logos carefully — brand names are often printed or embroidered on the item.

IMPORTANT category rules:
- SLEEVELESS tops (no sleeves at all) → "${hint?.gender === 'women' ? 'womens-tops' : 'mens-tops'}" — NEVER classify sleeveless as shirts
- Items WITH sleeves → mens-shirts or womens-shirts
- Two leg openings → mens-pants or womens-pants
- If the user indicated a category, strongly prefer it UNLESS the item is clearly sleeveless.

Return ONLY a JSON object (no markdown, no explanation):
{
  "brand": "brand name if ANY text/logo is visible — e.g. Rip Curl, Nike, Adidas, Zara, H&M, Levi's, Champion. null if truly invisible",
  "color": "main color in Hebrew, choose closest: שחור, לבן, אפור, כחול, נייבי, כחול בהיר, אדום, ירוק, זית, חום, ורוד, צהוב, כתום, סגול, בז', קרם, בורדו, טורקיז, כסף, זהב, צבעוני, חאקי",
  "category": "exactly one of: mens-pants, mens-shirts, mens-tops, mens-shoes, womens-pants, womens-dresses, womens-shirts, womens-tops, womens-shoes, mens-winter, womens-winter, accessories",
  "condition": "exactly one of: new-with-tag, new-without-tag, perfect, good, fair, for-parts — based on visible wear, fading, stains, tags",
  "caption": "one sentence describing the item in English"
}`;

  const text = await callGeminiVision(base64, mimeType, prompt);
  if (!text) return null;

  try {
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) return null;
    const g = JSON.parse(match[0]) as {
      brand?: string | null;
      color?: string | null;
      category?: string | null;
      condition?: string | null;
      caption?: string | null;
    };

    const brand     = g.brand     ? parseBrand(g.brand) ?? g.brand          : undefined;
    const color     = g.color     ?? undefined;
    const category  = VALID_CATEGORIES.includes(g.category as Category)
                        ? (g.category as Category)
                        : hint?.category;
    const condition = VALID_CONDITIONS.includes(g.condition as Condition)
                        ? (g.condition as Condition)
                        : undefined;
    const caption   = g.caption ?? '';

    return buildResult(caption, brand, color, category, condition);
  } catch {
    return null;
  }
}

export function isGeminiConfigured(): boolean { return GEMINI_KEY !== ''; }

// ── OpenAI GPT-4o-mini Vision ──────────────────────────────────────────────────

async function callOpenAIVision(base64: string, mimeType: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' } },
        { type: 'text', text: prompt },
      ]}],
      max_tokens: 400,
      temperature: 0.1,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { code?: string; message?: string } };
    console.error('[OpenAI]', res.status, err?.error?.message?.slice(0, 120));
    return '';
  }
  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? '';
  console.log('[OpenAI] raw response:', content.slice(0, 200));
  return content;
}

async function recognizeWithOpenAI(
  blob: Blob, base64: string, hint?: RecognitionHint
): Promise<RecognitionResult | null> {
  const mimeType = blob.type || 'image/jpeg';
  const categoryHint = hint?.category
    ? `The user indicated this is: ${CATEGORY_EN[hint.category] ?? hint.category}.`
    : '';
  const sellerHints = [
    hint?.sellerBrand     ? `Brand (seller says): ${hint.sellerBrand}`        : '',
    hint?.sellerCondition ? `Condition (seller says): ${hint.sellerCondition}` : '',
    hint?.sellerCut       ? `Cut/style (seller says): ${hint.sellerCut}`       : '',
    hint?.sellerSize      ? `Size (seller says): ${hint.sellerSize}`           : '',
  ].filter(Boolean).join('. ');

  const prompt = `You are analyzing a secondhand clothing photo for a resale marketplace app in Israel. ${categoryHint}
${sellerHints ? `\nSeller-provided details (use these as strong hints, but verify with image): ${sellerHints}` : ''}

Look carefully — read ANY text or logo visible on the clothing to identify the brand.

IMPORTANT category rules:
- "mens-tops" or "womens-tops": SLEEVELESS items — tank tops, muscle shirts, singlets, camisoles, undershirts. NO SLEEVES AT ALL = tops. Use mens-tops for men, womens-tops for women.${hint?.gender ? ` This seller is selling for ${hint.gender === 'women' ? 'women → use womens-tops for sleeveless' : 'men → use mens-tops for sleeveless'}.` : ''}
- "mens-shirts" or "womens-shirts": items WITH sleeves — t-shirts, polos, button-downs, sweatshirts. MUST have visible sleeves.
- "mens-winter" or "womens-winter": heavy coats, puffer jackets, parkas, thick hoodies, fleece — bulky outerwear
- "mens-pants" or "womens-pants": jeans, trousers, shorts, leggings — garments for the LEGS with two leg openings
- NEVER classify a SLEEVELESS item as mens-shirts or womens-shirts
- If the user indicated a category, prefer it ONLY if image confirms it

Return ONLY valid JSON (no markdown):
{
  "brand": "brand name if ANY text/logo is visible (e.g. Rip Curl, Nike, Zara, H&M, Adidas, Levi's, Champion) — null if truly invisible",
  "color": "main color in Hebrew, pick closest: שחור, לבן, אפור, כחול, נייבי, כחול בהיר, אדום, ירוק, זית, חום, ורוד, צהוב, כתום, סגול, בז', קרם, בורדו, טורקיז, זהב, כסף, צבעוני, חאקי",
  "category": "one of: mens-pants, mens-shirts, mens-tops, mens-shoes, womens-pants, womens-dresses, womens-shirts, womens-tops, womens-shoes, mens-winter, womens-winter, accessories",
  "condition": "one of: new-with-tag, new-without-tag, perfect, good, fair, for-parts — judge by visible wear, fading, stains, tags",
  "caption": "one sentence describing the item in English",
  "suggestedPrice": a fair secondhand resale price in Israeli shekels (NIS) as a number. Base it on: typical retail price for this brand × condition discount (new-with-tag=85%, new-without-tag=70%, perfect=55%, good=40%, fair=25%). Reference retail prices: Nike/Adidas shirt ≈ 200-300 NIS, Zara ≈ 150-250 NIS, H&M ≈ 80-150 NIS, Rip Curl/Billabong ≈ 200-350 NIS, luxury brands ≈ 800-3000 NIS. Return null if uncertain.
}`;

  const text = await callOpenAIVision(base64, mimeType, prompt);
  if (!text) return null;

  try {
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) return null;
    const g = JSON.parse(match[0]) as {
      brand?: string | null;
      color?: string | null;
      category?: string | null;
      condition?: string | null;
      caption?: string | null;
      suggestedPrice?: number | null;
    };

    const clean = (v: string | null | undefined) =>
      v && v.toLowerCase() !== 'null' && v.toLowerCase() !== 'none' && v.trim() !== '' ? v : undefined;

    const brand     = clean(g.brand) ? parseBrand(clean(g.brand)!) ?? clean(g.brand) : undefined;
    const color     = clean(g.color);
    const category  = VALID_CATEGORIES.includes(g.category as Category)
                        ? (g.category as Category) : hint?.category;
    const condition = VALID_CONDITIONS.includes(g.condition as Condition)
                        ? (g.condition as Condition) : undefined;
    const aiPrice   = typeof g.suggestedPrice === 'number' && g.suggestedPrice > 0
                        ? Math.round(g.suggestedPrice / 5) * 5
                        : undefined;

    return buildResult(clean(g.caption) ?? '', brand, color, category, condition, aiPrice);
  } catch {
    return null;
  }
}

export function isOpenAIConfigured(): boolean { return OPENAI_KEY !== ''; }

// ── Main export ────────────────────────────────────────────────────────────────

export async function recognizeFromUrl(
  imageUrl: string,
  hint?: RecognitionHint,
): Promise<RecognitionResult | null> {
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const blob = await imgRes.blob();
    const base64 = await blobToBase64(blob);

    // ── OpenAI path (best quality — reads text/logos accurately) ─────────────────
    if (OPENAI_KEY) {
      console.log('[AI] trying OpenAI, key length:', OPENAI_KEY.length);
      const result = await recognizeWithOpenAI(blob, base64, hint);
      if (result) { console.log('[AI] OpenAI succeeded, category:', result.category, 'color:', result.color); return result; }
      console.warn('[AI] OpenAI returned null — falling back to Gemini');
    }

    // ── Gemini path (fallback if no OpenAI key) ────────────────────────────────
    if (GEMINI_KEY) {
      console.log('[AI] trying Gemini');
      const result = await recognizeWithGemini(blob, base64, hint);
      if (result) { console.log('[AI] Gemini succeeded, category:', result.category, 'color:', result.color); return result; }
      console.warn('[AI] Gemini returned null — falling back to BLIP');
    }

    // ── BLIP fallback (no vision AI key configured) ────────────────────────────
    const itemDesc = hint?.category ? CATEGORY_EN[hint.category] ?? 'clothing item' : 'clothing item';
    const brandQ1 = `What clothing brand is shown on this ${itemDesc}? For example: Nike, Adidas, Zara, H&M, Levi's, Puma, Ralph Lauren.`;
    const brandQ2 = `Is there a brand logo or label visible? What brand is it?`;

    const [caption, brandAnswer1, brandAnswer2, typeAnswer, colorAnswer, conditionAnswer, ocrText] = await Promise.all([
      callCaption(blob),
      callVQA(base64, brandQ1),
      callVQA(base64, brandQ2),
      hint?.category ? Promise.resolve('') : callVQA(base64, 'What type of clothing item is this?'),
      callVQA(base64, 'What is the main color of this clothing item?'),
      callVQA(base64, 'Does this clothing look new, gently used, or worn out?'),
      callOCR(blob),
    ]);

    if (!caption && !brandAnswer1 && !typeAnswer && !colorAnswer) return null;

    const allText = [caption, brandAnswer1, brandAnswer2, typeAnswer].join(' ');

    // Brand: OCR reads printed text directly → best for "RIP CURL", "NIKE" etc. on garments
    const brand = parseBrand(ocrText) ?? parseBrand(brandAnswer1) ?? parseBrand(brandAnswer2) ?? parseBrand(caption);
    // Color: direct VQA answer first, then caption
    const color = parseColor(colorAnswer) ?? parseColor(caption);
    // Use pre-selected category from classify screen if available
    const category = hint?.category ?? parseCategory(typeAnswer) ?? parseCategory(allText);
    // Condition: direct VQA answer first, then caption
    const condition = parseCondition(conditionAnswer) ?? parseCondition(caption);

    return buildResult(caption || allText, brand, color, category, condition);
  } catch {
    return null;
  }
}

export function isHFConfigured(): boolean {
  return HF_TOKEN !== '';
}

// ── Image quality gate ─────────────────────────────────────────────────────────

export type QualityResult = {
  isGood: boolean;
  reason?: string;
};

export async function checkImageQuality(imageUri: string): Promise<QualityResult> {
  if (!OPENAI_KEY && !HF_TOKEN) return { isGood: true };

  try {
    const imgRes = await fetch(imageUri);
    if (!imgRes.ok) return { isGood: true };
    const blob = await imgRes.blob();
    const base64 = await blobToBase64(blob);

    // ── OpenAI quality check (accurate, understands context) ──────────────────
    if (OPENAI_KEY) {
      const prompt = `You are reviewing a photo submitted to a secondhand clothing marketplace.

Return ONLY valid JSON:
{
  "isGood": true or false,
  "reason": "reason in Hebrew if not good, null if good"
}

Reject (isGood: false) if ANY of these:
- No clothing item visible (e.g. just a room, face, food, random object)
- Clothing is cut off / not fully visible
- Photo is very blurry or too dark to see details
- Extreme close-up showing only a small detail (logo, button, seam)

Accept (isGood: true) if:
- A clothing item is clearly visible and reasonably complete
- Good enough lighting to see the item`;

      const text = await callOpenAIVision(base64, blob.type || 'image/jpeg', prompt);
      if (text) {
        try {
          const match = text.match(/\{[\s\S]*?\}/);
          if (match) {
            const r = JSON.parse(match[0]) as { isGood?: boolean; reason?: string | null };
            if (r.isGood === false) return { isGood: false, reason: r.reason ?? 'התמונה לא מתאימה לפרסום' };
            if (r.isGood === true)  return { isGood: true };
          }
        } catch { /* fall through */ }
      }
    }

    // ── BLIP fallback quality check ────────────────────────────────────────────
    const [caption, fullVisibleAnswer, suitableAnswer] = await Promise.all([
      callCaption(blob),
      callVQA(base64, 'Can you see the entire clothing item completely from top to bottom without anything being cut off?'),
      callVQA(base64, 'Is this photo well-lit and clear enough to use as an online store product photo?'),
    ]);

    const CLOTHING_WORDS = [
      'shirt', 'pants', 'dress', 'jacket', 'jeans', 'coat', 'top', 'skirt',
      'sweater', 'hoodie', 'shorts', 'boots', 'sneakers', 'shoes', 'blouse',
      'suit', 'vest', 'cardigan', 'trousers', 'leggings', 'sock', 'hat',
    ];
    const captionHasClothing = CLOTHING_WORDS.some(w => caption.toLowerCase().includes(w));
    const fullVisible = fullVisibleAnswer.toLowerCase().startsWith('yes');
    const suitable    = suitableAnswer.toLowerCase().startsWith('yes');

    if (!captionHasClothing) return { isGood: false, reason: 'לא זוהה פריט לבוש בתמונה — הנח את הבגד במרכז הפריים וצלם מחדש' };
    if (!fullVisible)        return { isGood: false, reason: 'הפריט לא נראה במלואו — צלם את הבגד השלם כולל החלק העליון והתחתון' };
    if (!suitable)           return { isGood: false, reason: 'התמונה לא מתאימה לפרסום — נסה עם תאורה טובה יותר ורקע נקי' };
    return { isGood: true };
  } catch {
    return { isGood: true };
  }
}

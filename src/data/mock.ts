export type Category =
  | 'mens-pants'
  | 'mens-shirts'
  | 'mens-tops'
  | 'mens-shoes'
  | 'mens-winter'
  | 'womens-pants'
  | 'womens-dresses'
  | 'womens-shirts'
  | 'womens-tops'
  | 'womens-shoes'
  | 'womens-winter'
  | 'accessories';

export type SubCategory = {
  key: string;
  label: string;
  emoji: string;
  parentCategory: Category;
};

export const WINTER_MENS_SUBS: SubCategory[] = [
  { key: 'sweater',    label: "סווצ'ר",             emoji: '🥼', parentCategory: 'mens-winter' },
  { key: 'winterpant', label: 'מכנס חורף',          emoji: '👖', parentCategory: 'mens-winter' },
  { key: 'coat',       label: "מעיל / ג'קט חורף",  emoji: '🧥', parentCategory: 'mens-winter' },
  { key: 'scarf',      label: 'צעיפים / כובעים',   emoji: '🧣', parentCategory: 'mens-winter' },
  { key: 'socks',      label: 'גרביים',              emoji: '🧦', parentCategory: 'mens-winter' },
  { key: 'gloves',     label: 'כפפות',               emoji: '🧤', parentCategory: 'mens-winter' },
];

export const WINTER_WOMENS_SUBS: SubCategory[] = [
  { key: 'sweater',    label: "סווצ'ר",             emoji: '🥼', parentCategory: 'womens-winter' },
  { key: 'winterpant', label: 'מכנס חורף',          emoji: '👖', parentCategory: 'womens-winter' },
  { key: 'coat',       label: "מעיל / ג'קט חורף",  emoji: '🧥', parentCategory: 'womens-winter' },
  { key: 'scarf',      label: 'צעיפים / כובעים',   emoji: '🧣', parentCategory: 'womens-winter' },
  { key: 'socks',      label: 'גרביים',              emoji: '🧦', parentCategory: 'womens-winter' },
  { key: 'gloves',     label: 'כפפות',               emoji: '🧤', parentCategory: 'womens-winter' },
];

export const ACCESSORIES_SUBS: SubCategory[] = [
  { key: 'jewelry',    label: 'תכשיטים',       emoji: '💍', parentCategory: 'accessories' },
  { key: 'bags',       label: 'תיקים',          emoji: '👜', parentCategory: 'accessories' },
  { key: 'books',      label: 'ספרים',          emoji: '📚', parentCategory: 'accessories' },
  { key: 'boardgames', label: 'משחקי קופסא',   emoji: '🎲', parentCategory: 'accessories' },
  { key: 'sunglasses', label: 'משקפי שמש',     emoji: '🕶️', parentCategory: 'accessories' },
  { key: 'watches',    label: 'שעונים',         emoji: '⌚', parentCategory: 'accessories' },
  { key: 'hats',       label: 'כובעים',         emoji: '🎩', parentCategory: 'accessories' },
  { key: 'belts',      label: 'חגורות',         emoji: '👔', parentCategory: 'accessories' },
];

export type Condition =
  | 'new-with-tag'
  | 'new-without-tag'
  | 'perfect'
  | 'good'
  | 'fair'
  | 'for-parts';

export type ClothingItem = {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerRating?: number;
  name: string;
  brand: string;
  category: Category;
  price: number;
  size: string;
  condition: Condition;
  color?: string;
  description: string;
  imageUrl: string;
  location: string;
  distance: number;
};

export type InterestRequest = {
  id: string;
  itemId: string;
  itemName: string;
  itemImage: string;
  itemPrice?: number;
  buyerName: string;
  status: 'pending' | 'accepted' | 'declined' | 'on_hold';
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  text: string;
  from: 'buyer' | 'seller';
  timestamp: string;
  date?: string; // 'YYYY-MM-DD'
};

export type Chat = {
  id: string;
  itemId: string;
  itemName: string;
  itemImage: string;
  itemPrice?: number;
  otherPartyName: string;
  messages: ChatMessage[];
  isClosed?: boolean;
  isSeller?: boolean;
  sellerMarkedSold?: boolean;
};

export type Rating = {
  id: string;
  chatId: string;
  score: number;
  review: string;
  role: 'buyer' | 'seller';
  createdAt: string;
};

export type AiConfidence = {
  name: number;
  brand: number;
  category: number;
  condition: number;
  color: number;
};

export type AiDraft = {
  imageUri: string;
  // AI fields — only populated when confidence >= 0.70
  name?: string;
  brand?: string;
  category?: Category;
  condition?: Condition;
  color?: string;
  description?: string;
  confidence?: AiConfidence;
  // User-filled (appended in complete.tsx before preview)
  price?: number;
  size?: string;
  location?: string;
};

// ─── Category metadata ────────────────────────────────────────────────────────

// Order matters: pairs render as (even index = right/men, odd index = left/women) with row-reverse
export const CATEGORY_INFO: Record<Category, { label: string; emoji: string }> = {
  'mens-pants':     { label: 'מכנסי גברים',       emoji: '👖' },
  'womens-pants':   { label: 'מכנסי נשים',        emoji: '🩳' },
  'mens-shirts':    { label: 'חולצות גברים',      emoji: '👔' },
  'womens-shirts':  { label: 'חולצות נשים',       emoji: '👚' },
  'mens-tops':      { label: 'גופיות גברים',      emoji: '🎽' },
  'womens-tops':    { label: 'גופיות נשים',       emoji: '🩱' },
  'mens-shoes':     { label: 'נעלי גברים',        emoji: '👟' },
  'womens-shoes':   { label: 'נעלי נשים',         emoji: '👠' },
  'mens-winter':    { label: 'ביגוד חורף גברים',  emoji: '🧥' },
  'womens-winter':  { label: 'ביגוד חורף נשים',   emoji: '🧣' },
  'accessories':    { label: 'אביזרים',            emoji: '👜' },
  'womens-dresses': { label: 'שמלות נשים',        emoji: '👗' },
};

export const CATEGORIES = Object.entries(CATEGORY_INFO).map(([id, info]) => ({
  id: id as Category,
  ...info,
}));

// ─── Condition metadata ───────────────────────────────────────────────────────

export const CONDITIONS: { value: Condition; label: string; color: string }[] = [
  { value: 'new-with-tag',    label: 'חדש עם תווית',      color: '#059669' },
  { value: 'new-without-tag', label: 'חדש ללא תווית',     color: '#10B981' },
  { value: 'perfect',         label: 'מצב מושלם',         color: '#6366F1' },
  { value: 'good',            label: 'מצב טוב',           color: '#3B82F6' },
  { value: 'fair',            label: 'מצב סביר',          color: '#F59E0B' },
  { value: 'for-parts',       label: 'למכירה כחלקים',     color: '#9CA3AF' },
];

export const CONDITION_LABELS: Record<Condition, string> = Object.fromEntries(
  CONDITIONS.map(c => [c.value, c.label])
) as Record<Condition, string>;

export const CONDITION_COLORS: Record<Condition, string> = Object.fromEntries(
  CONDITIONS.map(c => [c.value, c.color])
) as Record<Condition, string>;

// ─── Sizes ────────────────────────────────────────────────────────────────────

export const ALL_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '37', '38', '39', '40', '41', '42', '43', '44'];

// ─── Map helpers ──────────────────────────────────────────────────────────────

const CENTER_LAT = 32.0853; // Tel Aviv
const CENTER_LNG = 34.7818;

export function itemCoordinates(distance: number, seed: number) {
  const angle = ((seed * 137.508) % 360) * (Math.PI / 180);
  const latDelta = (distance / 111) * Math.sin(angle);
  const lngDelta = (distance / (111 * Math.cos(CENTER_LAT * Math.PI / 180))) * Math.cos(angle);
  return {
    latitude:  CENTER_LAT + latDelta,
    longitude: CENTER_LNG + lngDelta,
  };
}

// ─── Mock items ───────────────────────────────────────────────────────────────

export const MOCK_ITEMS: ClothingItem[] = [
  // מכנסי נשים
  { id: 'wp1', sellerId: 's20', sellerName: 'שני א.',   sellerRating: 4.6, name: 'לגינס שחור',                  brand: 'Nike',          category: 'womens-pants',   price: 90,  size: 'S',     condition: 'good',            color: 'שחור',   description: 'לגינס ספורטיבי, כמעט חדש.',               imageUrl: 'https://picsum.photos/seed/wp1/400/600', location: 'תל אביב',    distance: 1.0 },
  { id: 'wp2', sellerId: 's21', sellerName: 'רועי מ.',   sellerRating: 4.4, name: "ג'ינס סקיני כחול",            brand: 'Zara',          category: 'womens-pants',   price: 110, size: 'M',     condition: 'perfect',         color: 'כחול',   description: "ג'ינס צמוד, מצב מצוין.",                  imageUrl: 'https://picsum.photos/seed/wp2/400/600', location: 'גבעתיים',    distance: 2.8 },
  // גופיות גברים
  { id: 'mt1', sellerId: 's22', sellerName: 'דור כ.',    sellerRating: 4.3, name: 'גופיית ספורט שחורה',           brand: 'Nike',          category: 'mens-tops',      price: 65,  size: 'L',     condition: 'good',            color: 'שחור',   description: 'גופיית ריצה קלה, שימוש מועט.',            imageUrl: 'https://picsum.photos/seed/mt1/400/600', location: 'פתח תקווה', distance: 4.5 },
  { id: 'mt2', sellerId: 's23', sellerName: 'בר ל.',     sellerRating: 4.7, name: 'גופיית כותנה לבנה',            brand: 'H&M',           category: 'mens-tops',      price: 40,  size: 'M',     condition: 'new-without-tag', color: 'לבן',    description: 'גופיית בסיסית, מעולם לא נלבשה.',          imageUrl: 'https://picsum.photos/seed/mt2/400/600', location: 'הרצליה',     distance: 3.7 },
  // מכנסי גברים
  { id: 'm1',  sellerId: 's1',  sellerName: 'דנה כ.',    sellerRating: 4.8, name: "ג'ינס ישר כחול",          brand: "Levi's",        category: 'mens-pants',     price: 180, size: '32',    condition: 'good',            color: 'כחול',     description: "ג'ינס ישר קלאסי, שימוש מועט.",          imageUrl: 'https://picsum.photos/seed/mp1/400/600', location: 'תל אביב',     distance: 1.2 },
  { id: 'm2',  sellerId: 's2',  sellerName: 'אורן מ.',   sellerRating: 4.5, name: "מכנסי ג'וגר אפור",         brand: 'Nike',          category: 'mens-pants',     price: 120, size: '34',    condition: 'perfect',         color: 'אפור',     description: "מכנסי ג'וגר נוחים, פעם נלבשו.",          imageUrl: 'https://picsum.photos/seed/mp2/400/600', location: 'ירושלים',    distance: 3.5 },
  { id: 'm3',  sellerId: 's3',  sellerName: 'יוסי ב.',   sellerRating: 3.9, name: 'מכנסי קרגו ירוקים',        brand: 'Zara',          category: 'mens-pants',     price: 95,  size: '30',    condition: 'good',            color: 'ירוק',     description: 'קרגו טרנדי עם הרבה כיסים.',              imageUrl: 'https://picsum.photos/seed/mp3/400/600', location: 'חיפה',       distance: 2.1 },
  // חולצות גברים
  { id: 'ms1', sellerId: 's4',  sellerName: 'גיל ל.',    sellerRating: 5.0, name: 'חולצת פולו לבנה',          brand: 'Ralph Lauren',  category: 'mens-shirts',    price: 140, size: 'M',     condition: 'new-without-tag', color: 'לבן',     description: 'חולצת פולו קלאסית, כמעט חדשה.',          imageUrl: 'https://picsum.photos/seed/ms1/400/600', location: 'רמת גן',     distance: 0.8 },
  { id: 'ms2', sellerId: 's5',  sellerName: 'אמיר ש.',   sellerRating: 4.2, name: 'חולצת פסים כחול-לבן',      brand: 'H&M',           category: 'mens-shirts',    price: 55,  size: 'L',     condition: 'good',            color: 'כחול-לבן', description: 'חולצת פסים קלאסית, קלה ונעימה.',         imageUrl: 'https://picsum.photos/seed/ms2/400/600', location: 'הרצליה',     distance: 4.2 },
  { id: 'ms3', sellerId: 's6',  sellerName: 'תומר ר.',   sellerRating: 4.7, name: "ג'קט ג'ינס כחול כהה",     brand: 'Wrangler',      category: 'mens-shirts',    price: 220, size: 'XL',    condition: 'good',            color: 'כחול כהה', description: "ג'קט ג'ינס קלאסי, מתאים לכל הזדמנות.",  imageUrl: 'https://picsum.photos/seed/ms3/400/600', location: 'פתח תקווה', distance: 5.8 },
  // שמלות נשים
  { id: 'wd1', sellerId: 's7',  sellerName: 'מיכל ג.',   sellerRating: 4.9, name: 'שמלת מקסי שחורה',          brand: 'Mango',         category: 'womens-dresses', price: 180, size: 'S',     condition: 'perfect',         color: 'שחור',     description: 'שמלת מקסי אלגנטית, ללבוש פעם אחת.',      imageUrl: 'https://picsum.photos/seed/wd1/400/600', location: 'תל אביב',    distance: 1.5 },
  { id: 'wd2', sellerId: 's8',  sellerName: 'שיר כ.',    sellerRating: 4.3, name: 'שמלת פרחים קייצית',         brand: 'Zara',          category: 'womens-dresses', price: 95,  size: 'XS',    condition: 'good',            color: 'צבעוני',   description: 'שמלה עם הדפס פרחוני, מתאים לקיץ.',       imageUrl: 'https://picsum.photos/seed/wd2/400/600', location: 'גבעתיים',    distance: 2.3 },
  { id: 'wd3', sellerId: 's9',  sellerName: 'נועה א.',   sellerRating: 4.6, name: 'שמלת מעטפת בורדו',          brand: 'ASOS',          category: 'womens-dresses', price: 130, size: 'M',     condition: 'good',            color: 'בורדו',    description: 'שמלת מעטפת מחמיאה, צבע בורדו עשיר.',     imageUrl: 'https://picsum.photos/seed/wd3/400/600', location: 'רמת השרון',  distance: 6.1 },
  // חולצות נשים
  { id: 'ws1', sellerId: 's10', sellerName: 'לירון מ.',  sellerRating: 4.4, name: 'חולצה קשורה פרחונית',       brand: 'Pull&Bear',     category: 'womens-shirts',  price: 65,  size: 'S',     condition: 'new-without-tag', color: 'ורוד',     description: 'חולצה עם קשירה בקדמי, דוגמת פרחים.',     imageUrl: 'https://picsum.photos/seed/ws1/400/600', location: 'ראשון לציון', distance: 3.2 },
  { id: 'ws2', sellerId: 's11', sellerName: 'ענת פ.',    sellerRating: 4.8, name: 'חולצת משי שמפניה',           brand: 'Mango',         category: 'womens-shirts',  price: 155, size: 'M',     condition: 'perfect',         color: 'שמפניה',   description: 'חולצת משי אלגנטית, מתאימה למשרד ולפנאי.', imageUrl: 'https://picsum.photos/seed/ws2/400/600', location: 'תל אביב',    distance: 0.9 },
  // גופיות נשים
  { id: 'wt1', sellerId: 's12', sellerName: 'רותם ג.',   sellerRating: 3.8, name: 'גופיית בסיסית לבנה',        brand: 'Basic House',   category: 'womens-tops',    price: 35,  size: 'M',     condition: 'good',            color: 'לבן',      description: 'גופייה קלאסית ונוחה, מצב מצוין.',        imageUrl: 'https://picsum.photos/seed/wt1/400/600', location: 'חיפה',       distance: 1.8 },
  { id: 'wt2', sellerId: 's13', sellerName: 'הילה כ.',   sellerRating: 4.1, name: 'גופיית רצועות שחורה',        brand: 'H&M',           category: 'womens-tops',    price: 45,  size: 'S',     condition: 'new-without-tag', color: 'שחור',     description: 'גופיית רצועות בסיסית ואיכותית.',          imageUrl: 'https://picsum.photos/seed/wt2/400/600', location: 'נתניה',      distance: 7.4 },
  // נעליים
  // נעלי גברים
  { id: 'sh1', sellerId: 's14', sellerName: 'יואב מ.',   sellerRating: 4.7, name: 'סניקרס לבן Air Force',      brand: 'Nike',          category: 'mens-shoes',     price: 350, size: '42',    condition: 'good',            color: 'לבן',      description: 'נעליים לבנות, שימוש קל.',               imageUrl: 'https://picsum.photos/seed/sh1/400/600', location: 'תל אביב',    distance: 2.5 },
  { id: 'sh4', sellerId: 's19', sellerName: 'עידן ל.',   sellerRating: 4.3, name: "נעלי ספורט שחורות Adidas",  brand: 'Adidas',        category: 'mens-shoes',     price: 280, size: '44',    condition: 'perfect',         color: 'שחור',     description: 'נעלי ריצה, מצב מצוין.',                 imageUrl: 'https://picsum.photos/seed/sh4/400/600', location: 'תל אביב',    distance: 3.1 },
  // נעלי נשים
  { id: 'sh2', sellerId: 's15', sellerName: 'רינת ב.',   sellerRating: 5.0, name: "נעלי עקב בז'",             brand: 'Zara',          category: 'womens-shoes',   price: 180, size: '37',    condition: 'new-with-tag',    color: "בז'",      description: 'נעלי עקב אלגנטיות, לא נלבשו.',           imageUrl: 'https://picsum.photos/seed/sh2/400/600', location: 'כפר סבא',    distance: 9.1 },
  { id: 'sh3', sellerId: 's16', sellerName: 'גלית ר.',   sellerRating: 4.5, name: 'מגפיים שחורות',             brand: 'Dr. Martens',   category: 'womens-shoes',   price: 420, size: '39',    condition: 'good',            color: 'שחור',     description: 'מגפיים קלאסיות, נלבשו עונה אחת.',        imageUrl: 'https://picsum.photos/seed/sh3/400/600', location: 'ירושלים',    distance: 15.3 },
  // אביזרים
  { id: 'ac1', sellerId: 's17', sellerName: 'דבורה נ.',  sellerRating: 4.6, name: 'תיק עור שחור קטן',          brand: 'Guess',         category: 'accessories',    price: 280, size: 'אחיד',  condition: 'perfect',         color: 'שחור',     description: 'תיק עור קטן אלגנטי, ללא שריטות.',        imageUrl: 'https://picsum.photos/seed/ac1/400/600', location: 'רחובות',     distance: 4.7 },
  { id: 'ac2', sellerId: 's18', sellerName: 'אביגיל ר.', sellerRating: 4.9, name: 'שרשרת זהב עדינה',           brand: 'Tiffany & Co.', category: 'accessories',    price: 650, size: 'אחיד',  condition: 'new-with-tag',    color: 'זהב',      description: 'שרשרת זהב 14K, נקנתה ולא נלבשה.',        imageUrl: 'https://picsum.photos/seed/ac2/400/600', location: 'הרצליה',     distance: 8.2 },
];

// ─── AI simulation ────────────────────────────────────────────────────────────
// Only fields with confidence >= 0.70 are populated; lower = undefined (better blank than wrong)

export const AI_RESULTS_BY_CATEGORY: Record<Category, Omit<AiDraft, 'imageUri'>> = {
  'womens-pants': {
    name: "ג'ינס נשים",
    brand: undefined,
    category: 'womens-pants',
    condition: 'good',
    color: 'כחול',
    description: "ג'ינס לנשים, גזרה צמודה.",
    confidence: { name: 0.82, brand: 0.40, category: 0.94, condition: 0.71, color: 0.90 },
  },
  'mens-tops': {
    name: 'גופיית ספורט',
    brand: undefined,
    category: 'mens-tops',
    condition: 'good',
    color: 'שחור',
    description: 'גופיית ספורט לגברים.',
    confidence: { name: 0.80, brand: 0.38, category: 0.91, condition: 0.73, color: 0.92 },
  },
  'mens-pants': {
    name: "ג'ינס ישר כחול",
    brand: "Levi's",
    category: 'mens-pants',
    condition: 'good',
    color: 'כחול',
    description: "ג'ינס ישר קלאסי. גב ושיפה ניכרים, שמר על הצבע המקורי.",
    confidence: { name: 0.88, brand: 0.76, category: 0.95, condition: 0.72, color: 0.91 },
  },
  'mens-shirts': {
    name: 'חולצת T כותנה',
    brand: undefined,          // brand not confident enough — left blank
    category: 'mens-shirts',
    condition: 'good',
    color: 'שחור',
    description: 'חולצת T בצבע כהה, ללא שחיקה נראית לעין.',
    confidence: { name: 0.80, brand: 0.45, category: 0.93, condition: 0.68, color: 0.88 },
  },
  'womens-dresses': {
    name: 'שמלת מיני',
    brand: 'H&M',
    category: 'womens-dresses',
    condition: undefined,      // condition unclear from image — left blank
    color: 'פרחוני',
    description: 'שמלה עם הדפס עדין. מצב הפריט יש לפרט ידנית.',
    confidence: { name: 0.82, brand: 0.71, category: 0.97, condition: 0.52, color: 0.90 },
  },
  'womens-shirts': {
    name: 'חולצה',
    brand: 'Pull&Bear',
    category: 'womens-shirts',
    condition: 'new-without-tag',
    color: 'לבן',
    description: 'חולצה בהירה, נראית חדשה, ללא קמטים או כתמים.',
    confidence: { name: 0.74, brand: 0.78, category: 0.92, condition: 0.80, color: 0.93 },
  },
  'womens-tops': {
    name: 'גופייה',
    brand: undefined,
    category: 'womens-tops',
    condition: 'good',
    color: 'שחור',
    description: 'גופייה בצבע כהה, מידה בינונית לפי מראה.',
    confidence: { name: 0.77, brand: 0.38, category: 0.89, condition: 0.73, color: 0.94 },
  },
  'mens-shoes': {
    name: 'נעלי ספורט',
    brand: 'Nike',
    category: 'mens-shoes',
    condition: 'good',
    color: 'לבן',
    description: 'נעלי ספורט לגברים, שימוש מועט לפי בלאי הסוליה.',
    confidence: { name: 0.85, brand: 0.83, category: 0.98, condition: 0.75, color: 0.96 },
  },
  'womens-shoes': {
    name: 'נעלי עקב',
    brand: 'Zara',
    category: 'womens-shoes',
    condition: 'new-without-tag',
    color: 'שחור',
    description: 'נעלי עקב לנשים, מצב מצוין.',
    confidence: { name: 0.84, brand: 0.79, category: 0.97, condition: 0.78, color: 0.94 },
  },
  'accessories': {
    name: 'תיק עור',
    brand: undefined,
    category: 'accessories',
    condition: 'perfect',
    color: 'שחור',
    description: 'תיק עור קטן, ללא שריטות נראות, מצב מעולה.',
    confidence: { name: 0.79, brand: 0.42, category: 0.91, condition: 0.81, color: 0.95 },
  },
  'mens-winter': {
    name: "סווצ'ר / מעיל",
    brand: undefined,
    category: 'mens-winter',
    condition: 'good',
    color: 'אפור',
    description: 'פריט חורף לגברים.',
    confidence: { name: 0.78, brand: 0.40, category: 0.90, condition: 0.70, color: 0.85 },
  },
  'womens-winter': {
    name: "סווצ'ר / מעיל",
    brand: undefined,
    category: 'womens-winter',
    condition: 'good',
    color: 'שחור',
    description: 'פריט חורף לנשים.',
    confidence: { name: 0.78, brand: 0.40, category: 0.90, condition: 0.70, color: 0.85 },
  },
};

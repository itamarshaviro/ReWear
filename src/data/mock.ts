export type Category =
  | 'mens-pants'
  | 'mens-shirts'
  | 'womens-dresses'
  | 'womens-shirts'
  | 'womens-tops'
  | 'shoes'
  | 'accessories';

export type Condition = 'new' | 'like-new' | 'good' | 'fair';

export type ClothingItem = {
  id: string;
  sellerId: string;
  sellerName: string;
  name: string;
  brand: string;
  category: Category;
  price: number;
  size: string;
  condition: Condition;
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
  buyerName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  text: string;
  from: 'buyer' | 'seller';
  timestamp: string;
};

export type Chat = {
  id: string;
  itemId: string;
  itemName: string;
  itemImage: string;
  otherPartyName: string;
  messages: ChatMessage[];
};

export type AiDraft = {
  imageUri: string;
  name: string;
  brand: string;
  category: Category;
  condition: Condition;
  description: string;
};

export const CATEGORY_INFO: Record<Category, { label: string; emoji: string }> = {
  'mens-pants':      { label: 'מכנסי גברים',  emoji: '👖' },
  'mens-shirts':     { label: 'חולצות גברים', emoji: '👔' },
  'womens-dresses':  { label: 'שמלות נשים',   emoji: '👗' },
  'womens-shirts':   { label: 'חולצות נשים',  emoji: '👚' },
  'womens-tops':     { label: 'גופיות נשים',  emoji: '🎽' },
  'shoes':           { label: 'נעליים',        emoji: '👟' },
  'accessories':     { label: 'אביזרים',       emoji: '👜' },
};

export const CATEGORIES = Object.entries(CATEGORY_INFO).map(([id, info]) => ({
  id: id as Category,
  ...info,
}));

export const CONDITION_LABELS: Record<Condition, string> = {
  'new':      'חדש עם תג',
  'like-new': 'כמו חדש',
  'good':     'מצב טוב',
  'fair':     'מצב סביר',
};

export const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '37', '38', '39', '40', '41', '42', '43', '44'];

export const MOCK_ITEMS: ClothingItem[] = [
  // מכנסי גברים
  { id: 'm1', sellerId: 's1', sellerName: 'דנה כ.', name: "ג'ינס ישר כחול", brand: "Levi's", category: 'mens-pants', price: 180, size: '32', condition: 'good', description: "ג'ינס ישר קלאסי, שימוש מועט, במצב מצוין.", imageUrl: 'https://picsum.photos/seed/mp1/400/600', location: 'תל אביב', distance: 1.2 },
  { id: 'm2', sellerId: 's2', sellerName: 'אורן מ.', name: "מכנסי ג'וגר אפור", brand: 'Nike', category: 'mens-pants', price: 120, size: '34', condition: 'like-new', description: "מכנסי ג'וגר נוחים, פעם נלבשו.", imageUrl: 'https://picsum.photos/seed/mp2/400/600', location: 'ירושלים', distance: 3.5 },
  { id: 'm3', sellerId: 's3', sellerName: 'יוסי ב.', name: 'מכנסי קרגו ירוקים', brand: 'Zara', category: 'mens-pants', price: 95, size: '30', condition: 'good', description: 'קרגו טרנדי עם הרבה כיסים.', imageUrl: 'https://picsum.photos/seed/mp3/400/600', location: 'חיפה', distance: 2.1 },
  // חולצות גברים
  { id: 'ms1', sellerId: 's4', sellerName: 'גיל ל.', name: 'חולצת פולו לבנה', brand: 'Ralph Lauren', category: 'mens-shirts', price: 140, size: 'M', condition: 'like-new', description: 'חולצת פולו קלאסית, כמעט חדשה.', imageUrl: 'https://picsum.photos/seed/ms1/400/600', location: 'רמת גן', distance: 0.8 },
  { id: 'ms2', sellerId: 's5', sellerName: 'אמיר ש.', name: 'חולצת פסים כחול-לבן', brand: 'H&M', category: 'mens-shirts', price: 55, size: 'L', condition: 'good', description: 'חולצת פסים קלאסית, קלה ונעימה.', imageUrl: 'https://picsum.photos/seed/ms2/400/600', location: 'הרצליה', distance: 4.2 },
  { id: 'ms3', sellerId: 's6', sellerName: 'תומר ר.', name: "ג'קט ג'ינס כחול כהה", brand: 'Wrangler', category: 'mens-shirts', price: 220, size: 'XL', condition: 'good', description: "ג'קט ג'ינס קלאסי, מתאים לכל הזדמנות.", imageUrl: 'https://picsum.photos/seed/ms3/400/600', location: 'פתח תקווה', distance: 5.8 },
  // שמלות נשים
  { id: 'wd1', sellerId: 's7', sellerName: 'מיכל ג.', name: 'שמלת מקסי שחורה', brand: 'Mango', category: 'womens-dresses', price: 180, size: 'S', condition: 'like-new', description: 'שמלת מקסי אלגנטית, ללבוש פעם אחת.', imageUrl: 'https://picsum.photos/seed/wd1/400/600', location: 'תל אביב', distance: 1.5 },
  { id: 'wd2', sellerId: 's8', sellerName: 'שיר כ.', name: 'שמלת פרחים קייצית', brand: 'Zara', category: 'womens-dresses', price: 95, size: 'XS', condition: 'good', description: 'שמלה עם הדפס פרחוני צבעוני, מתאים לקיץ.', imageUrl: 'https://picsum.photos/seed/wd2/400/600', location: 'גבעתיים', distance: 2.3 },
  { id: 'wd3', sellerId: 's9', sellerName: 'נועה א.', name: 'שמלת מעטפת בורדו', brand: 'ASOS', category: 'womens-dresses', price: 130, size: 'M', condition: 'good', description: 'שמלת מעטפת מחמיאה, צבע בורדו עשיר.', imageUrl: 'https://picsum.photos/seed/wd3/400/600', location: 'רמת השרון', distance: 6.1 },
  // חולצות נשים
  { id: 'ws1', sellerId: 's10', sellerName: 'לירון מ.', name: 'חולצה קשורה פרחונית', brand: 'Pull&Bear', category: 'womens-shirts', price: 65, size: 'S', condition: 'like-new', description: 'חולצה עם קשירה בקדמי, דוגמת פרחים עדינה.', imageUrl: 'https://picsum.photos/seed/ws1/400/600', location: 'ראשון לציון', distance: 3.2 },
  { id: 'ws2', sellerId: 's11', sellerName: 'ענת פ.', name: 'חולצת משי שמפניה', brand: 'Mango', category: 'womens-shirts', price: 155, size: 'M', condition: 'like-new', description: 'חולצת משי אלגנטית, מתאימה למשרד ולפנאי.', imageUrl: 'https://picsum.photos/seed/ws2/400/600', location: 'תל אביב', distance: 0.9 },
  // גופיות נשים
  { id: 'wt1', sellerId: 's12', sellerName: 'רותם ג.', name: 'גופיית בסיסית לבנה', brand: 'Basic House', category: 'womens-tops', price: 35, size: 'M', condition: 'good', description: 'גופייה קלאסית ונוחה, מצב מצוין.', imageUrl: 'https://picsum.photos/seed/wt1/400/600', location: 'חיפה', distance: 1.8 },
  { id: 'wt2', sellerId: 's13', sellerName: 'הילה כ.', name: 'גופיית רצועות שחורה', brand: 'H&M', category: 'womens-tops', price: 45, size: 'S', condition: 'like-new', description: 'גופיית רצועות בסיסית ואיכותית.', imageUrl: 'https://picsum.photos/seed/wt2/400/600', location: 'נתניה', distance: 7.4 },
  // נעליים
  { id: 'sh1', sellerId: 's14', sellerName: 'יואב מ.', name: 'סניקרס לבן Air Force', brand: 'Nike', category: 'shoes', price: 350, size: '42', condition: 'good', description: 'נעליים לבנות, שימוש קל, ניקוי עם מי סבון.', imageUrl: 'https://picsum.photos/seed/sh1/400/600', location: 'תל אביב', distance: 2.5 },
  { id: 'sh2', sellerId: 's15', sellerName: 'רינת ב.', name: "נעלי עקב בז'", brand: 'Zara', category: 'shoes', price: 180, size: '37', condition: 'like-new', description: 'נעלי עקב אלגנטיות, לבישה פעם אחת.', imageUrl: 'https://picsum.photos/seed/sh2/400/600', location: 'כפר סבא', distance: 9.1 },
  { id: 'sh3', sellerId: 's16', sellerName: 'גולן א.', name: 'מגפיים שחורות', brand: 'Dr. Martens', category: 'shoes', price: 420, size: '40', condition: 'good', description: 'מגפיים קלאסיות, נלבשו עונה אחת.', imageUrl: 'https://picsum.photos/seed/sh3/400/600', location: 'ירושלים', distance: 15.3 },
  // אביזרים
  { id: 'ac1', sellerId: 's17', sellerName: 'דבורה נ.', name: 'תיק עור שחור קטן', brand: 'Guess', category: 'accessories', price: 280, size: 'אחיד', condition: 'like-new', description: 'תיק עור קטן אלגנטי, ללא שריטות.', imageUrl: 'https://picsum.photos/seed/ac1/400/600', location: 'רחובות', distance: 4.7 },
  { id: 'ac2', sellerId: 's18', sellerName: 'אביגיל ר.', name: 'שרשרת זהב עדינה', brand: 'Tiffany & Co.', category: 'accessories', price: 650, size: 'אחיד', condition: 'new', description: 'שרשרת זהב 14K, נקנתה ולא נלבשה.', imageUrl: 'https://picsum.photos/seed/ac2/400/600', location: 'הרצליה', distance: 8.2 },
];

// AI results simulation per category
export const AI_RESULTS_BY_CATEGORY: Record<Category, Omit<AiDraft, 'imageUri'>> = {
  'mens-pants':     { name: "ג'ינס ישר כחול", brand: 'Levi\'s', category: 'mens-pants', condition: 'good', description: "ג'ינס ישר קלאסי במצב טוב. מעט סימני שימוש, שמר על הצבע המקורי." },
  'mens-shirts':    { name: 'חולצת T כותנה שחורה', brand: 'Zara', category: 'mens-shirts', condition: 'like-new', description: 'חולצת T קלאסית מכותנה 100%, ללא כתמים ושחיקה.' },
  'womens-dresses': { name: 'שמלת מיני פרחונית', brand: 'H&M', category: 'womens-dresses', condition: 'good', description: 'שמלת מיני עם הדפס פרחים עדין, מצב טוב, ניקוי יבש.' },
  'womens-shirts':  { name: 'חולצה מחוץ לכתף', brand: 'Pull&Bear', category: 'womens-shirts', condition: 'like-new', description: 'חולצה טרנדית, לבישה מועטת, שמרה על הצורה המקורית.' },
  'womens-tops':    { name: 'גופיית קרופ לבנה', brand: 'Mango', category: 'womens-tops', condition: 'good', description: 'גופיית קרופ נוחה, מידת S, מצב טוב.' },
  'shoes':          { name: 'סניקרס לבן קלאסי', brand: 'Nike', category: 'shoes', condition: 'good', description: 'נעלי ספורט לבנות, שימוש מועט, ניקיות ומסודרות.' },
  'accessories':    { name: 'תיק קרוסבודי עור', brand: 'Guess', category: 'accessories', condition: 'like-new', description: 'תיק עור קטן בצבע שחור, ציפוי עור אמיתי, כמעט חדש.' },
};

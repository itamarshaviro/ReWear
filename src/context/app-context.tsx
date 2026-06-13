import { createContext, useContext, useState, ReactNode } from 'react';
import type { ClothingItem, InterestRequest, Chat, ChatMessage, AiDraft, Category, Condition } from '@/data/mock';
import { MOCK_ITEMS } from '@/data/mock';

const FREE_LIMIT = 5;
const PREMIUM_LIMIT = 50;

type AppContextType = {
  myListings: ClothingItem[];
  allListings: ClothingItem[];
  requests: InterestRequest[];
  chats: Chat[];
  isPremium: boolean;
  canAddMore: boolean;
  listingCount: number;
  limit: number;
  draft: AiDraft | null;
  setDraft: (d: AiDraft | null) => void;
  addListing: (item: Omit<ClothingItem, 'id' | 'sellerId' | 'sellerName' | 'distance'>) => void;
  sendInterest: (item: ClothingItem) => void;
  respondToRequest: (requestId: string, accept: boolean) => void;
  sendMessage: (chatId: string, text: string, from: 'buyer' | 'seller') => void;
  upgradePremium: () => void;
};

const AppContext = createContext<AppContextType | null>(null);

const INITIAL_CHATS: Chat[] = [
  {
    id: 'demo-chat',
    itemId: 'ms1',
    itemName: 'חולצת פולו לבנה',
    itemImage: 'https://picsum.photos/seed/ms1/400/600',
    otherPartyName: 'קונה פוטנציאלי',
    messages: [
      { id: 'dm1', text: 'היי! אני מעוניין בחולצה, היא עדיין זמינה?', from: 'buyer', timestamp: '10:30' },
      { id: 'dm2', text: 'כן! הפריט זמין 😊 מתי נוח לך להיפגש?', from: 'seller', timestamp: '10:35' },
      { id: 'dm3', text: 'מחר אחרי הצהריים, אפשר?', from: 'buyer', timestamp: '10:36' },
    ],
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [myListings, setMyListings] = useState<ClothingItem[]>([]);
  const [requests, setRequests] = useState<InterestRequest[]>([]);
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [isPremium, setIsPremium] = useState(false);
  const [draft, setDraft] = useState<AiDraft | null>(null);

  const limit = isPremium ? PREMIUM_LIMIT : FREE_LIMIT;
  const canAddMore = myListings.length < limit;
  const allListings = [...MOCK_ITEMS, ...myListings];

  function addListing(item: Omit<ClothingItem, 'id' | 'sellerId' | 'sellerName' | 'distance'>) {
    const newItem: ClothingItem = {
      ...item,
      id: `my-${Date.now()}`,
      sellerId: 'me',
      sellerName: 'אני',
      distance: 0,
    };
    setMyListings(prev => [...prev, newItem]);
  }

  function sendInterest(item: ClothingItem) {
    const req: InterestRequest = {
      id: `req-${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      itemImage: item.imageUrl,
      buyerName: 'קונה פוטנציאלי',
      status: 'pending',
      createdAt: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    };
    setRequests(prev => [...prev, req]);
  }

  function respondToRequest(requestId: string, accept: boolean) {
    let found: InterestRequest | undefined;
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) { found = r; return { ...r, status: accept ? 'accepted' : 'declined' }; }
      return r;
    }));
    if (accept && found) {
      const req = found;
      const newChat: Chat = {
        id: `chat-${Date.now()}`,
        itemId: req.itemId,
        itemName: req.itemName,
        itemImage: req.itemImage,
        otherPartyName: req.buyerName,
        messages: [
          {
            id: `msg-init`,
            text: 'היי! שמח/ה שהפריט מעניין אותך. הוא זמין 😊',
            from: 'seller',
            timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      };
      setChats(prev => [...prev, newChat]);
    }
  }

  function sendMessage(chatId: string, text: string, from: 'buyer' | 'seller') {
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      text,
      from,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    };
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, msg] } : c));
  }

  return (
    <AppContext.Provider value={{
      myListings,
      allListings,
      requests,
      chats,
      isPremium,
      canAddMore,
      listingCount: myListings.length,
      limit,
      draft,
      setDraft,
      addListing,
      sendInterest,
      respondToRequest,
      sendMessage,
      upgradePremium: () => setIsPremium(true),
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

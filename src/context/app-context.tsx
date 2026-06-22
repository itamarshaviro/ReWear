import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ClothingItem, InterestRequest, Chat, ChatMessage, AiDraft, Rating } from '@/data/mock';
import type { Category, Condition } from '@/data/mock';
import { MOCK_ITEMS } from '@/data/mock';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from './auth-context';

const FREE_LIMIT = 5;
const PREMIUM_LIMIT = 50;

type ItemStatus = 'active' | 'sold' | 'pending';

type AppContextType = {
  myListings: ClothingItem[];
  allListings: ClothingItem[];
  requests: InterestRequest[];
  chats: Chat[];
  ratings: Rating[];
  isPremium: boolean;
  canAddMore: boolean;
  listingCount: number;
  limit: number;
  draft: AiDraft | null;
  isLoadingData: boolean;
  setDraft: (d: AiDraft | null) => void;
  addListing: (item: Omit<ClothingItem, 'id' | 'sellerId' | 'sellerName' | 'distance'>) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  markListingAsSold: (id: string) => Promise<void>;
  getItemStatus: (itemId: string) => ItemStatus;
  getLikesCount: (itemId: string) => number;
  sendInterest: (item: ClothingItem) => Promise<void>;
  respondToRequest: (requestId: string, accept: boolean) => Promise<void>;
  sendMessage: (chatId: string, text: string, from: 'buyer' | 'seller') => Promise<void>;
  markSold: (chatId: string) => Promise<void>;
  submitRating: (chatId: string, score: number, review: string, role: 'buyer' | 'seller') => Promise<void>;
  upgradePremium: () => Promise<void>;
};

const AppContext = createContext<AppContextType | null>(null);

const DEMO_CHAT: Chat = {
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
};

const configured = isSupabaseConfigured();

function ts() {
  return new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const dbId = user?.dbId;

  const [items, setItems] = useState<ClothingItem[]>([]);
  const [requests, setRequests] = useState<InterestRequest[]>([]);
  const [chats, setChats] = useState<Chat[]>(configured ? [] : [DEMO_CHAT]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [localPremium, setLocalPremium] = useState(false);
  const [draft, setDraft] = useState<AiDraft | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(configured);

  const isPremium = localPremium || (user?.isPremium ?? false);
  const limit = isPremium ? PREMIUM_LIMIT : FREE_LIMIT;
  const myListings = configured
    ? items.filter(i => i.sellerId === dbId)
    : items;
  const allListings = configured ? items : [...MOCK_ITEMS, ...items];
  const canAddMore = myListings.length < limit;

  // ── Load all items (public) ──────────────────────────────────────────────
  useEffect(() => {
    if (!configured) return;
    loadItems();
  }, []);

  // ── Load user-specific data when logged in ───────────────────────────────
  useEffect(() => {
    if (!configured || !dbId) return;
    loadRequests();
    loadChats();
  }, [dbId]);

  // ── Realtime: new items ──────────────────────────────────────────────────
  useEffect(() => {
    if (!configured) return;

    const channel = supabase
      .channel('items:public')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items' },
        () => { loadItems(); }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items' },
        () => { loadItems(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Realtime: new messages ────────────────────────────────────────────────
  useEffect(() => {
    if (!configured || !dbId) return;

    const channel = supabase
      .channel(`messages:${dbId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new as { id: string; match_id: string; sender_id: string; text: string; created_at: string };
          const newMsg: ChatMessage = {
            id: row.id,
            text: row.text,
            from: row.sender_id === dbId ? 'seller' : 'buyer',
            timestamp: new Date(row.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
          };
          setChats(prev => prev.map(c =>
            c.id === row.match_id ? { ...c, messages: [...c.messages, newMsg] } : c
          ));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dbId]);

  // ── Realtime: match status changes ───────────────────────────────────────
  useEffect(() => {
    if (!configured || !dbId) return;

    const channel = supabase
      .channel(`matches:${dbId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' },
        () => {
          loadRequests();
          loadChats();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dbId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Data loaders
  // ─────────────────────────────────────────────────────────────────────────

  async function loadItems() {
    setIsLoadingData(true);
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (data) {
      setItems(data.map(row => ({
        id: row.id,
        sellerId: row.seller_id,
        sellerName: row.seller_name,
        name: row.name,
        brand: row.brand ?? '',
        category: row.category as Category,
        price: row.price,
        size: row.size,
        condition: row.condition as Condition,
        color: row.color ?? undefined,
        description: row.description ?? '',
        imageUrl: row.image_url ?? '',
        location: row.location ?? '',
        distance: 0,
      })));
    }
    setIsLoadingData(false);
  }

  async function loadRequests() {
    if (!dbId) return;
    type MatchRow = {
      id: string; item_id: string; buyer_id: string; seller_id: string;
      buyer_name: string; status: 'pending' | 'accepted' | 'declined'; created_at: string;
      items: { name: string; image_url: string | null } | null;
    };
    const { data } = await supabase
      .from('matches')
      .select('*, items(name, image_url)')
      .eq('seller_id', dbId)
      .order('created_at', { ascending: false });

    if (data) {
      const rows = data as unknown as MatchRow[];
      setRequests(rows.map(row => {
        const item = row.items;
        return {
          id: row.id,
          itemId: row.item_id,
          itemName: item?.name ?? '',
          itemImage: item?.image_url ?? '',
          buyerName: row.buyer_name,
          status: row.status,
          createdAt: new Date(row.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        };
      }));
    }
  }

  async function loadChats() {
    if (!dbId) return;
    type MatchWithItem = {
      id: string; item_id: string; buyer_id: string; seller_id: string;
      buyer_name: string; status: 'pending' | 'accepted' | 'declined'; created_at: string;
      items: { name: string; image_url: string | null; seller_name: string } | null;
    };
    const { data: matchesRaw } = await supabase
      .from('matches')
      .select('*, items(name, image_url, seller_name)')
      .eq('status', 'accepted')
      .or(`seller_id.eq.${dbId},buyer_id.eq.${dbId}`)
      .order('created_at', { ascending: false });
    const matches = matchesRaw as unknown as MatchWithItem[] | null;

    if (!matches || matches.length === 0) return;

    const matchIds = matches.map(m => m.id);
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .in('match_id', matchIds)
      .order('created_at', { ascending: true });

    const msgsByMatch: Record<string, ChatMessage[]> = {};
    for (const msg of (msgs ?? [])) {
      if (!msgsByMatch[msg.match_id]) msgsByMatch[msg.match_id] = [];
      msgsByMatch[msg.match_id].push({
        id: msg.id,
        text: msg.text,
        from: msg.sender_id === dbId ? 'seller' : 'buyer',
        timestamp: new Date(msg.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      });
    }

    setChats(matches.map(m => {
      const item = m.items;
      const isSeller = m.seller_id === dbId;
      const otherPartyName = isSeller ? m.buyer_name : (item?.seller_name ?? 'מוכר');
      return {
        id: m.id,
        itemId: m.item_id,
        itemName: item?.name ?? '',
        itemImage: item?.image_url ?? '',
        otherPartyName,
        messages: msgsByMatch[m.id] ?? [],
        isClosed: false,
      };
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────

  async function addListing(item: Omit<ClothingItem, 'id' | 'sellerId' | 'sellerName' | 'distance'>) {
    const sellerName = user ? `${user.firstName} ${user.lastName[0]}.` : 'מוכר';

    if (configured && dbId) {
      await supabase.from('items').insert({
        seller_id: dbId,
        seller_name: sellerName,
        name: item.name,
        brand: item.brand || null,
        category: item.category,
        price: item.price,
        size: item.size,
        condition: item.condition,
        color: item.color || null,
        description: item.description || null,
        image_url: item.imageUrl || null,
        location: item.location || null,
        is_available: true,
      });
      await loadItems();
      return;
    }

    setItems(prev => [...prev, {
      ...item,
      id: `my-${Date.now()}`,
      sellerId: 'me',
      sellerName,
      distance: 0,
    }]);
  }

  async function deleteListing(id: string) {
    if (configured) {
      await supabase.from('items').update({ is_available: false }).eq('id', id);
    }
    setItems(prev => prev.filter(i => i.id !== id));
  }

  async function markListingAsSold(id: string) {
    if (configured) {
      await supabase.from('items').update({ is_available: false }).eq('id', id);
    }
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function getItemStatus(itemId: string): ItemStatus {
    if (!items.find(i => i.id === itemId)) return 'sold';
    const hasPending = requests.some(r => r.itemId === itemId && r.status === 'pending');
    return hasPending ? 'pending' : 'active';
  }

  function getLikesCount(itemId: string): number {
    return requests.filter(r => r.itemId === itemId).length;
  }

  async function sendInterest(item: ClothingItem) {
    if (configured && dbId) {
      const buyerName = user ? `${user.firstName} ${user.lastName[0]}.` : 'קונה';
      await supabase.from('matches').insert({
        item_id: item.id,
        buyer_id: dbId,
        seller_id: item.sellerId,
        buyer_name: buyerName,
        status: 'pending',
      });
      return;
    }

    setRequests(prev => [...prev, {
      id: `req-${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      itemImage: item.imageUrl,
      buyerName: 'קונה פוטנציאלי',
      status: 'pending',
      createdAt: ts(),
    }]);
  }

  async function respondToRequest(requestId: string, accept: boolean) {
    if (configured) {
      await supabase.from('matches').update({ status: accept ? 'accepted' : 'declined' }).eq('id', requestId);
      if (accept && dbId) {
        await supabase.from('messages').insert({
          match_id: requestId,
          sender_id: dbId,
          text: 'היי! שמח/ה שהפריט מעניין אותך. הוא זמין 😊',
          is_read: false,
        });
        await loadChats();
      }
      await loadRequests();
      return;
    }

    let found: InterestRequest | undefined;
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) { found = r; return { ...r, status: accept ? 'accepted' : 'declined' }; }
      return r;
    }));
    if (accept && found) {
      const req = found;
      setChats(prev => [...prev, {
        id: `chat-${Date.now()}`,
        itemId: req.itemId,
        itemName: req.itemName,
        itemImage: req.itemImage,
        otherPartyName: req.buyerName,
        messages: [{ id: 'msg-init', text: 'היי! שמח/ה שהפריט מעניין אותך. הוא זמין 😊', from: 'seller', timestamp: ts() }],
      }]);
    }
  }

  async function sendMessage(chatId: string, text: string, from: 'buyer' | 'seller') {
    if (configured && dbId) {
      await supabase.from('messages').insert({
        match_id: chatId,
        sender_id: dbId,
        text,
        is_read: false,
      });
      // Realtime subscription updates the UI automatically
      return;
    }

    const msg: ChatMessage = { id: `msg-${Date.now()}`, text, from, timestamp: ts() };
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, msg] } : c));
  }

  async function markSold(chatId: string) {
    if (configured) {
      const { data: match } = await supabase.from('matches').select('item_id').eq('id', chatId).single();
      if (match) {
        await supabase.from('items').update({ is_available: false }).eq('id', match.item_id);
        await loadItems();
      }
    }
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, isClosed: true } : c));
  }

  async function submitRating(chatId: string, score: number, review: string, role: 'buyer' | 'seller') {
    if (configured && dbId) {
      await supabase.from('ratings').insert({
        match_id: chatId,
        reviewer_id: dbId,
        score,
        review,
        role,
      });
      return;
    }

    setRatings(prev => [...prev, {
      id: `rating-${Date.now()}`,
      chatId,
      score,
      review,
      role,
      createdAt: ts(),
    }]);
  }

  async function upgradePremium() {
    if (configured && dbId) {
      await supabase.from('users').update({ is_premium: true }).eq('id', dbId);
    }
    setLocalPremium(true);
  }

  return (
    <AppContext.Provider value={{
      myListings,
      allListings,
      requests,
      chats,
      ratings,
      isPremium,
      canAddMore,
      listingCount: myListings.length,
      limit,
      draft,
      isLoadingData,
      setDraft,
      addListing,
      deleteListing,
      markListingAsSold,
      getItemStatus,
      getLikesCount,
      sendInterest,
      respondToRequest,
      sendMessage,
      markSold,
      submitRating,
      upgradePremium,
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

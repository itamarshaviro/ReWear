import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import type { ClothingItem, InterestRequest, Chat, ChatMessage, AiDraft, Rating } from '@/data/mock';
import type { Category, Condition } from '@/data/mock';
import { MOCK_ITEMS } from '@/data/mock';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { sendPushNotification } from '@/lib/notifications';
import { useAuth } from './auth-context';

const FREE_LIMIT = 5;
const PREMIUM_LIMIT = 50;

type ItemStatus = 'active' | 'sold' | 'pending';

type AppContextType = {
  myListings: ClothingItem[];
  allListings: ClothingItem[];
  otherListings: ClothingItem[];
  requests: InterestRequest[];
  chats: Chat[];
  ratings: Rating[];
  isPremium: boolean;
  canAddMore: boolean;
  listingCount: number;
  limit: number;
  draft: AiDraft | null;
  isLoadingData: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  setUserLocation: (loc: { latitude: number; longitude: number } | null) => void;
  setDraft: (d: AiDraft | null) => void;
  addListing: (item: Omit<ClothingItem, 'id' | 'sellerId' | 'sellerName' | 'distance'>) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  markListingAsSold: (id: string) => Promise<void>;
  getItemStatus: (itemId: string) => ItemStatus;
  getLikesCount: (itemId: string) => number;
  refreshRequests: () => Promise<void>;
  refreshChats: () => Promise<void>;
  sendInterest: (item: ClothingItem) => Promise<void>;
  respondToRequest: (requestId: string, response: 'accept' | 'hold' | 'decline') => Promise<void>;
  sendMessage: (chatId: string, text: string, from: 'buyer' | 'seller', imageUrl?: string) => Promise<void>;
  markSold: (chatId: string) => Promise<void>;
  buyerConfirmSold: (chatId: string) => Promise<void>;
  buyerDeclineSold: (chatId: string) => Promise<void>;
  submitRating: (chatId: string, score: number, review: string, role: 'buyer' | 'seller', isReport?: boolean, reportReason?: string) => Promise<void>;
  deleteChat: (chatId: string) => void;
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

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function ts() {
  return new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}
function dateStr(d?: Date) {
  const date = d ?? new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const dbId = user?.dbId;

  const [items, setItems] = useState<ClothingItem[]>([]);
  const [requests, setRequests] = useState<InterestRequest[]>([]);
  const [chats, setChats] = useState<Chat[]>(configured ? [] : [DEMO_CHAT]);
  const hiddenChatIds = useRef<Set<string>>(new Set());
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [localPremium, setLocalPremium] = useState(false);
  const [draft, setDraft] = useState<AiDraft | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(configured);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const userLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const isPremium = localPremium || (user?.isPremium ?? false);
  const limit = isPremium ? PREMIUM_LIMIT : FREE_LIMIT;
  const myListings = configured
    ? items.filter(i => i.sellerId === dbId)
    : items;
  const allListings = configured ? items : [...MOCK_ITEMS, ...items];
  const otherListings = allListings.filter(i => dbId ? i.sellerId !== dbId : true);
  const canAddMore = myListings.length < limit;

  function handleSetUserLocation(loc: { latitude: number; longitude: number } | null) {
    userLocationRef.current = loc;
    setUserLocation(loc);
  }

  // ── Load all items (public) ──────────────────────────────────────────────
  useEffect(() => {
    if (!configured) return;
    loadItems();
  }, []);

  // ── Recalculate distances when GPS arrives (items loaded before GPS) ──────
  useEffect(() => {
    if (!userLocation) return;
    setItems(prev => prev.map(item => {
      if (typeof item.lat === 'number' && typeof item.lng === 'number') {
        const distance = Math.round(
          haversineKm(userLocation.latitude, userLocation.longitude, item.lat, item.lng) * 10
        ) / 10;
        return { ...item, distance };
      }
      return item;
    }));
  }, [userLocation]);

  // ── Load user-specific data when logged in ───────────────────────────────
  useEffect(() => {
    if (!configured || !dbId) return;
    loadRequests();
    loadChats();
    loadReviews();
    // Poll every 6s as fallback for realtime
    const poll = setInterval(() => {
      loadRequests();
      loadChats();
      loadReviews();
      loadItems();
    }, 6000);
    return () => clearInterval(poll);
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
          const row = payload.new as { id: string; match_id: string; sender_id: string; text: string; created_at: string; type?: string; image_url?: string };
          const msgDate = new Date(row.created_at);
          const newMsg: ChatMessage = {
            id: row.id,
            text: row.text,
            from: row.sender_id === dbId ? 'seller' : 'buyer',
            timestamp: msgDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
            date: dateStr(msgDate),
            type: (row.type === 'sold_notification') ? 'sold_notification' : row.type === 'image' ? 'image' : 'text',
            imageUrl: row.image_url ?? undefined,
          };
          setChats(prev => prev.map(c => {
            if (c.id !== row.match_id) return c;
            if (c.messages.some(m => m.id === row.id)) return c; // already added by loadChats
            return { ...c, messages: [...c.messages, newMsg] };
          }));
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
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches', filter: `seller_id=eq.${dbId}` },
        () => { loadRequests(); }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches' },
        () => { loadRequests(); loadChats(); }
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
      const loc = userLocationRef.current;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setItems((data as any[]).map(row => {
        let distance = 0;
        if (loc && typeof row.lat === 'number' && typeof row.lng === 'number') {
          distance = Math.round(haversineKm(loc.latitude, loc.longitude, row.lat, row.lng) * 10) / 10;
        }
        return {
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
          distance,
          lat: row.lat ?? undefined,
          lng: row.lng ?? undefined,
        };
      }));
    }
    setIsLoadingData(false);
  }

  async function loadRequests() {
    if (!dbId) return;
    type MatchRow = {
      id: string; item_id: string; buyer_id: string; seller_id: string;
      buyer_name: string; buyer_gender?: 'male' | 'female';
      status: 'pending' | 'accepted' | 'declined'; created_at: string;
      items: { name: string; image_url: string | null; price: number | null } | null;
    };
    const { data } = await supabase
      .from('matches')
      .select('*, items(name, image_url, price)')
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
          itemPrice: item?.price ?? undefined,
          buyerName: row.buyer_name,
          buyerGender: row.buyer_gender,
          status: row.status,
          createdAt: new Date(row.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        };
      }));
    }
  }

  async function loadReviews() {
    if (!dbId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('reviews') as any)
      .select('id, score, review, created_at, reviewer_id, users:reviewer_id(first_name, last_name)')
      .eq('seller_id', dbId)
      .eq('is_report', false)
      .order('created_at', { ascending: false });
    if (!data) return;
    setRatings(data.map((r: any) => {
      const u = r.users as { first_name?: string; last_name?: string } | null;
      const firstName = u?.first_name ?? '';
      const lastInitial = u?.last_name ? u.last_name[0] + '.' : '';
      const d = new Date(r.created_at);
      const date = `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getFullYear()).slice(-2)}`;
      return {
        id: r.id,
        chatId: '',
        score: r.score,
        review: r.review ?? '',
        role: 'buyer' as const,
        createdAt: r.created_at,
        reviewer: firstName ? `${firstName} ${lastInitial}`.trim() : 'קונה',
        date,
      };
    }));
  }

  async function loadChats() {
    if (!dbId) return;
    type MatchWithItem = {
      id: string; item_id: string; buyer_id: string; seller_id: string;
      buyer_name: string; status: string; created_at: string;
      seller_marked_sold: boolean; seller_id_for_review?: string;
      items: { name: string; image_url: string | null; seller_name: string; price: number | null } | null;
    };
    const { data: matchesRaw } = await supabase
      .from('matches')
      .select('*, items(name, image_url, seller_name, price)')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .in('status', ['accepted', 'on_hold', 'completed'] as any)
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
      const md = new Date(msg.created_at);
      msgsByMatch[msg.match_id].push({
        id: msg.id,
        text: msg.text,
        from: msg.sender_id === dbId ? 'seller' : 'buyer',
        timestamp: md.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        date: dateStr(md),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: (msg as any).type ?? 'text',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        imageUrl: (msg as any).image_url ?? undefined,
      });
    }

    setChats(matches.filter(m => !hiddenChatIds.current.has(m.id)).map(m => {
      const item = m.items;
      const isSeller = m.seller_id === dbId;
      const otherPartyName = isSeller ? m.buyer_name : (item?.seller_name ?? 'מוכר');
      const otherPartyDbId = isSeller ? m.buyer_id : m.seller_id;
      return {
        id: m.id,
        itemId: m.item_id,
        itemName: item?.name ?? '',
        itemImage: item?.image_url ?? '',
        itemPrice: item?.price ?? undefined,
        otherPartyName,
        otherPartyDbId,
        messages: msgsByMatch[m.id] ?? [],
        isClosed: m.status === 'completed',
        isSeller,
        sellerMarkedSold: m.seller_marked_sold ?? false,
      };
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────

  async function addListing(item: Omit<ClothingItem, 'id' | 'sellerId' | 'sellerName' | 'distance'>) {
    const sellerName = user ? `${user.firstName} ${user.lastName[0]}.` : 'מוכר';

    if (configured && dbId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('items') as any).insert({
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
        lat: item.lat ?? null,
        lng: item.lng ?? null,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('matches') as any).insert({
        item_id: item.id,
        buyer_id: dbId,
        seller_id: item.sellerId,
        buyer_name: buyerName,
        buyer_gender: user?.gender ?? null,
        status: 'pending',
      });
      if (error && error.code !== '23505') {
        console.error('sendInterest error:', error.message, error.code);
      }
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

  async function respondToRequest(requestId: string, response: 'accept' | 'hold' | 'decline') {
    const g = user?.gender;
    const happy   = g === 'female' ? 'שמחה'    : g === 'male' ? 'שמח'    : 'שמחים';
    const sorry   = g === 'female' ? 'מצטערת'  : g === 'male' ? 'מצטער'  : 'מצטערים';
    const msgText =
      response === 'accept' ? `היי! הפריט זמין, ${happy} שמעניין אותך 😊` :
      response === 'hold'   ? 'היי! מישהו אחר כרגע מתעניין בפריט ולכן בינתיים לא זמין. אם יהיה זמין בהמשך אעדכן אותך 🙏' :
                              `הפריט כבר לא זמין, ${sorry} 😔`;
    const newStatus = response === 'accept' ? 'accepted' : response === 'hold' ? 'on_hold' : 'declined';

    if (configured) {
      await supabase.from('matches').update({ status: newStatus as 'accepted' | 'declined' }).eq('id', requestId);
      if (dbId) {
        await supabase.from('messages').insert({ match_id: requestId, sender_id: dbId, text: msgText, is_read: false });
        if (response === 'accept' || response === 'hold') {
          // Find request in local state, or fetch from DB as fallback
          let req = requests.find(r => r.id === requestId);
          if (!req) {
            type MatchRow = { id: string; item_id: string; buyer_name: string; status: string; items: { name: string; image_url: string | null } | null };
            const { data } = await supabase
              .from('matches')
              .select('*, items(name, image_url)')
              .eq('id', requestId)
              .single();
            const row = data as unknown as MatchRow | null;
            if (row) {
              req = {
                id: row.id,
                itemId: row.item_id,
                itemName: row.items?.name ?? '',
                itemImage: row.items?.image_url ?? '',
                buyerName: row.buyer_name,
                status: row.status as InterestRequest['status'],
                createdAt: '',
              };
            }
          }
          if (req) {
            const newChat: Chat = {
              id: requestId,
              itemId: req.itemId,
              itemName: req.itemName,
              itemImage: req.itemImage,
              otherPartyName: req.buyerName,
              isSeller: true,
              sellerMarkedSold: false,
              messages: [{ id: `msg-${Date.now()}`, text: msgText, from: 'seller', timestamp: ts(), date: dateStr() }],
              isClosed: false,
            };
            setChats(prev => [...prev.filter(c => c.id !== requestId), newChat]);
          }
          loadChats(); // background refresh
        }
      }
      await loadRequests();
      return;
    }

    let found: InterestRequest | undefined;
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) { found = r; return { ...r, status: newStatus }; }
      return r;
    }));
    if (response === 'accept' && found) {
      const req = found;
      setChats(prev => [...prev, {
        id: `chat-${Date.now()}`,
        itemId: req.itemId, itemName: req.itemName, itemImage: req.itemImage,
        otherPartyName: req.buyerName, isSeller: true, sellerMarkedSold: false,
        messages: [{ id: 'msg-init', text: msgText, from: 'seller', timestamp: ts(), date: dateStr() }],
        isClosed: false,
      }]);
    }
  }

  async function sendMessage(chatId: string, text: string, from: 'buyer' | 'seller', imageUrl?: string) {
    if (configured && dbId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('messages') as any).insert({
        match_id: chatId,
        sender_id: dbId,
        text: text || '',
        is_read: false,
        ...(imageUrl ? { image_url: imageUrl, type: 'image' } : {}),
      });
      const chat = chats.find(c => c.id === chatId);
      if (chat?.otherPartyDbId) {
        const senderName = user?.firstName ?? 'מישהו';
        sendPushNotification(
          chat.otherPartyDbId,
          `הודעה חדשה מ${senderName}`,
          imageUrl ? '📷 תמונה' : (text.length > 80 ? text.slice(0, 80) + '...' : text),
          { screen: 'chat', chatId },
        );
      }
      return;
    }

    const msg: ChatMessage = {
      id: `msg-${Date.now()}`, text, from, timestamp: ts(), date: dateStr(),
      ...(imageUrl ? { imageUrl, type: 'image' as const } : {}),
    };
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, msg] } : c));
  }

  async function markSold(chatId: string) {
    if (configured && dbId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('matches') as any).update({ seller_marked_sold: true }).eq('id', chatId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('messages') as any).insert({
        match_id: chatId, sender_id: dbId,
        text: 'הפריט נמכר ✅',
        type: 'sold_notification',
        is_read: false,
      });
      await loadChats();
      return;
    }
    setChats(prev => prev.map(c => c.id === chatId
      ? {
          ...c,
          sellerMarkedSold: true,
          messages: [...c.messages, {
            id: `sold-${Date.now()}`,
            text: 'הפריט נמכר ✅',
            from: 'seller',
            timestamp: ts(),
            date: dateStr(),
            type: 'sold_notification' as const,
          }],
        }
      : c
    ));
  }

  async function buyerConfirmSold(chatId: string) {
    if (configured) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)('complete_match', { p_match_id: chatId });
      if (error) {
        console.error('complete_match error:', error.message);
        // Fallback: update match directly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('matches') as any).update({ status: 'completed' }).eq('id', chatId);
      }
      await loadItems();
    }
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, isClosed: true, sellerMarkedSold: false } : c));
  }

  async function buyerDeclineSold(chatId: string) {
    if (configured) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('matches') as any).update({ seller_marked_sold: false }).eq('id', chatId);
      await loadChats();
      return;
    }
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, sellerMarkedSold: false } : c));
  }

  async function submitRating(chatId: string, score: number, review: string, role: 'buyer' | 'seller', isReport = false, reportReason = '') {
    if (configured && dbId) {
      const { data: matchData } = await supabase.from('matches').select('seller_id').eq('id', chatId).single();
      const sellerId = (matchData as { seller_id: string } | null)?.seller_id ?? null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: reviewError } = await (supabase.from('reviews') as any).insert({
        match_id: chatId,
        reviewer_id: dbId,
        seller_id: sellerId,
        score,
        review: review || null,
        is_report: isReport,
        report_reason: (isReport && reportReason) ? reportReason : null,
      });
      if (reviewError) console.error('submitRating insert error:', reviewError.message, reviewError.code);
      await loadReviews();
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

  function deleteChat(chatId: string) {
    hiddenChatIds.current.add(chatId);
    setChats(prev => prev.filter(c => c.id !== chatId));
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
      otherListings,
      requests,
      chats,
      ratings,
      isPremium,
      canAddMore,
      listingCount: myListings.length,
      limit,
      draft,
      isLoadingData,
      userLocation,
      setUserLocation: handleSetUserLocation,
      setDraft,
      addListing,
      deleteListing,
      markListingAsSold,
      getItemStatus,
      getLikesCount,
      refreshRequests: loadRequests,
      refreshChats: loadChats,
      sendInterest,
      respondToRequest,
      sendMessage,
      markSold,
      buyerConfirmSold,
      buyerDeclineSold,
      submitRating,
      deleteChat,
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

// Dev-only in-memory store for the wishlist when no DB is available.
// Uses globalThis so HMR doesn't wipe it between hot reloads.

export interface WishlistItem {
  id: string;
  title: string;
  description: string;
  created_by_email: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

interface Store {
  items: WishlistItem[];
  nextId: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __wishlist_dev_store: Store | undefined;
}

const store: Store =
  globalThis.__wishlist_dev_store ?? (globalThis.__wishlist_dev_store = { items: [], nextId: 1 });

function uid() {
  return `dev-${store.nextId++}-${Math.random().toString(36).slice(2, 8)}`;
}

export const devStore = {
  list(): WishlistItem[] {
    return [...store.items].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  get(id: string): WishlistItem | undefined {
    return store.items.find((x) => x.id === id);
  },
  create(input: Pick<WishlistItem, 'title' | 'description' | 'created_by_email' | 'created_by_name'>): WishlistItem {
    const now = new Date().toISOString();
    const item: WishlistItem = { id: uid(), ...input, created_at: now, updated_at: now };
    store.items.push(item);
    return item;
  },
  update(id: string, patch: Partial<Pick<WishlistItem, 'title' | 'description'>>): WishlistItem | null {
    const it = store.items.find((x) => x.id === id);
    if (!it) return null;
    Object.assign(it, patch, { updated_at: new Date().toISOString() });
    return it;
  },
  remove(id: string): boolean {
    const idx = store.items.findIndex((x) => x.id === id);
    if (idx === -1) return false;
    store.items.splice(idx, 1);
    return true;
  },
};

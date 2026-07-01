import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setItems([]);
    }
  }, [user]);

  async function fetchCart() {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products (
          *,
          vendor:profiles (*),
          images:product_images (*),
          category:categories (*)
        )
      `)
      .eq('user_id', user.id);

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  }

  async function addItem(product: Product, quantity: number = 1) {
    if (!user) return;

    const existingItem = items.find((item) => item.product_id === product.id);

    if (existingItem) {
      await updateQuantity(product.id, existingItem.quantity + quantity);
    } else {
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: product.id,
          quantity,
        })
        .select(`
          *,
          product:products (
            *,
            vendor:profiles (*),
            images:product_images (*),
            category:categories (*)
          )
        `)
        .maybeSingle();

      if (!error && data) {
        setItems([...items, data]);
      }
    }
  }

  async function removeItem(productId: string) {
    if (!user) return;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (!error) {
      setItems(items.filter((item) => item.product_id !== productId));
    }
  }

  async function updateQuantity(productId: string, quantity: number) {
    if (!user) return;

    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (!error) {
      setItems(
        items.map((item) =>
          item.product_id === productId ? { ...item, quantity } : item
        )
      );
    }
  }

  async function clearCart() {
    if (!user) return;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (!error) {
      setItems([]);
    }
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// hooks/useCart.ts
import { useState, useEffect } from "react";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  description: string;
  note?: string; // Thêm trường note
}

const CART_STORAGE_KEY = "cart";

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [cartVersion, setCartVersion] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          setCartItems(parsedCart);
        }
      } catch (error) {
        console.error("Error parsing cart from localStorage:", error);
        setCartItems([]);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage and increment version
  useEffect(() => {
    if (!isInitialized) return;

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    // Tăng version để trigger re-render ở các component sử dụng hook
    setCartVersion((prev) => prev + 1);
  }, [cartItems, isInitialized]);

  // Cập nhật hàm addToCart để hỗ trợ note
  const addToCart = (
    item: Omit<CartItem, "quantity">,
    quantity: number = 1,
    note?: string
  ) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (cartItem) => cartItem.id === item.id
      );

      if (existingItem) {
        return prevItems.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + quantity,
                note: note !== undefined ? note : cartItem.note, // Cập nhật note nếu được cung cấp
              }
            : cartItem
        );
      } else {
        return [...prevItems, { ...item, quantity, note }];
      }
    });
  };

  const removeFromCart = (id: number) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const handleCheckout = () => {
    setShowOrderSuccess(true);
    clearCart();
  };

  const closeOrderSuccess = () => {
    setShowOrderSuccess(false);
  };

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    showOrderSuccess,
    handleCheckout,
    closeOrderSuccess,
    cartVersion,
  };
};

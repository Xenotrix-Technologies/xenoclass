import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  Course_ID: number;
  Course_Name: string;
  Amount: number;
  Duration?: string;
  Image_Url?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (courseId: number) => void;
  clearCart: () => void;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('student_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('student_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    if (!cart.some((c) => c.Course_ID === item.Course_ID)) {
      setCart((prev) => [...prev, item]);
    }
  };

  const removeFromCart = (courseId: number) => {
    setCart((prev) => prev.filter((c) => c.Course_ID !== courseId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalAmount = cart.reduce((acc, item) => acc + (Number(item.Amount) || 0), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

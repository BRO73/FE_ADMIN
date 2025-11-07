import React, { FC } from "react";

interface CartFooterProps {
  cartItemCount: number;
  onBackToLiveOrder: () => void;
}

export const CartFooter: FC<CartFooterProps> = ({
  cartItemCount,
  onBackToLiveOrder,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/80 backdrop-blur-sm border-t border-gray-100">
      <button
        onClick={onBackToLiveOrder}
        className="w-full flex justify-between items-center bg-blue-500 text-white font-bold py-3.5 px-5 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all active:scale-95"
      >
        <span>{cartItemCount} món trong giỏ</span>
        <span className="flex items-center gap-2">
          Quay lại order
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </span>
      </button>
    </div>
  );
};

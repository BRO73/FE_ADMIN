import React, { FC } from "react";
import { Table, TableResponse } from "@/types/index";
import { ChevronLeft } from "lucide-react";

interface MenuHeaderProps {
  tableInfo: TableResponse | null;
  cartItemCount: number;
  onBackToLiveOrder: () => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  categories: string[];
  selectedCategory: string;
  onSelectedCategoryChange: (category: string) => void;
}

export const MenuHeader: FC<MenuHeaderProps> = ({
  tableInfo,
  cartItemCount,
  onBackToLiveOrder,
  searchTerm,
  onSearchTermChange,
  categories,
  selectedCategory,
  onSelectedCategoryChange,
}) => {
  return (
    <div className="bg-white sticky top-0 z-30 shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              className="h-10 w-10 -ml-2 flex items-center justify-center hover:bg-gray-100 rounded-lg"
              onClick={onBackToLiveOrder}
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>

            <div
              className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              onClick={onBackToLiveOrder}
            >
              {tableInfo?.tableNumber || "--"}
            </div>
            <div className="min-w-0" onClick={onBackToLiveOrder}>
              <div className="text-xs font-bold text-gray-900 truncate">
                Bàn {tableInfo?.tableNumber || "N/A"}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {tableInfo?.section || "..."}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Đã xoá nút Gọi NV */}

            {cartItemCount > 0 && (
              <button
                onClick={onBackToLiveOrder}
                className="relative p-2 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95 transition-all flex-shrink-0"
              >
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Tìm món ăn..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="px-4 pb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onSelectedCategoryChange(category)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

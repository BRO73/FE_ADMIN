import React, { FC } from "react";
import { MenuItem } from "@/types/index";

interface MenuListProps {
  items: MenuItem[];
  addingToCart: number | null;
  onOrderClick: (item: MenuItem) => void;
  onQuickAddToCart: (item: MenuItem, e: React.MouseEvent) => void;
}

export const MenuList: FC<MenuListProps> = ({
  items,
  addingToCart,
  onOrderClick,
  onQuickAddToCart,
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Không tìm thấy món ăn
        </h3>
        <p className="text-gray-500 text-sm">Thử tìm kiếm với từ khóa khác</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onOrderClick(item)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm active:scale-95 transition-transform cursor-pointer"
          >
            <div className="relative aspect-square">
              <img
                src={
                  item.imageUrl ||
                  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop"
                }
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
                <svg
                  className="w-3 h-3 text-yellow-400 fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
                <span className="font-medium text-xs">4.8</span>
              </div>
              {item.status.toLowerCase() !== "available" && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-xs font-bold">
                    Hết hàng
                  </span>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2 min-h-[40px]">
                {item.name}
              </h3>
              <div className="flex items-center justify-between">
                <div className="text-gray-900 font-bold text-base">
                  {item.price.toLocaleString("vi-VN")}₫
                </div>
                {item.status.toLowerCase() === "available" && (
                  <button
                    onClick={(e) => onQuickAddToCart(item, e)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${
                      addingToCart === item.id
                        ? "bg-green-500 scale-110 text-white"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {addingToCart === item.id ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
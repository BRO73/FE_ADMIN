import React, { useState } from "react";
import { MenuItem } from "@/types/type";
import { X } from "lucide-react";

interface FoodDetailProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number, note?: string) => void;
}

const FoodDetail: React.FC<FoodDetailProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  if (!item) return null;

  const handleAddToCart = () => {
    onAddToCart(item, quantity, note.trim() || undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors z-10"
          onClick={onClose}
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Item image */}
        <div className="relative h-48 w-full">
          <img
            src={
              item.imageUrl ||
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop"
            }
            alt={item.name}
            className="w-full h-full object-cover rounded-t-2xl"
          />
        </div>

        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h2>
          {item.description && (
            <p className="text-gray-600 mb-4">{item.description}</p>
          )}

          <div className="flex items-center justify-between mb-6">
            <span className="text-2xl font-bold text-gray-900">
              {item.price.toLocaleString()} đ
            </span>
          </div>

          {/* Note section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thêm ghi chú cho món ăn
            </label>
            <textarea
              className="w-full h-20 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Nhập ghi chú cho món ăn (ví dụ: ít cay, không hành...)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Quantity selector */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-medium text-gray-700">Số lượng</span>
            <div className="flex items-center gap-3">
              <button
                className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                −
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button
                className="w-8 h-8 rounded border border-blue-500 flex items-center justify-center text-blue-500 hover:bg-blue-50"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Add to cart button */}
          <button
            className="w-full h-12 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddToCart}
            disabled={item.status.toLowerCase() !== "available"}
          >
            {item.status.toLowerCase() === "available"
              ? `Thêm vào giỏ - ${(item.price * quantity).toLocaleString()} đ`
              : "Hết hàng"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodDetail;

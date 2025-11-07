import React from "react";
import { MoreHorizontal } from "lucide-react";

interface OrderItemCardProps {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  onQuantityChange: (q: number) => void;
  onEditNote: () => void;
  isNew?: boolean;
  dbQuantity: number;
  note?: string;
}

export const OrderItemCard: React.FC<OrderItemCardProps> = ({
  name,
  description,
  price,
  quantity,
  onQuantityChange,
  onEditNote,
  isNew,
  dbQuantity,
  note,
}) => (
  <div
    className={`bg-white rounded-lg p-4 transition-all ${
      isNew ? "border-2 border-blue-500" : "border border-gray-100"
    }`}
  >
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
        <span className="text-lg">🍽️</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">
            {name}
          </h3>
          <button 
            className="p-1 hover:bg-gray-100 rounded"
            onClick={onEditNote}
          >
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {description && (
          <p className="text-xs text-gray-500 mb-2">{description}</p>
        )}

        {/* Hiển thị ghi chú nếu có */}
        {note && (
          <div className="mb-2">
            <p className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
              <span className="font-medium">Ghi chú:</span> {note}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-gray-900">
            {price.toLocaleString()} đ
          </p>

          <div className="flex items-center gap-2">
            <button
              className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => onQuantityChange(quantity - 1)}
              disabled={quantity <= dbQuantity}
            >
              −
            </button>

            <span className="text-sm font-semibold w-6 text-center text-gray-900">
              {quantity}
            </span>

            <button
              className="w-7 h-7 rounded border border-blue-500 flex items-center justify-center text-blue-500 hover:bg-blue-50 active:bg-blue-100 text-base font-medium"
              onClick={() => onQuantityChange(quantity + 1)}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
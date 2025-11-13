import React from "react";
import { X, Printer } from "lucide-react";

type BillItem = {
  name: string;
  quantity: number;
  price: number;
  note?: string;
};

type BillPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: number;
  tableNumber: number;
  items: BillItem[];
  totalAmount: number;
};

export const BillPreviewModal: React.FC<BillPreviewModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  tableNumber,
  items,
  totalAmount,
}) => {
  if (!isOpen) return null;

  const currentDate = new Date().toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Tạm tính</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Bill Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <div className="space-y-4 font-mono text-sm">
            {/* Restaurant Header */}
            <div className="text-center border-b-2 border-dashed pb-4">
              <h1 className="text-xl font-bold mb-1">NHÀ HÀNG ABC</h1>
              <p className="text-xs text-gray-600">123 Đường ABC, Quận XYZ</p>
              <p className="text-xs text-gray-600">ĐT: 0123 456 789</p>
            </div>

            {/* Order Info */}
            <div className="border-b border-dashed pb-3 space-y-1">
              <div className="flex justify-between">
                <span>Bàn:</span>
                <span className="font-semibold">#{tableNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Order:</span>
                <span className="font-semibold">#{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Ngày:</span>
                <span>{currentDate}</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3 border-b border-dashed pb-3">
              <div className="flex justify-between font-semibold">
                <span>Món</span>
                <span>Thành tiền</span>
              </div>
              {items.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between">
                    <span>{item.name}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-xs pl-2">
                    <span>
                      {item.quantity} x {(item.price / 100).toLocaleString()}đ
                    </span>
                    <span className="font-semibold">
                      {((item.price * item.quantity) / 100).toLocaleString()}đ
                    </span>
                  </div>
                  {item.note && (
                    <div className="text-xs text-gray-500 italic pl-2">
                      Ghi chú: {item.note}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="space-y-2">
              <div className="flex justify-between text-base">
                <span>Tạm tính:</span>
                <span>{totalAmount.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t-2 border-double pt-2">
                <span>TỔNG CỘNG:</span>
                <span>{totalAmount.toLocaleString()}đ</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-600 border-t border-dashed pt-4">
              <p>Cảm ơn quý khách!</p>
              <p>Hẹn gặp lại!</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t space-y-2">
          <button
            onClick={() => window.print()}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Printer className="h-4 w-4" />
            In hóa đơn
          </button>
          <button
            onClick={onClose}
            className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

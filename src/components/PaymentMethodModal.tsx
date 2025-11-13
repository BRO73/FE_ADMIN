import React from "react";
import { X, Banknote, CreditCard } from "lucide-react";

type PaymentMethodModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectCash: () => void;
  onSelectBankTransfer: () => void;
  totalAmount: number;
};

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onSelectCash,
  onSelectBankTransfer,
  totalAmount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Chọn phương thức thanh toán</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Total Amount */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Tổng tiền</p>
            <p className="text-3xl font-bold text-gray-900">
              {totalAmount.toLocaleString()}đ
            </p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-4 space-y-3">
          {/* Cash Payment */}
          <button
            onClick={onSelectCash}
            className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center">
                <Banknote className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Tiền mặt</h3>
                <p className="text-sm text-gray-500">
                  Thanh toán bằng tiền mặt
                </p>
              </div>
            </div>
          </button>

          {/* Bank Transfer */}
          <button
            onClick={onSelectBankTransfer}
            className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Chuyển khoản</h3>
                <p className="text-sm text-gray-500">
                  Thanh toán qua ngân hàng
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Cancel Button */}
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { CreditCard, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
  orderNumber: number;
  totalAmount: number;
  tableId?: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  orderNumber,
  totalAmount,
  tableId,
}) => {
  const navigate = useNavigate();

  const handleCashierPayment = () => {
    // Demo: Giả lập thanh toán thành công với thu ngân
    console.log("Thanh toán với thu ngân thành công");
    
    // Redirect đến trang thank you
    navigate('/thank-you', {
      state: {
        orderInfo: {
          orderId: `ORDER_${Date.now()}`,
          totalAmount: totalAmount,
          tableId: tableId,
          paymentMethod: 'cashier'
        }
      }
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
          onClick={onClose}
          disabled={isProcessing}
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <div className="text-center mb-6 pt-2">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Chọn phương thức thanh toán
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Order {orderNumber} - Tổng tiền:{" "}
            <span className="font-semibold">{totalAmount.toLocaleString()} đ</span>
          </p>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Tổng tiền cần thanh toán</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalAmount.toLocaleString()} đ
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? "Đang xử lý..." : "Thanh toán tại bàn"}
          </button>
          
          <button
            className="w-full h-12 rounded-lg border-2 border-blue-600 bg-white hover:bg-blue-50 active:bg-blue-100 text-sm font-medium text-blue-600 transition-colors"
            onClick={handleCashierPayment}
            disabled={isProcessing}
          >
            Thanh toán với thu ngân
          </button>
        </div>
      </div>
    </div>
  );
};
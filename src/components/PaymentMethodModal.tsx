// components/PaymentModal.tsx
import React, { useState, useEffect } from "react";
import {
  X,
  Banknote,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { validatePromotion } from "@/api/promotion.api";
import { Promotion } from "@/types/type";

interface PaymentConfirmParams {
  paymentMethod: "cash" | "bank_transfer";
  finalAmount: number;
  discountCode?: string;
  promotion?: Promotion;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (params: PaymentConfirmParams) => void;
  onChangeCustomer?: () => void;
  orderNumber: number;
  tableNumber: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    note?: string;
  }>;
  totalAmount: number;
  isProcessing?: boolean;
  customerInfo?: {
    userId: number;
    name: string;
    phone: string;
  } | null;
}

export const PaymentMethodModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onChangeCustomer,
  orderNumber,
  tableNumber,
  items,
  totalAmount,
  customerInfo,
  isProcessing = false,
}) => {
  const [discountCode, setDiscountCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank_transfer">(
    "cash"
  );
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [isDiscountApplied, setIsDiscountApplied] = useState(false);
  const [discountMessage, setDiscountMessage] = useState("");
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(
    null
  );
  const [finalAmount, setFinalAmount] = useState(totalAmount);
  const [isCheckingDiscount, setIsCheckingDiscount] = useState(false);

  // **** THAY ĐỔI 1: CẬP NHẬT LOGIC RESET ****
  // Cập nhật finalAmount VÀ reset mã giảm giá khi totalAmount thay đổi
  useEffect(() => {
    setFinalAmount(totalAmount);
    // Reset trạng thái giảm giá nếu tổng tiền thay đổi
    setIsDiscountApplied(false);
    setAppliedPromotion(null);
    setDiscountMessage("");
    setDiscountCode(""); // <-- Reset luôn cả ô input
  }, [totalAmount]);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountMessage("Vui lòng nhập mã giảm giá");
      return;
    }

    setIsCheckingDiscount(true);
    setDiscountMessage("Đang kiểm tra mã giảm giá...");

    try {
      //
      // **** THAY ĐỔI 2: TRUYỀN `userId` VÀO API ****
      //
      const promotion = await validatePromotion(
        discountCode,
        totalAmount,
        customerInfo?.userId // <-- Gửi userId (hoặc null) lên backend
      );
      //
      // **** HẾT THAY ĐỔI ****
      //

      // NẾU ĐẾN ĐƯỢC ĐÂY, CÓ NGHĨA LÀ MÃ HỢP LỆ!
      // Backend đã làm hết việc kiểm tra (hết hạn, min spend, và cả userId)

      // CHỈ CẦN TÍNH TOÁN TIỀN
      let discountAmount = 0;
      let newFinalAmount = totalAmount;

      if (promotion.promotionType === "PERCENTAGE") {
        discountAmount = totalAmount * (promotion.value / 100);
        newFinalAmount = totalAmount - discountAmount;
      } else {
        // 'fixed'
        discountAmount = promotion.value;
        newFinalAmount = totalAmount - discountAmount;
      }

      // Đảm bảo số tiền không âm
      if (newFinalAmount < 0) {
        newFinalAmount = 0;
      }

      // Set trạng thái thành công
      setAppliedPromotion(promotion);
      setIsDiscountApplied(true);
      setFinalAmount(newFinalAmount);
      setDiscountMessage(
        `✅ Áp dụng mã giảm giá thành công! Giảm ${discountAmount.toLocaleString()}đ`
      );
    } catch (error: any) {
      // === KHỐI CATCH XỬ LÝ MỌI LỖI ===
      let errorMessage = "❌ Có lỗi xảy ra khi kiểm tra mã giảm giá";

      // Lấy thông báo lỗi cụ thể từ backend
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = `❌ ${error.response.data.message}`;
      }
      // Bạn có thể giữ lại fallback 404 cho chắc
      else if (error.response?.status === 404) {
        errorMessage = "❌ Mã giảm giá không tồn tại";
      }

      // Set trạng thái thất bại
      setDiscountMessage(errorMessage);
      setIsDiscountApplied(false);
      setAppliedPromotion(null);
      setFinalAmount(totalAmount);
    } finally {
      setIsCheckingDiscount(false);
    }
  };

  const handleDiscountCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value;
    setDiscountCode(newCode);

    // Reset trạng thái khi người dùng thay đổi mã
    if (isDiscountApplied || appliedPromotion) {
      setIsDiscountApplied(false);
      setAppliedPromotion(null);
      setFinalAmount(totalAmount);
      setDiscountMessage("");
    }
  };

  // Xử lý xác nhận thanh toán
  const handleConfirm = () => {
    const params: PaymentConfirmParams = {
      paymentMethod,
      finalAmount,
      discountCode: isDiscountApplied ? discountCode : undefined,
      promotion: isDiscountApplied ? appliedPromotion || undefined : undefined,
    };

    onConfirm(params);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Thanh toán Order {orderNumber}
          </h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {customerInfo && (
          <div className="p-4 bg-blue-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Khách hàng</p>
                <p className="font-medium">{customerInfo.name}</p>
                <p className="text-sm text-gray-500">{customerInfo.phone}</p>
              </div>
              <button
                onClick={onChangeCustomer}
                disabled={isProcessing}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                Đổi khách hàng
              </button>
            </div>
          </div>
        )}

        <div className="p-4">
          {/* Table Info */}
          <p className="text-gray-600 mb-4">Bàn {tableNumber}</p>

          {/* Order Items */}
          <div className="border-t border-b border-gray-200 py-4 mb-4">
            <h3 className="font-medium mb-3">Chi tiết đơn hàng</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    {item.note && (
                      <p className="text-sm text-gray-500 mt-1">
                        Ghi chú: {item.note}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {item.quantity} x {item.price.toLocaleString()} đ
                    </p>
                    <p className="font-medium">
                      {(item.quantity * item.price).toLocaleString()} đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discount Code */}
          <div className="mb-4">
            <label
              htmlFor="discountCode"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Mã giảm giá (nếu có)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="discountCode"
                value={discountCode}
                onChange={handleDiscountCodeChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mã giảm giá"
                disabled={isProcessing || isCheckingDiscount}
              />
              <button
                type="button"
                onClick={handleApplyDiscount}
                disabled={
                  isProcessing || isCheckingDiscount || !discountCode.trim()
                }
                className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                  isDiscountApplied
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isCheckingDiscount ? (
                  "Đang kiểm tra..."
                ) : isDiscountApplied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Đã áp dụng</span>
                  </>
                ) : (
                  "Áp dụng"
                )}
              </button>
            </div>
            {discountMessage && (
              <p
                className={`text-sm mt-2 ${
                  discountMessage.includes("✅")
                    ? "text-green-600"
                    : discountMessage.includes("Đang kiểm tra")
                    ? "text-blue-600"
                    : "text-red-600"
                }`}
              >
                {discountMessage}
              </p>
            )}
          </div>

          {/* Total Amount Display */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Tổng tiền thanh toán</p>
              <p className="text-3xl font-bold text-gray-900">
                {finalAmount.toLocaleString()} đ
              </p>
            </div>

            {isDiscountApplied && appliedPromotion && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm text-green-600">
                  <span>Giảm giá:</span>
                  <span>
                    {appliedPromotion.promotionType === "PERCENTAGE"
                      ? `${appliedPromotion.value}%`
                      : `${appliedPromotion.value.toLocaleString()}đ`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Tiền gốc:</span>
                  <span>{totalAmount.toLocaleString()} đ</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Dropdown */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phương thức thanh toán
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPaymentMethods(!showPaymentMethods)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                disabled={isProcessing}
              >
                <div className="flex items-center gap-3">
                  {paymentMethod === "cash" ? (
                    <>
                      <Banknote className="h-5 w-5 text-green-600" />
                      <span>Tiền mặt</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <span>Chuyển khoản</span>
                    </>
                  )}
                </div>
                {showPaymentMethods ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {showPaymentMethods && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("cash");
                      setShowPaymentMethods(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-gray-50 ${
                      paymentMethod === "cash" ? "bg-blue-50" : ""
                    }`}
                  >
                    <Banknote className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Tiền mặt</p>
                      <p className="text-sm text-gray-500">
                        Thanh toán bằng tiền mặt
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("bank_transfer");
                      setShowPaymentMethods(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-gray-50 ${
                      paymentMethod === "bank_transfer" ? "bg-blue-50" : ""
                    }`}
                  >
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Chuyển khoản</p>
                      <p className="text-sm text-gray-500">
                        Thanh toán qua ngân hàng
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={onClose}
              disabled={isProcessing}
            >
              Hủy
            </button>
            <button
              className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleConfirm}
              disabled={isProcessing || finalAmount <= 0}
            >
              {isProcessing ? "Đang xử lý..." : "Xác nhận thanh toán"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { X, Receipt } from "lucide-react";

type BillItem = {
  name: string;
  quantity: number;
  price: number;
  note?: string;
};

type CashPaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalAmount: number;
  items: BillItem[];
  isProcessing: boolean;
};

export const CashPaymentModal: React.FC<CashPaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  items,
  isProcessing,
}) => {
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [change, setChange] = useState<number>(0);

  useEffect(() => {
    if (amountReceived) {
      const received = parseFloat(amountReceived.replace(/,/g, ""));
      if (!isNaN(received)) {
        setChange(received - totalAmount);
      } else {
        setChange(0);
      }
    } else {
      setChange(0);
    }
  }, [amountReceived, totalAmount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, "");
    if (value === "" || /^\d+$/.test(value)) {
      setAmountReceived(value);
    }
  };

  const quickAmounts = [
    totalAmount,
    Math.ceil(totalAmount / 50000) * 50000,
    Math.ceil(totalAmount / 100000) * 100000,
    Math.ceil(totalAmount / 500000) * 500000,
  ];

  const handleQuickAmount = (amount: number) => {
    setAmountReceived(amount.toString());
  };

  const canConfirm =
    amountReceived &&
    parseFloat(amountReceived.replace(/,/g, "")) >= totalAmount;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header - Compact */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Thanh toán tiền mặt
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="h-9 w-9 flex items-center justify-center hover:bg-white/20 rounded-lg disabled:opacity-50 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* 2-Column Layout - Fixed Height */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT SIDE - Bill Details */}
          <div className="w-2/5 bg-gray-50 border-r border-gray-200 flex flex-col">
            {/* Scrollable Items */}
            <div className="flex-1 p-5 overflow-y-auto">
              <h3 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                Chi tiết đơn hàng
              </h3>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-3 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-gray-900 flex-1 leading-tight">
                        {item.name}
                      </p>
                      <p className="text-sm font-bold text-gray-900 ml-3">
                        {((item.price * item.quantity) / 100).toLocaleString()}đ
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {item.quantity} x {(item.price / 100).toLocaleString()}đ
                    </p>
                    {item.note && (
                      <p className="text-xs text-gray-500 italic mt-1 bg-gray-50 rounded px-2 py-1">
                        {item.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total - Fixed at bottom */}
            <div className="p-5 bg-white border-t-2 border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">
                  Tổng cộng:
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {totalAmount.toLocaleString()}đ
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Payment Input */}
          <div className="w-3/5 flex flex-col">
            {/* Main Content - No Scroll */}
            <div className="flex-1 p-6 flex flex-col justify-between">
              {/* Top Section */}
              <div className="space-y-5">
                {/* Total Display */}
                <div className="text-center py-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-1 border-blue-100">
                  <p className="text-xs text-gray-600 mb-2 font-medium uppercase tracking-wide">
                    Số tiền thanh toán
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalAmount.toLocaleString()}
                    <span className="text-lg ml-1">đ</span>
                  </p>
                </div>

                {/* Custom Amount Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Tiền khách đưa
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={
                        amountReceived
                          ? parseFloat(amountReceived).toLocaleString()
                          : ""
                      }
                      onChange={handleAmountChange}
                      placeholder="Nhập số tiền"
                      disabled={isProcessing}
                      className="w-full h-16 pl-5 pr-14 text-xl font-bold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-400 placeholder:font-normal"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">
                      đ
                    </div>
                  </div>
                </div>

                {/* Quick Amount Selection - 2x2 Grid */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Chọn nhanh
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {quickAmounts.map((amount, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickAmount(amount)}
                        disabled={isProcessing}
                        className={`h-12 rounded-lg font-bold text-base transition-all ${
                          amountReceived === amount.toString()
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                        } disabled:opacity-50`}
                      >
                        {amount.toLocaleString()}đ
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Section - Change Display */}
              <div className="space-y-3 mt-3">
                {/* Change Display */}
                {change > 0 && (
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-300 rounded-xl p-2 flex justify-between items-center">
                    <p className="text-sm font-medium text-emerald-700 uppercase">
                      Tiền thừa trả khách:
                    </p>
                    <p className="text-lg font-bold text-emerald-600">
                      {change.toLocaleString()}đ
                    </p>
                  </div>
                )}

                {/* Insufficient Amount Warning */}
                {change < 0 && amountReceived && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-bold text-lg">!</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-700 uppercase">
                        Số tiền chưa đủ
                      </p>
                      <p className="text-lg font-bold text-red-600">
                        Thiếu: {Math.abs(change).toLocaleString()}đ
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="p-5 border-t bg-gray-50 flex-shrink-0 space-y-2">
              <button
                onClick={onConfirm}
                disabled={!canConfirm || isProcessing}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-gray-300 text-white rounded-xl font-bold text-base disabled:cursor-not-allowed transition-all shadow-md"
              >
                {isProcessing ? "Đang xử lý..." : "✓ Xác nhận thanh toán"}
              </button>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="w-full h-10 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold border-2 border-gray-200 disabled:opacity-50 transition-colors text-sm"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

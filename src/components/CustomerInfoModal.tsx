import React, { useState } from "react";
import { X, User, Phone, Loader2 } from "lucide-react";

interface CustomerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (phone: string, fullName: string) => Promise<void>;
  onSkip: () => void;
  isProcessing?: boolean;
}

export const CustomerInfoModal: React.FC<CustomerInfoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSkip,
  isProcessing = false,
}) => {
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");

  const validatePhone = (phoneNumber: string) => {
    // Vietnam phone number validation: 10 digits, starts with 0
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handleSubmit = async () => {
    setError("");

    // Validation
    if (!phone.trim()) {
      setError("Vui lòng nhập số điện thoại");
      return;
    }

    if (!validatePhone(phone)) {
      setError("Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)");
      return;
    }

    if (!fullName.trim()) {
      setError("Vui lòng nhập họ tên");
      return;
    }

    if (fullName.trim().length < 2) {
      setError("Họ tên phải có ít nhất 2 ký tự");
      return;
    }

    try {
      await onSubmit(phone.trim(), fullName.trim());
      // Reset form sau khi thành công
      setPhone("");
      setFullName("");
      setError("");
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Chỉ cho phép số
    if (value.length <= 10) {
      setPhone(value);
      setError("");
    }
  };

  const handleSkip = () => {
    setPhone("");
    setFullName("");
    setError("");
    onSkip();
  };

  const handleClose = () => {
    if (!isProcessing) {
      setPhone("");
      setFullName("");
      setError("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Thông tin tích điểm</h2>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              💡 Nhập thông tin để tích điểm và nhận ưu đãi cho lần mua sau!
            </p>
          </div>

          {/* Phone Input */}
          <div className="mb-4">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="0912345678"
                disabled={isProcessing}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Full Name Input */}
          <div className="mb-4">
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setError("");
                }}
                placeholder="Nguyễn Văn A"
                disabled={isProcessing}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSkip}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Bỏ qua
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                "Xác nhận"
              )}
            </button>
          </div>

          {/* Skip Note */}
          <p className="text-xs text-gray-500 text-center mt-3">
            Bỏ qua nếu bạn không muốn tích điểm
          </p>
        </div>
      </div>
    </div>
  );
};

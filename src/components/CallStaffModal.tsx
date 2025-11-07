import React from "react";
import {
  IconPayment,
  IconUtensils,
  IconQuestion,
  IconOther,
} from "@/components/Icons";

interface CallStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (reason: string) => void;
  tableInfo?: { tableNumber?: string; section?: string };
}

const callOptions = [
  { title: "Thanh toán", icon: <IconPayment /> },
  { title: "Thêm chén bát, dao nĩa", icon: <IconUtensils /> },
  { title: "Thắc mắc về món", icon: <IconQuestion /> },
  { title: "Khác", icon: <IconOther /> },
];

export const CallStaffModal: React.FC<CallStaffModalProps> = ({
  isOpen,
  onClose,
  onSelectOption,
  tableInfo,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900 text-center mb-5">
          Bạn cần hỗ trợ gì?
        </h2>
        <div className="space-y-3 mb-6">
          {callOptions.map((option) => (
            <button
              key={option.title}
              onClick={() => onSelectOption(option.title)}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-lg text-gray-800 font-semibold text-left hover:bg-gray-100 transition-colors"
            >
              {option.icon}
              <span>{option.title}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-white text-gray-800 font-semibold py-3 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
        >
          Hủy
        </button>
      </div>
    </div>
  );
};

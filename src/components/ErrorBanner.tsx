import React from "react";
import { AlertCircle, X } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onDismiss,
}) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-red-700 font-medium">{message}</p>
    </div>
    <button
      className="h-6 w-6 -mr-1 hover:bg-red-100 rounded flex items-center justify-center"
      onClick={onDismiss}
    >
      <X className="h-4 w-4 text-red-500" />
    </button>
  </div>
);

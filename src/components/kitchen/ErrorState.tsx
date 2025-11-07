import React from 'react';

interface ErrorStateProps {
    error: string;
    onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center text-red-600">
                <p>Lỗi: {error}</p>
                <button 
                    onClick={onRetry}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Thử lại
                </button>
            </div>
        </div>
    );
};
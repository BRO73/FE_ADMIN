import React from 'react';

export const LoadingState: React.FC = () => {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Đang tải dữ liệu bếp...</p>
            </div>
        </div>
    );
};
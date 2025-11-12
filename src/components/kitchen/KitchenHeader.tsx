import React from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, Settings, Bell, MoreVertical } from "lucide-react";
import { TabKey } from '@/types/kitchen';

interface KitchenHeaderProps {
    activeTab: TabKey;
    setActiveTab: (tab: TabKey) => void;
}

export const KitchenHeader: React.FC<KitchenHeaderProps> = ({ activeTab, setActiveTab }) => {
    return (
        <header className="bg-[#01408d] text-white shadow-md">
            <div className="flex w-full">
                {/* Cột trái - Chờ chế biến - Chiếm 50% */}
                <div className="w-1/2 px-4 py-2 flex items-center justify-between">
                    <h1 className="text-xl font-semibold whitespace-nowrap">Chờ chế biến</h1>
                    <nav className="flex gap-1 bg-white/10 rounded-lg p-1">
                        <Button 
                            variant="ghost" 
                            className={`font-medium text-sm px-3 py-1 rounded-md ${
                                activeTab === "priority" 
                                    ? "bg-white text-[#01408d]" 
                                    : "text-white/90 hover:bg-white/10"
                            }`}
                            onClick={() => setActiveTab("priority")}
                        >
                            Ưu tiên
                        </Button>
                        <Button 
                            variant="ghost" 
                            className={`font-medium text-sm px-3 py-1 rounded-md ${
                                activeTab === "byDish" 
                                    ? "bg-white text-[#01408d]" 
                                    : "text-white/90 hover:bg-white/10"
                            }`}
                            onClick={() => setActiveTab("byDish")}
                        >
                            Theo món
                        </Button>
                        <Button 
                            variant="ghost" 
                            className={`font-medium text-sm px-3 py-1 rounded-md ${
                                activeTab === "byTable" 
                                    ? "bg-white text-[#01408d]" 
                                    : "text-white/90 hover:bg-white/10"
                            }`}
                            onClick={() => setActiveTab("byTable")}
                        >
                            Theo phòng/bàn
                        </Button>
                    </nav>
                </div>
                
                {/* Cột phải - Đã xong/Chờ cung ứng - Chiếm 50% */}
                <div className="w-1/2 px-4 py-2 flex items-center justify-between">
                    <h2 className="text-xl font-semibold whitespace-nowrap">Đã xong/Chờ cung ứng</h2>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-white hover:bg-white/20 h-8 w-8"
                        >
                            <Volume2 className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-white hover:bg-white/20 h-8 w-8"
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-white hover:bg-white/20 h-8 w-8"
                        >
                            <Bell className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-white hover:bg-white/20 h-8 w-8"
                        >
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
};
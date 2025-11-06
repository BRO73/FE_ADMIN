import React from 'react';
import { GroupDish } from '@/types/kitchen';

interface ByDishTabProps {
    byDish: GroupDish[];
    formatTimeAgo: (isoString: string) => string;
}

export const ByDishTab: React.FC<ByDishTabProps> = ({ byDish, formatTimeAgo }) => {
    return (
        <div className="p-6 space-y-4">
            {byDish.map((group) => (
                <div
                    key={group.key}
                    className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="font-bold text-xl">{group.name}</div>
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">{group.totalQty}</span>
                        </div>
                    </div>
                    {group.notes && (
                        <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md mb-3">
                            📝 {group.notes}
                        </div>
                    )}
                    <div className="space-y-2">
                        {group.items.map((ticket) => (
                            <div key={ticket.orderDetailId} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                                <div>
                                    <div className="font-medium">Bàn {ticket.tableNumber}</div>
                                    <div className="text-sm text-muted-foreground">×{ticket.quantity}</div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {formatTimeAgo(ticket.orderedAt || '')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
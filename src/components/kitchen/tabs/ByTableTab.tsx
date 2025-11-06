import React from 'react';
import { GroupTable } from '@/types/kitchen';

interface ByTableTabProps {
    byTable: GroupTable[];
    formatTimeAgo: (isoString: string) => string;
}

export const ByTableTab: React.FC<ByTableTabProps> = ({ byTable, formatTimeAgo }) => {
    return (
        <div className="p-6 space-y-4">
            {byTable.map((group) => (
                <div
                    key={group.key}
                    className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all"
                >
                    <div className="font-bold text-xl mb-3">Bàn {group.table}</div>
                    <div className="space-y-2">
                        {group.items.map((ticket) => (
                            <div key={ticket.orderDetailId} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">{ticket.quantity}</span>
                                    </div>
                                    <div>
                                        <div className="font-medium">{ticket.dishName}</div>
                                        {ticket.notes && (
                                            <div className="text-xs text-amber-600">📝 {ticket.notes}</div>
                                        )}
                                    </div>
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
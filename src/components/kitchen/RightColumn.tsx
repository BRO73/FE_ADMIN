// RightColumn component
import React from 'react';
import { OrderCard } from '@/components/ui/OrderCard';
import { KitchenTicket } from '@/types/kitchen';

interface RightColumnProps {
    ready: KitchenTicket[];
    newReady: Record<number, true>;
    isUnavailable: (menuItemId?: number) => boolean;
    formatTimeAgo: (isoString: string) => string;
    onRollback: (ticket: KitchenTicket) => void;
    serveOneUnit: (orderDetailId: number) => void;
}

export const RightColumn: React.FC<RightColumnProps> = ({
    ready,
    newReady,
    isUnavailable,
    formatTimeAgo,
    onRollback,
    serveOneUnit,
}) => {
    return (
        <div className="bg-white h-full overflow-y-auto">
            <div className="p-4 space-y-3">
                {ready
                    .slice()
                    .sort((a, b) => {
                        const ta = a.orderedAt ? Date.parse(a.orderedAt) : 0;
                        const tb = b.orderedAt ? Date.parse(b.orderedAt) : 0;
                        return tb - ta;
                    })
                    .map((ticket) => (
                        <OrderCard
                            key={`r-${ticket.orderDetailId}`}
                            ticket={ticket}
                            type="ready"
                            highlightNew={newReady[ticket.orderDetailId]}
                            outOfStock={isUnavailable(ticket.menuItemId)}
                            timeAgo={formatTimeAgo(ticket.orderedAt || '')}
                            onRollback={onRollback}
                            onServeOneUnit={serveOneUnit}
                        />
                    ))}
            </div>
        </div>
    );
};
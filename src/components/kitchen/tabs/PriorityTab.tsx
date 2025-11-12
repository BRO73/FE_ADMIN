import React from 'react';
import { OrderCard } from '@/components/ui/OrderCard';
import { KitchenTicket } from '@/types/kitchen';
import { isPending, isInProgress } from '@/utils/kitchenHelper';

interface PriorityTabProps {
    priorityList: KitchenTicket[];
    newWork: Record<number, true>;
    rollbackWork: Record<number, true>;
    isUnavailable: (menuItemId?: number) => boolean;
    formatTimeAgo: (isoString: string) => string;
    completeOneUnit: (orderDetailId: number) => void;
    completeAllUnits: (orderDetailId: number) => void;
    cancelOutOfStock: (ticket: KitchenTicket) => void;
}

export const PriorityTab: React.FC<PriorityTabProps> = ({
    priorityList,
    newWork,
    rollbackWork,
    isUnavailable,
    formatTimeAgo,
    completeOneUnit,
    completeAllUnits,
    cancelOutOfStock,
}) => {
    return (
        <div className="p-6 space-y-4">
            {priorityList.map((ticket) => (
                <OrderCard
                    key={`p-${ticket.orderDetailId}`}
                    ticket={ticket}
                    type="pending"
                    highlightNew={newWork[ticket.orderDetailId]}
                    highlightRollback={rollbackWork[ticket.orderDetailId]}
                    outOfStock={isUnavailable(ticket.menuItemId)}
                    timeAgo={formatTimeAgo(ticket.orderedAt || '')}
                    onCompleteOneUnit={completeOneUnit}
                    onCompleteAllUnits={completeAllUnits}
                    onCancelOutOfStock={cancelOutOfStock}
                />
            ))}
        </div>
    );
};
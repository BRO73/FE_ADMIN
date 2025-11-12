import React from 'react';
import { TabKey, KitchenTicket, GroupDish, GroupTable } from '@/types/kitchen';
import { PriorityTab } from './tabs/PriorityTab';
import { ByDishTab } from './tabs/ByDishTab';
import { ByTableTab } from './tabs/ByTableTab';

interface LeftColumnProps {
    activeTab: TabKey;
    priorityList: KitchenTicket[];
    byDish: GroupDish[];
    byTable: GroupTable[];
    newWork: Record<number, true>;
    rollbackWork: Record<number, true>;
    isUnavailable: (menuItemId?: number) => boolean;
    formatTimeAgo: (isoString: string) => string;
    completeOneUnit: (orderDetailId: number) => void;
    completeAllUnits: (orderDetailId: number) => void;
    cancelOutOfStock: (ticket: KitchenTicket) => void;
}

export const LeftColumn: React.FC<LeftColumnProps> = ({
    activeTab,
    priorityList,
    byDish,
    byTable,
    newWork,
    rollbackWork,
    isUnavailable,
    formatTimeAgo,
    completeOneUnit,
    completeAllUnits,
    cancelOutOfStock,
}) => {
    const renderTabContent = () => {
        switch (activeTab) {
            case "priority":
                return (
                    <PriorityTab
                        priorityList={priorityList}
                        newWork={newWork}
                        rollbackWork={rollbackWork}
                        isUnavailable={isUnavailable}
                        formatTimeAgo={formatTimeAgo}
                        completeOneUnit={completeOneUnit}
                        completeAllUnits={completeAllUnits}
                        cancelOutOfStock={cancelOutOfStock}
                    />
                );
            case "byDish":
                return <ByDishTab byDish={byDish} formatTimeAgo={formatTimeAgo} />;
            case "byTable":
                return <ByTableTab byTable={byTable} formatTimeAgo={formatTimeAgo} />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-card overflow-y-auto">
            {renderTabContent()}
        </div>
    );
};
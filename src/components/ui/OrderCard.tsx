// OrderCard component (đã sửa với màu sắc cụ thể)
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronsRight, Undo2, Star } from "lucide-react";
import { KitchenTicket } from '@/types/kitchen';

interface OrderCardProps {
    ticket: KitchenTicket;
    type: 'pending' | 'ready';
    highlightNew?: boolean;
    highlightRollback?: boolean;
    outOfStock: boolean;
    timeAgo: string;
    orderTime?: string;
    orderedBy?: string;
    onCompleteOneUnit?: (orderDetailId: number) => void;
    onCompleteAllUnits?: (orderDetailId: number) => void;
    onCancelOutOfStock?: (ticket: KitchenTicket) => void;
    onRollback?: (ticket: KitchenTicket) => void;
    onServeOneUnit?: (orderDetailId: number) => void;
    onServeAllUnits?: (orderDetailId: number) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
    ticket,
    type,
    highlightNew,
    highlightRollback,
    outOfStock,
    timeAgo,
    orderTime,
    orderedBy,
    onCompleteOneUnit,
    onCompleteAllUnits,
    onCancelOutOfStock,
    onRollback,
    onServeOneUnit,
    onServeAllUnits,
}) => {
    const isPending = type === 'pending';

    return (
        <div className={[
            "bg-white px-4 py-3 flex items-center gap-4",
            outOfStock
                ? "bg-red-50"
                : highlightRollback
                    ? "bg-amber-50"
                    : highlightNew
                        ? "bg-emerald-50"
                        : "",
        ].join(" ")}>
            {/* Cột 1: Tên món và ghi chú - chiếm nhiều không gian nhất */}
            <div className="flex-1 min-w-0">
                <div className={[
                    "font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis",
                    outOfStock ? "text-red-600" : highlightRollback ? "text-amber-600" : "text-gray-900"
                ].join(" ")}>
                    {ticket.dishName}
                </div>
                {ticket.notes && (
                    <div className="text-xs text-amber-700 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                        Ghi chú: "{ticket.notes}"
                    </div>
                )}
            </div>

            {/* Cột 2: Số lượng với ngôi sao vàng */}
            <div className="flex items-center gap-1 w-16 justify-center flex-shrink-0">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="font-bold text-lg">{ticket.quantity}</span>
            </div>

            {/* Cột 3: Thông tin bàn và thời gian - căn trái */}
            <div className="w-28 text-left flex-shrink-0">
                <div className="text-sm font-medium whitespace-nowrap">
                    Bàn {ticket.tableNumber}
                </div>
                <div className="text-sm text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">
                    {timeAgo}
                </div>
            </div>

            {/* Cột 4: Các nút hành động */}
            <div className="flex justify-end gap-1 w-32 flex-shrink-0">
                {isPending ? (
                    outOfStock ? (
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 px-3 text-xs font-medium whitespace-nowrap"
                            onClick={() => onCancelOutOfStock?.(ticket)}
                        >
                            Hủy món
                        </Button>
                    ) : (
                        <div className="flex items-center gap-1">
                            {highlightRollback && (
                                <Badge className="bg-amber-500 hover:bg-amber-500 font-medium px-1.5 py-0 text-xs whitespace-nowrap">ROLLBACK</Badge>
                            )}
                            {highlightNew && !highlightRollback && (
                                <Badge className="bg-emerald-500 hover:bg-emerald-500 font-medium px-1.5 py-0 text-xs whitespace-nowrap">MỚI</Badge>
                            )}
                            
                            {(ticket.status === 'PENDING' || ticket.status === 'IN_PROGRESS') && !outOfStock && (
                                <>
                                    {/* Luôn hiển thị nút > ngay cả khi quantity = 1 */}
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="rounded-full border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white h-8 w-8 flex-shrink-0"
                                        onClick={() => onCompleteOneUnit?.(ticket.orderDetailId)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        className="rounded-full bg-pink-500 hover:bg-pink-600 text-white h-8 w-8 flex-shrink-0"
                                        onClick={() => onCompleteAllUnits?.(ticket.orderDetailId)}
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    )
                ) : (
                    // READY state - có cả nút ">" và ">>" và rollback được bố cục lại
                    <div className="flex items-center gap-1">
                        {/* Nút rollback - đặt riêng biệt với màu đặc trưng */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white h-8 w-8 flex-shrink-0"
                            onClick={() => onRollback?.(ticket)}
                        >
                            <Undo2 className="h-4 w-4" />
                        </Button>
                        
                        {/* Nhóm nút serve với màu xanh lá */}
                        <div className="flex items-center gap-1">
                            {/* Luôn hiển thị nút > ngay cả khi quantity = 1 */}
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full border-green-500 text-green-500 hover:bg-green-500 hover:text-white h-8 w-8 flex-shrink-0"
                                onClick={() => onServeOneUnit?.(ticket.orderDetailId)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                className="rounded-full bg-green-500 hover:bg-green-600 text-white h-8 w-8 flex-shrink-0"
                                onClick={() => onServeAllUnits?.(ticket.orderDetailId)}
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
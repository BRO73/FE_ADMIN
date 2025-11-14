import React, { useEffect, useMemo, useState } from "react";
import { TabKey, KitchenTicket, GroupDish, GroupTable } from "@/types/kitchen";
import { PriorityTab } from "./tabs/PriorityTab";
import { ByDishTab } from "./tabs/ByDishTab";
import { ByTableTab } from "./tabs/ByTableTab";

import {
  fetchAllMenuItemsLite,
  setMenuAvailability,
  type MenuItemLite,
} from "@/api/menuAvailability.api";

import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Loader2, RefreshCcw, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

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
  // state dùng chung với RightColumn
  availabilityMap: Record<number, boolean>;
  setAvailabilityMap: React.Dispatch<
    React.SetStateAction<Record<number, boolean>>
  >;
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
  availabilityMap,
  setAvailabilityMap,
}) => {
  /* ====== State riêng cho slide bar ====== */
  const [showAvailability, setShowAvailability] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItemLite[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");

  const loadAvailability = async (): Promise<void> => {
    try {
      const list = await fetchAllMenuItemsLite();
      const m: Record<number, boolean> = {};
      for (const it of list) m[it.id] = it.available;
      setAvailabilityMap(m);
      setMenuItems(list);
    } catch {
      // lỗi sẽ được báo khi người dùng mở slide và ấn toggle/refresh
    }
  };

  const reloadMenuItems = async (): Promise<void> => {
    setMenuLoading(true);
    try {
      await loadAvailability();
    } finally {
      setMenuLoading(false);
    }
  };

  const toggleAvailability = async (
    id: number,
    next: boolean
  ): Promise<void> => {
    try {
      await setMenuAvailability(id, next);
      setMenuItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, available: next } : x))
      );
      setAvailabilityMap((prev) => ({ ...prev, [id]: next }));
      toast({ title: next ? "Đã bật món" : "Đã tắt món" });
    } catch {
      toast({ variant: "destructive", title: "Cập nhật trạng thái thất bại" });
    }
  };

  const filteredMenuItems = useMemo(() => {
    const s = menuSearch.trim().toLowerCase();
    if (!s) return menuItems;
    return menuItems.filter((x) => x.name.toLowerCase().includes(s));
  }, [menuItems, menuSearch]);

  // tự load 1 lần cho chắc
  useEffect(() => {
    void loadAvailability();
  }, []);

  // khi tab browser quay lại
  useEffect(() => {
    const onFocus = () => {
      void loadAvailability();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

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
    <div className="bg-card h-full overflow-y-auto">
      {/* Nút nằm dưới “Chờ chế biến” (ở phần cột trái) */}
      {activeTab === "priority" && (
        <div className="flex justify-end px-4 pt-4 pb-2">
          <Button
            size="sm"
            variant="outline"
            className="shadow-sm"
            onClick={() => setShowAvailability(true)}
          >
            <UtensilsCrossed className="mr-2 h-4 w-4" />
            Trạng thái món
          </Button>
        </div>
      )}

      {renderTabContent()}

      {/* Slide bar Menu Availability – ở đây luôn, không trong KitchenDashboardPage nữa */}
      {showAvailability && (
        <div className="fixed inset-0 z-50 flex pointer-events-none">
          {/* overlay */}
          <div
            className="flex-1 bg-black/40 pointer-events-auto"
            onClick={() => setShowAvailability(false)}
          />
          {/* panel */}
          <div className="pointer-events-auto w-full max-w-xl h-full bg-background border-l shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                <h2 className="text-lg font-semibold">Menu availability</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAvailability(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-auto">
              <div className="flex items-center justify-between gap-2">
                <Input
                  placeholder="Tìm theo tên món..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void reloadMenuItems()}
                  disabled={menuLoading}
                >
                  {menuLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="mr-2 h-4 w-4" />
                  )}
                  Làm mới
                </Button>
              </div>

              <Card className="border-none shadow-none">
                <CardHeader className="px-0 pt-0 pb-2">
                  <CardTitle className="text-base">Tất cả món</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Tên món</TableHead>
                        <TableHead>Giá</TableHead>
                        <TableHead className="text-right">Có bán</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMenuItems.map((x) => (
                        <TableRow key={x.id}>
                          <TableCell>{x.id}</TableCell>
                          <TableCell>{x.name}</TableCell>
                          <TableCell>
                            {x.price.toLocaleString("vi-VN")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Switch
                              checked={x.available}
                              onCheckedChange={(v) =>
                                void toggleAvailability(x.id, v)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

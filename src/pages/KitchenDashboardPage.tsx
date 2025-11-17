// src/pages/KitchenDashboardPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useKitchen } from "../hooks/useKitchen";
import {
  fetchAllMenuItemsLite,
  setMenuAvailability,
  type MenuItemLite,
} from "../api/menuAvailability.api";

import { KitchenHeader } from "../components/kitchen/KitchenHeader";
import { LoadingState } from "../components/kitchen/LoadingState";
import { ErrorState } from "../components/kitchen/ErrorState";
import { LeftColumn } from "../components/kitchen/LeftColumn";
import { RightColumn } from "../components/kitchen/RightColumn";

import {
  TabKey,
  KitchenTicket,
  TicketsShape,
  GroupDish,
  GroupTable,
} from "../types/kitchen";
import {
  HIGHLIGHT_MS,
  formatTimeAgo,
  formatDisplayDate,
  canCancel,
  confirmCancel,
  isPending,
  isInProgress,
} from "@/utils/kitchenHelper";

// ✨ UI cho slide Menu Availability
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
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, UtensilsCrossed, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function KitchenDashboardPage(): JSX.Element {
  const {
    loading,
    error,
    tickets,
    connected,
    updateStatus,
    refresh,
    completeOneUnit,
    completeAllUnits,
    serveOneUnit,
    serverNowMs,
  } = useKitchen({ intervalMs: 3000 });

  const tks = tickets as TicketsShape;
  const EMPTY = useRef<KitchenTicket[]>([]).current;
  const pending: KitchenTicket[] = Array.isArray(tks?.pending)
    ? (tks!.pending as KitchenTicket[])
    : EMPTY;
  const working: KitchenTicket[] = Array.isArray(tks?.inProgress)
    ? (tks!.inProgress as KitchenTicket[])
    : EMPTY;

  const ready: KitchenTicket[] = useMemo(() => {
    const hasReadyToServe =
      tks &&
      typeof tks === "object" &&
      "readyToServe" in tks &&
      Array.isArray((tks as { readyToServe?: unknown }).readyToServe);
    if (hasReadyToServe) {
      return ((tks as { readyToServe?: KitchenTicket[] }).readyToServe ??
        []) as KitchenTicket[];
    }
    const hasReady =
      tks &&
      typeof tks === "object" &&
      "ready" in tks &&
      Array.isArray((tks as { ready?: unknown }).ready);
    return hasReady
      ? (((tks as { ready?: KitchenTicket[] }).ready ?? []) as KitchenTicket[])
      : [];
  }, [tks]);

  const [activeTab, setActiveTab] = useState<TabKey>("priority");
  const [q, setQ] = useState<string>("");

  /* ======= Availability (hết hàng) ======= */
  const [availabilityMap, setAvailabilityMap] = useState<
    Record<number, boolean>
  >({});

  // dữ liệu đầy đủ cho slide bar
  const [menuItems, setMenuItems] = useState<MenuItemLite[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");

  const [showAvailability, setShowAvailability] = useState(false);

  const loadAvailability = async (): Promise<void> => {
    try {
      const list = await fetchAllMenuItemsLite();
      const m: Record<number, boolean> = {};
      for (const it of list) m[it.id] = it.available;
      setAvailabilityMap(m);
      setMenuItems(list); // dùng cho slide bar
    } catch {
      // trong board thì im lặng, lỗi sẽ hiển thị ở slide
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

  useEffect(() => {
    void loadAvailability();
  }, []);

  useEffect(() => {
    const onFocus = () => {
      void loadAvailability();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    void onRefreshAll();
  }, []);

  useEffect(() => {
    if (showAvailability && menuItems.length === 0) {
      void reloadMenuItems();
    }
  }, [showAvailability, menuItems.length]);

  const isUnavailable = (menuItemId?: number): boolean =>
    typeof menuItemId === "number" && availabilityMap[menuItemId] === false;

  /* ======= Hiệu ứng highlight ======= */
  const [newWork, setNewWork] = useState<Record<number, true>>({});
  const [newReady, setNewReady] = useState<Record<number, true>>({});
  const [rollbackWork, setRollbackWork] = useState<Record<number, true>>({});

  const prevWorkIds = useRef<Set<number>>(new Set());
  const prevReadyIds = useRef<Set<number>>(new Set());

  const addTemp = (
    setter: React.Dispatch<React.SetStateAction<Record<number, true>>>,
    id: number
  ): void => {
    setter((prev) => ({ ...prev, [id]: true }));
    window.setTimeout(() => {
      setter((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }, HIGHLIGHT_MS);
  };

  useEffect(() => {
    const curr = new Set<number>(
      [...pending, ...working].map((t) => t.orderDetailId)
    );
    curr.forEach((id) => {
      if (!prevWorkIds.current.has(id)) addTemp(setNewWork, id);
    });
    prevWorkIds.current = curr;
  }, [pending, working]);

  useEffect(() => {
    const curr = new Set<number>(ready.map((t) => t.orderDetailId));
    curr.forEach((id) => {
      if (!prevReadyIds.current.has(id)) addTemp(setNewReady, id);
    });
    prevReadyIds.current = curr;
  }, [ready]);

  /* ======= Actions ======= */

  /* ====================================================================
    ✨✨✨ ĐÃ SỬA LỖI Ở ĐÂY ✨✨✨
    
    Xóa 'await onRefreshAll()' vì 'updateStatus' đã được
    backend xử lý và gửi WebSocket về.
    ====================================================================
    */
    const onRollback = async (t: KitchenTicket): Promise<void> => {
        addTemp(setRollbackWork, t.orderDetailId);
        try {
            // rollback: DONE -> PENDING
            await updateStatus(t.orderDetailId, "PENDING");
        } catch {
            setRollbackWork((prev) => {
                const { [t.orderDetailId]: _, ...rest } = prev;
                return rest;
            });
        }
    };


    const onRefreshAll = async (): Promise<void> => {
    await Promise.allSettled([refresh(), loadAvailability()]);
  };

  /* ====================================================================
    ✨✨✨ ĐÃ SỬA LỖI TƯƠNG TỰ Ở ĐÂY ✨✨✨
    ====================================================================
    */
  const cancelOutOfStock = async (t: KitchenTicket): Promise<void> => {
    const ok = window.confirm("Món đã HẾT. Bạn có muốn HỦY vé này khỏi bếp?");
    if (!ok) return;
    await updateStatus(t.orderDetailId, "CANCELED");
    // await onRefreshAll(); // <-- ĐÃ XÓA
  };

  /* ======= Filter & Grouping ======= */
  const matchQ = (s?: string): boolean =>
    q ? (s || "").toLowerCase().includes(q.toLowerCase()) : true;

  const priorityList: KitchenTicket[] = useMemo(() => {
    const all: KitchenTicket[] = [...pending, ...working];
    all.sort((a, b) => {
      const ta = a.orderedAt ? Date.parse(a.orderedAt) : 0;
      const tb = b.orderedAt ? Date.parse(b.orderedAt) : 0;
      if (ta !== tb) return ta - tb;
      return (a.orderDetailId || 0) - (b.orderDetailId || 0);
    });
    return all.filter((t) => matchQ(t.dishName) || matchQ(t.tableNumber));
  }, [pending, working, q]);

  const byDish: GroupDish[] = useMemo(() => {
    const all: KitchenTicket[] = [...pending, ...working];
    const groups = new Map<
      string,
      {
        key: string;
        name: string;
        notes?: string | null;
        items: KitchenTicket[];
      }
    >();
    for (const t of all) {
      if (!(matchQ(t.dishName) || matchQ(t.tableNumber))) continue;
      const notesKey = (t.notes || "").trim().toLowerCase();
      const key = `${t.dishName}__${notesKey}`;
      if (!groups.has(key))
        groups.set(key, { key, name: t.dishName, notes: t.notes, items: [] });
      groups.get(key)!.items.push(t);
    }
    const list: GroupDish[] = Array.from(groups.values()).map((g) => {
      const earliest =
        g.items
          .map((i) => (i.orderedAt ? Date.parse(i.orderedAt) : 0))
          .sort((a, b) => a - b)[0] ?? 0;
      return {
        ...g,
        earliest,
        totalQty: g.items.reduce((s, i) => s + (i.quantity ?? 0), 0),
      };
    });
    list.sort((a, b) => a.earliest - b.earliest);
    return list;
  }, [pending, working, q]);

  const byTable: GroupTable[] = useMemo(() => {
    const all: KitchenTicket[] = [...pending, ...working];
    const groups = new Map<string, GroupTable>();
    for (const t of all) {
      const table = t.tableNumber || "N/A";
      if (!(matchQ(t.dishName) || matchQ(table))) continue;
      if (!groups.has(table))
        groups.set(table, { key: table, table, items: [] });
      groups.get(table)!.items.push(t);
    }
    const list: GroupTable[] = Array.from(groups.values()).map((g) => {
      g.items.sort((a, b) => {
        const ta = a.orderedAt ? Date.parse(a.orderedAt) : 0;
        const tb = b.orderedAt ? Date.parse(b.orderedAt) : 0;
        return ta - tb;
      });
      return g;
    });
    list.sort((a, b) => a.table.localeCompare(b.table, "vi"));
    return list;
  }, [pending, working, q]);

  /* ======= firstSeenAt ======= */
  const [firstSeenAt, setFirstSeenAt] = useState<Record<number, number>>({});

  useEffect(() => {
    if (pending.length === 0 && working.length === 0) return;

    const now = serverNowMs;
    setFirstSeenAt((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const t of pending) {
        const id = t.orderDetailId;
        if (id != null && next[id] == null) {
          next[id] = now;
          changed = true;
        }
      }
      for (const t of working) {
        const id = t.orderDetailId;
        if (id != null && next[id] == null) {
          next[id] = now;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [pending, working, serverNowMs]);

  // Helper function for time formatting
  const getFormatTimeAgo = (isoString: string) =>
    formatTimeAgo(isoString, serverNowMs);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRefreshAll} />;
  }

  return (
    <div className="relative min-h-screen bg-background">
      <KitchenHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Layout với khoảng trống và bo tròn rõ ràng */}
      <div className="flex min-h-[calc(100vh-64px)] bg-[#01408d]">
        {/* Cột trái với bo tròn bên phải và nền trắng */}
        <div className="flex-1 bg-card rounded-r-xl mr-3 overflow-hidden">
          <LeftColumn
            activeTab={activeTab}
            priorityList={priorityList}
            byDish={byDish}
            byTable={byTable}
            newWork={newWork}
            rollbackWork={rollbackWork}
            isUnavailable={isUnavailable}
            formatTimeAgo={getFormatTimeAgo}
            completeOneUnit={completeOneUnit}
            completeAllUnits={completeAllUnits}
            cancelOutOfStock={cancelOutOfStock}
            availabilityMap={availabilityMap}
            setAvailabilityMap={setAvailabilityMap}
          />
        </div>

        {/* Cột phải với bo tròn bên trái và nền trắng */}
        <div className="flex-1 bg-card rounded-l-xl ml-3 overflow-hidden">
          <RightColumn
            ready={ready}
            newReady={newReady}
            isUnavailable={isUnavailable}
            formatTimeAgo={getFormatTimeAgo}
            onRollback={onRollback}
            serveOneUnit={serveOneUnit}
          />
        </div>
      </div>
    </div>
  );
}

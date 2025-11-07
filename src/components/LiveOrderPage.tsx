import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { createPaymentLink } from "@/api/payment.api";
import {
  getActiveOrdersByTable,
  createOrder,
  addItemsToOrder,
} from "@/api/order.api";
import {
  ChevronLeft,
  MoreVertical,
  Plus,
  FileText,
  CreditCard,
} from "lucide-react";
import { OrderResponse, OrderDetailRequest } from "@/types/type";
import { ErrorBanner } from "@/components/ErrorBanner";
import { OrderItemCard } from "@/components/OrderItemCard";
import { CallStaffModal } from "@/components/CallStaffModal";
import { PaymentModal } from "@/components/PaymentModal";
import { NoteModal } from "@/components/NoteModal";

type LocalCartItem = {
  menuItemId: number;
  quantity: number;
  name: string;
  price: number;
  note?: string;
};

type LocalCartsState = Record<number, LocalCartItem[]>;

const getStorageKeys = (tableId: number) => ({
  activeOrder: `activeOrderId_table_${tableId}`,
  pendingOrder: `pendingOrderId_table_${tableId}`,
});

// Key for localStorage
const LOCAL_CARTS_STORAGE_KEY = "restaurant_local_carts";

const LiveOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const tableIdFromUrl = params.get("tableId");
  const tableId = tableIdFromUrl ? Number(tableIdFromUrl) : null;
  const storageKeys = tableId ? getStorageKeys(tableId) : null;

  const { cartItems, clearCart } = useCart();

  const [tableIdState, setTableIdState] = useState<number | null>(tableId);
  const [tableName, setTableName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] =
    useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showCallStaffModal, setShowCallStaffModal] = useState<boolean>(false);
  const [editingNoteItem, setEditingNoteItem] = useState<{
    menuItemId: number;
    name: string;
    currentNote?: string;
  } | null>(null);

  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [localCarts, setLocalCarts] = useState<LocalCartsState>({});

  const hasProcessedCartRef = useRef(false);

  // Load localCarts từ localStorage khi component mount
  useEffect(() => {
    const savedLocalCarts = localStorage.getItem(LOCAL_CARTS_STORAGE_KEY);
    if (savedLocalCarts) {
      try {
        const parsedLocalCarts = JSON.parse(savedLocalCarts);
        setLocalCarts(parsedLocalCarts);
      } catch (error) {
        console.error("Error loading localCarts from localStorage:", error);
      }
    }
  }, []);

  // Lưu localCarts vào localStorage mỗi khi localCarts thay đổi
  useEffect(() => {
    localStorage.setItem(LOCAL_CARTS_STORAGE_KEY, JSON.stringify(localCarts));
  }, [localCarts]);

  useEffect(() => {
    if (!tableId || !storageKeys) {
      setError("Không tìm thấy tableId trên URL.");
      setLoading(false);
      return;
    }

    setTableIdState(tableId);
    setTableName(`Bàn ${tableId}`);
    loadOrders(tableId);
  }, [location.search, tableId]);

  const loadOrders = async (id: number) => {
    if (!storageKeys) return;

    try {
      setLoading(true);
      setError(null);

      let loadedOrders = await getActiveOrdersByTable(id);

      if (loadedOrders.length === 0) {
        console.log("Không tìm thấy order, tạo order mới...");
        const newOrder = await createOrder({ tableId: id, items: [] });
        loadedOrders = [newOrder];
      }

      setOrders(loadedOrders);

      const pendingOrderId = sessionStorage.getItem(storageKeys.pendingOrder);
      const savedActiveId = sessionStorage.getItem(storageKeys.activeOrder);

      let targetOrderId: number | null = null;

      if (pendingOrderId) {
        const pendingId = parseInt(pendingOrderId, 10);
        if (loadedOrders.some((o) => o.id === pendingId)) {
          targetOrderId = pendingId;
          console.log(`✅ Sử dụng pendingOrderId: ${pendingId}`);
        }
        sessionStorage.removeItem(storageKeys.pendingOrder);
      }

      if (!targetOrderId && savedActiveId) {
        const savedId = parseInt(savedActiveId, 10);
        if (loadedOrders.some((o) => o.id === savedId)) {
          targetOrderId = savedId;
          console.log(`✅ Sử dụng savedActiveId: ${savedId}`);
        }
      }

      if (!targetOrderId) {
        targetOrderId = loadedOrders[0].id;
        console.log(`✅ Fallback to first order: ${targetOrderId}`);
      }

      setActiveOrderId(targetOrderId);
    } catch (err) {
      console.error("Lỗi khi tải active orders:", err);
      setError("Không thể tải thông tin order của bàn.");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeOrderId && storageKeys) {
      sessionStorage.setItem(storageKeys.activeOrder, activeOrderId.toString());
      console.log(`💾 Saved activeOrderId: ${activeOrderId}`);
    }
  }, [activeOrderId, storageKeys]);

  useEffect(() => {
    if (
      cartItems.length === 0 ||
      !storageKeys ||
      !activeOrderId ||
      orders.length === 0 ||
      hasProcessedCartRef.current
    ) {
      return;
    }

    console.log("🔄 Phát hiện global cart, đang chuyển vào local cart...");
    console.log("📦 Cart items:", cartItems);
    console.log("🎯 Active Order ID:", activeOrderId);

    const pendingOrderId = sessionStorage.getItem(storageKeys.pendingOrder);
    const targetOrderId = pendingOrderId
      ? parseInt(pendingOrderId, 10)
      : activeOrderId;

    console.log("🎯 Target Order ID:", targetOrderId);

    const targetOrderExists = orders.some((o) => o.id === targetOrderId);
    if (!targetOrderExists) {
      console.error(`❌ Order ${targetOrderId} không tồn tại trong danh sách`);
      console.log(
        "📋 Available orders:",
        orders.map((o) => o.id)
      );
      clearCart();
      return;
    }

    console.log(`✅ Transfer cart vào Order: ${targetOrderId}`);

    setLocalCarts((prevLocalCarts) => {
      const newLocalCarts = { ...prevLocalCarts };
      const currentCart = newLocalCarts[targetOrderId] || [];

      for (const item of cartItems) {
        const existingItem = currentCart.find(
          (i) => i.menuItemId === Number(item.id)
        );
        if (existingItem) {
          existingItem.quantity += item.quantity;
          // Giữ nguyên ghi chú nếu có, nếu item mới có ghi chú thì cập nhật
          if (item.note) {
            existingItem.note = item.note;
          }
          console.log(
            `➕ Tăng số lượng ${item.name}: ${existingItem.quantity}`
          );
        } else {
          currentCart.push({
            menuItemId: Number(item.id),
            quantity: item.quantity,
            name: item.name,
            price: item.price,
            note: item.note, // Thêm ghi chú nếu có
          });
          console.log(`🆕 Thêm mới ${item.name}: ${item.quantity}`);
        }
      }

      newLocalCarts[targetOrderId] = currentCart;
      console.log(`✅ Local cart updated:`, newLocalCarts[targetOrderId]);
      return newLocalCarts;
    });

    if (targetOrderId !== activeOrderId) {
      console.log(
        `🔄 Switch active order từ ${activeOrderId} → ${targetOrderId}`
      );
      setActiveOrderId(targetOrderId);
    }

    hasProcessedCartRef.current = true;
    clearCart();

    setTimeout(() => {
      hasProcessedCartRef.current = false;
    }, 1000);
  }, [cartItems, activeOrderId, orders, storageKeys, clearCart]);

  const handleCreateOrder = async () => {
    if (!tableId) return;

    try {
      const newOrder = await createOrder({ tableId, items: [] });
      setOrders([...orders, newOrder]);
      setActiveOrderId(newOrder.id);
    } catch (err) {
      console.error("Lỗi khi tạo order mới:", err);
      setError("Không thể tạo thêm order.");
      setShowError(true);
    }
  };

  const handleSubmitNewItems = async () => {
    if (!tableId || !activeOrderId || isSubmitting) return;

    const itemsToSubmit = localCarts[activeOrderId] || [];
    if (itemsToSubmit.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    const apiItems: OrderDetailRequest[] = itemsToSubmit.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      specialRequirements: item.note || "", // Gửi ghi chú lên server
    }));

    try {
      await addItemsToOrder(activeOrderId, apiItems);

      setLocalCarts((prev) => ({
        ...prev,
        [activeOrderId]: [],
      }));

      await loadOrders(tableId);
    } catch (err) {
      console.error("Lỗi khi gửi đơn hàng:", err);
      setError("Không thể gửi đơn hàng. Vui lòng thử lại.");
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestPayment = async () => {
    console.log("🔔 handleRequestPayment called");
    console.log("Active Order ID:", activeOrderId);
    console.log("Local Cart:", localCarts[activeOrderId]);

    if (!activeOrderId) {
      setError("Vui lòng chọn order để thanh toán.");
      setShowError(true);
      return;
    }

    const currentLocalCart = localCarts[activeOrderId] || [];
    if (currentLocalCart.length > 0) {
      console.log("❌ Còn món chưa gửi thông báo:", currentLocalCart.length);
      setError("Vui lòng gửi thông báo món ăn trước khi thanh toán.");
      setShowError(true);
      return;
    }

    console.log("✅ Hiển thị modal thanh toán");
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!activeOrderId) return;

    setIsProcessingPayment(true);
    setError(null);

    try {
      const currentUrl = window.location.origin;
      const returnUrl = `${currentUrl}/payment-success?orderId=${activeOrderId}&tableId=${tableId}`;
      const cancelUrl = `${currentUrl}/live-order?tableId=${tableId}`;

      const paymentResponse = await createPaymentLink({
        orderId: activeOrderId,
        returnUrl: returnUrl,
        cancelUrl: cancelUrl,
      });

      if (paymentResponse.checkoutUrl) {
        window.location.href = paymentResponse.checkoutUrl;
      } else {
        throw new Error("Không nhận được link thanh toán");
      }
    } catch (err) {
      console.error("Lỗi khi tạo payment link:", err);
      setError("Không thể tạo link thanh toán. Vui lòng thử lại.");
      setShowError(true);
    } finally {
      setIsProcessingPayment(false);
      setShowPaymentModal(false);
    }
  };

  const handleSelectCallOption = (reason: string) => {
    console.log(`Gọi nhân viên vì: ${reason}`);
    setShowCallStaffModal(false);
  };

  // Hàm xử lý mở modal ghi chú
  const handleEditNote = (
    menuItemId: number,
    name: string,
    currentNote?: string
  ) => {
    setEditingNoteItem({ menuItemId, name, currentNote });
  };

  // Hàm lưu ghi chú
  const handleSaveNote = (note: string) => {
    if (!editingNoteItem || !activeOrderId) return;

    setLocalCarts((prevLocalCarts) => {
      const newLocalCarts = { ...prevLocalCarts };
      const currentCart = newLocalCarts[activeOrderId] || [];

      const existingItem = currentCart.find(
        (item) => item.menuItemId === editingNoteItem.menuItemId
      );
      if (existingItem) {
        existingItem.note = note;
      } else {
        // Nếu item chưa có trong local cart, tạo mới
        const displayItem = displayItems.find(
          (item) => item.menuItemId === editingNoteItem.menuItemId
        );
        if (displayItem) {
          currentCart.push({
            menuItemId: editingNoteItem.menuItemId,
            quantity: displayItem.localQty,
            name: editingNoteItem.name,
            price: displayItem.price,
            note: note,
          });
        }
      }

      newLocalCarts[activeOrderId] = currentCart;
      return newLocalCarts;
    });

    setEditingNoteItem(null);
  };

  // Hàm xoá ghi chú
  const handleRemoveNote = () => {
    if (!editingNoteItem || !activeOrderId) return;

    setLocalCarts((prevLocalCarts) => {
      const newLocalCarts = { ...prevLocalCarts };
      const currentCart = newLocalCarts[activeOrderId] || [];

      const existingItem = currentCart.find(
        (item) => item.menuItemId === editingNoteItem.menuItemId
      );
      if (existingItem) {
        delete existingItem.note;
      }

      newLocalCarts[activeOrderId] = currentCart;
      return newLocalCarts;
    });

    setEditingNoteItem(null);
  };

  const displayItems = useMemo(() => {
    if (!activeOrderId) return [];

    const activeOrder = orders.find((o) => o.id === activeOrderId);
    const dbItems = activeOrder ? activeOrder.items : [];
    const localItems = localCarts[activeOrderId] || [];

    type DisplayItem = {
      menuItemId: number;
      name: string;
      price: number;
      dbQty: number;
      localQty: number;
      note?: string;
    };

    const itemMap = new Map<number, DisplayItem>();

    // Add DB items
    for (const item of dbItems) {
      itemMap.set(item.menuItem.id, {
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        price: item.price,
        dbQty: item.quantity,
        localQty: 0,
        note: item.specialRequirements || undefined, // Lấy ghi chú từ DB
      });
    }

    // Add local items
    for (const item of localItems) {
      const existing = itemMap.get(item.menuItemId);
      if (existing) {
        existing.localQty += item.quantity;
        // Ưu tiên ghi chú từ local cart (nếu có)
        if (item.note) {
          existing.note = item.note;
        }
      } else {
        itemMap.set(item.menuItemId, {
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          dbQty: 0,
          localQty: item.quantity,
          note: item.note, // Lấy ghi chú từ local cart
        });
      }
    }

    return Array.from(itemMap.values());
  }, [activeOrderId, orders, localCarts]);

  const handleQuantityChange = (menuItemId: number, totalQuantity: number) => {
    if (!activeOrderId) return;

    const displayItem = displayItems.find((i) => i.menuItemId === menuItemId);
    if (!displayItem) return;

    const dbQty = displayItem.dbQty;
    const newLocalQty = totalQuantity - dbQty;

    setLocalCarts((prevLocalCarts) => {
      const newLocalCarts = { ...prevLocalCarts };
      let currentCart = newLocalCarts[activeOrderId] || [];

      if (newLocalQty <= 0) {
        // Remove item from local cart
        currentCart = currentCart.filter((i) => i.menuItemId !== menuItemId);
      } else {
        // Update or add item
        const existingItem = currentCart.find(
          (i) => i.menuItemId === menuItemId
        );
        if (existingItem) {
          existingItem.quantity = newLocalQty;
          // Giữ nguyên ghi chú khi thay đổi số lượng
        } else {
          currentCart.push({
            menuItemId: menuItemId,
            quantity: newLocalQty,
            name: displayItem.name,
            price: displayItem.price,
            note: displayItem.note, // Giữ nguyên ghi chú
          });
        }
      }

      newLocalCarts[activeOrderId] = currentCart;
      return newLocalCarts;
    });
  };

  const currentLocalCart = localCarts[activeOrderId] || [];

  const newItemsTotal =
    currentLocalCart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ) / 100;

  const confirmedTotal = useMemo(() => {
    return (
      displayItems.reduce((sum, item) => sum + item.price * item.dbQty, 0) / 100
    );
  }, [displayItems]);

  const grandTotal = confirmedTotal + newItemsTotal;

  const totalItems = useMemo(() => {
    return displayItems.reduce(
      (sum, item) => sum + item.dbQty + item.localQty,
      0
    );
  }, [displayItems]);

  const handleNavigateToMenu = () => {
    if (!tableId || !activeOrderId || !storageKeys) return;

    sessionStorage.setItem(storageKeys.pendingOrder, activeOrderId.toString());
    console.log(`🎯 Set pendingOrderId: ${activeOrderId}`);

    navigate(`/menu-order?tableId=${tableId}`, {
      state: { targetOrderId: activeOrderId },
    });
  };

  const currentOrderIndex = orders.findIndex((o) => o.id === activeOrderId) + 1;

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button
          className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 rounded-lg"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="text-base font-semibold text-gray-900">
          {loading ? "Đang tải..." : tableName || `Bàn ${tableIdState}`}
        </h1>
        <button
          className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 rounded-lg"
          onClick={() => setShowCallStaffModal(true)}
        >
          <MoreVertical className="h-6 w-6 text-gray-700" />
        </button>
      </header>

      {/* Order Task Bar */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide bg-white flex-shrink-0 border-b border-gray-200">
        {orders.map((order, index) => {
          const pendingCount = (localCarts[order.id] || []).reduce(
            (acc, item) => acc + item.quantity,
            0
          );

          return (
            <button
              key={order.id}
              onClick={() => setActiveOrderId(order.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 flex-shrink-0 transition-all ${
                activeOrderId === order.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              <span className="text-sm font-medium">Order {index + 1}</span>
              {pendingCount > 0 && (
                <span className="min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={handleCreateOrder}
          className="w-10 h-10 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center flex-shrink-0"
        >
          <Plus className="h-5 w-5 text-blue-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {showError && error && (
          <ErrorBanner message={error} onDismiss={() => setShowError(false)} />
        )}

        {loading && (
          <div className="text-center py-10 text-gray-500 text-sm">
            Đang tải...
          </div>
        )}

        {!loading &&
          displayItems.length > 0 &&
          displayItems.map((item) => {
            const totalQty = item.dbQty + item.localQty;
            const isNewOnly = item.dbQty === 0 && item.localQty > 0;

            return (
              <OrderItemCard
                key={item.menuItemId}
                name={item.name}
                price={item.price}
                quantity={totalQty}
                onQuantityChange={(q) =>
                  handleQuantityChange(item.menuItemId, q)
                }
                onEditNote={() =>
                  handleEditNote(item.menuItemId, item.name, item.note)
                }
                isNew={isNewOnly}
                dbQuantity={item.dbQty}
                note={item.note}
              />
            );
          })}

        {!loading && displayItems.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="mb-2 font-medium text-sm">Chưa có món nào.</p>
            <p className="text-xs">Bấm dấu "+" để thêm món.</p>
          </div>
        )}

        <div className="h-32"></div>
      </div>

      {/* Floating Add Button */}
      <button
        className="fixed bottom-28 right-5 h-12 w-12 rounded-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 shadow-lg z-30 flex items-center justify-center"
        onClick={handleNavigateToMenu}
      >
        <Plus className="h-5 w-5 text-white" />
      </button>

      {/* Bottom Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-900">
            Tổng tiền{" "}
            <span className="ml-1 font-normal text-gray-600">
              {totalItems} món
            </span>
          </span>
          <span className="text-2xl font-bold text-gray-900">
            {grandTotal.toLocaleString()} đ
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            className="h-11 rounded-lg border-2 border-blue-500 bg-white hover:bg-blue-50 active:bg-blue-100 flex items-center justify-center gap-1.5 text-sm font-medium text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            <FileText className="h-4 w-4" />
            Tạm tính
          </button>

          <button
            className="h-11 rounded-lg border-2 border-blue-500 bg-white hover:bg-blue-50 active:bg-blue-100 text-sm font-medium text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || currentLocalCart.length > 0}
            onClick={handleRequestPayment}
          >
            <CreditCard className="h-4 w-4 inline mr-1" />
            Thanh toán
          </button>

          <button
            className="h-11 rounded-lg bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmitNewItems}
            disabled={
              isSubmitting || !activeOrderId || currentLocalCart.length === 0
            }
          >
            {isSubmitting ? "Đang gửi..." : "Thông báo"}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={processPayment}
        isProcessing={isProcessingPayment}
        orderNumber={currentOrderIndex}
        totalAmount={confirmedTotal}
      />

      {/* Call Staff Modal */}
      <CallStaffModal
        isOpen={showCallStaffModal}
        onClose={() => setShowCallStaffModal(false)}
        onSelectOption={handleSelectCallOption}
        tableInfo={{ tableNumber: tableId?.toString(), section: "" }}
      />

      {/* Note Modal */}
      {editingNoteItem && (
        <NoteModal
          isOpen={!!editingNoteItem}
          onClose={() => setEditingNoteItem(null)}
          onSave={handleSaveNote}
          onRemove={handleRemoveNote}
          currentNote={editingNoteItem.currentNote}
          itemName={editingNoteItem.name}
        />
      )}
    </div>
  );
};

export default LiveOrderPage;

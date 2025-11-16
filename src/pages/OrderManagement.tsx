import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Split,
  Merge,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import {
  getTables,
  getPendingOrders,
  splitOrder,
  mergeOrder,
} from "@/api/order.api";
import {
  OrderResponse,
  TableResponse,
  OrderDetailResponse,
} from "@/types/type";

interface GroupedItem {
  menuItemId: number;
  name: string;
  totalQty: number;
  assignedQty: number;
}

const OrderManagement = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("split");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tables, setTables] = useState<TableResponse[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [splitState, setSplitState] = useState({
    sourceOrderId: "",
    sourceOrder: null as OrderResponse | null,
    newTableId: "",
    leftItems: {} as Record<string, GroupedItem>,
    rightItems: {} as Record<string, number>,
  });

  const [mergeState, setMergeState] = useState({
    sourceOrderId: "",
    targetOrderId: "",
    sourceOrder: null as OrderResponse | null,
    targetOrder: null as OrderResponse | null,
  });

  const fetchTables = async () => {
    try {
      const data = await getTables();
      setTables(data);
    } catch (err: any) {
      console.error("Lỗi tải danh sách bàn:", err);
      setError("Không thể tải danh sách bàn");
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await getPendingOrders();
      setOrders(data);
    } catch (err: any) {
      console.error("Lỗi tải danh sách đơn hàng:", err);
      setError("Không thể tải danh sách đơn hàng");
    }
  };

  const refreshData = () => {
    setLoadingData(true);
    setError(null);
    setResult(null);
    Promise.all([fetchTables(), fetchOrders()]).finally(() =>
      setLoadingData(false)
    );
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingData(true);
      setError(null);
      await Promise.all([fetchTables(), fetchOrders()]);
      setLoadingData(false);
    };
    loadInitialData();
  }, []);

  const groupItemsByMenuItem = (
    items: OrderDetailResponse[]
  ): Record<string, GroupedItem> => {
    const grouped: Record<string, GroupedItem> = {};
    if (!items) return grouped;

    items.forEach((item) => {
      const menuItemId = item.menuItem?.id;
      const menuItemName = item.menuItem?.name || "Món không xác định";

      if (!menuItemId) return;

      if (!grouped[menuItemId]) {
        grouped[menuItemId] = {
          menuItemId,
          name: menuItemName,
          totalQty: 0,
          assignedQty: 0,
        };
      }
      grouped[menuItemId].totalQty += item.quantity;
    });

    return grouped;
  };

  const handleSelectSourceOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === parseInt(orderId));
    if (order) {
      const leftItems = groupItemsByMenuItem(order.items);
      setSplitState({
        sourceOrderId: orderId,
        sourceOrder: order,
        newTableId: "",
        leftItems: leftItems,
        rightItems: {},
      });
    } else {
      setSplitState({
        sourceOrderId: "",
        sourceOrder: null,
        newTableId: "",
        leftItems: {},
        rightItems: {},
      });
    }
  };

  const moveItemToRight = (menuItemId: string, quantity: number) => {
    const item = splitState.leftItems[menuItemId];
    if (!item) return;

    const currentRight = splitState.rightItems[menuItemId] || 0;
    const availableQty = item.totalQty - item.assignedQty;
    const qtyToMove = Math.min(quantity, availableQty);

    if (qtyToMove <= 0) return;

    setSplitState((prev) => ({
      ...prev,
      leftItems: {
        ...prev.leftItems,
        [menuItemId]: {
          ...item,
          assignedQty: item.assignedQty + qtyToMove,
        },
      },
      rightItems: {
        ...prev.rightItems,
        [menuItemId]: currentRight + qtyToMove,
      },
    }));
  };

  const moveItemToLeft = (menuItemId: string, quantity: number) => {
    const currentRight = splitState.rightItems[menuItemId] || 0;
    const qtyToMove = Math.min(quantity, currentRight);

    if (qtyToMove <= 0) return;

    const newRightQty = currentRight - qtyToMove;
    const newRightItems = { ...splitState.rightItems };

    if (newRightQty === 0) {
      delete newRightItems[menuItemId];
    } else {
      newRightItems[menuItemId] = newRightQty;
    }

    const item = splitState.leftItems[menuItemId];

    setSplitState((prev) => ({
      ...prev,
      leftItems: {
        ...prev.leftItems,
        [menuItemId]: {
          ...item,
          assignedQty: item.assignedQty - qtyToMove,
        },
      },
      rightItems: newRightItems,
    }));
  };

  const moveAllToRight = (menuItemId: string) => {
    const item = splitState.leftItems[menuItemId];
    if (!item) return;
    const availableQty = item.totalQty - item.assignedQty;
    moveItemToRight(menuItemId, availableQty);
  };

  const moveAllToLeft = (menuItemId: string) => {
    const currentRight = splitState.rightItems[menuItemId] || 0;
    moveItemToLeft(menuItemId, currentRight);
  };

  const handleSplitOrder = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    console.warn(
      "Cảnh báo: Đang gửi Tách đơn với { menuItemId: quantity } thay vì { orderDetailId: quantity }."
    );

    try {
      const requestBody = {
        sourceOrderId: parseInt(splitState.sourceOrderId),
        newTableId: parseInt(splitState.newTableId),
        splitItems: splitState.rightItems,
      };

      if (
        !requestBody.sourceOrderId ||
        !requestBody.newTableId ||
        Object.keys(requestBody.splitItems).length === 0
      ) {
        throw new Error(
          "Vui lòng chọn đơn hàng gốc, bàn mới và các món ăn cần tách."
        );
      }

      const data = await splitOrder(requestBody);
      setResult(data);
      refreshData();

      setSplitState({
        sourceOrderId: "",
        sourceOrder: null,
        newTableId: "",
        leftItems: {},
        rightItems: {},
      });
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Tách đơn thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMergeOrders = (sourceId: string, targetId: string) => {
    const sourceOrder = orders.find((o) => o.id === parseInt(sourceId)) || null;
    const targetOrder = orders.find((o) => o.id === parseInt(targetId)) || null;

    setMergeState({
      sourceOrderId: sourceId,
      targetOrderId: targetId,
      sourceOrder: sourceOrder,
      targetOrder: targetOrder,
    });
  };

  const handleMergeOrders = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const requestBody = {
        sourceOrderId: parseInt(mergeState.sourceOrderId),
        targetOrderId: parseInt(mergeState.targetOrderId),
      };

      if (!requestBody.sourceOrderId || !requestBody.targetOrderId) {
        throw new Error("Vui lòng chọn đơn hàng nguồn và đơn hàng đích.");
      }
      if (requestBody.sourceOrderId === requestBody.targetOrderId) {
        throw new Error("Không thể gộp đơn hàng với chính nó.");
      }

      const data = await mergeOrder(requestBody);
      setResult(data);
      refreshData();

      setMergeState({
        sourceOrderId: "",
        targetOrderId: "",
        sourceOrder: null,
        targetOrder: null,
      });
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Gộp đơn thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-xl max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quản lý đơn hàng
            </h1>
            <p className="text-gray-500 text-sm mt-1">Tách hoặc gộp đơn hàng</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              disabled={loadingData || loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all disabled:bg-gray-300"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  loadingData || loading ? "animate-spin" : ""
                }`}
              />
              Làm mới
            </button>
            <button
              onClick={() => navigate("/")}
              className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab("split");
              setError(null);
              setResult(null);
            }}
            className={`flex-1 py-4 px-6 text-center font-medium transition-all ${
              activeTab === "split"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Split className="inline-block mr-2 w-5 h-5" />
            Tách đơn
          </button>
          <button
            onClick={() => {
              setActiveTab("merge");
              setError(null);
              setResult(null);
            }}
            className={`flex-1 py-4 px-6 text-center font-medium transition-all ${
              activeTab === "merge"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Merge className="inline-block mr-2 w-5 h-5" />
            Gộp đơn
          </button>
        </div>

        {loadingData && (
          <div className="p-6 text-center text-gray-500">
            Đang tải dữ liệu Bàn và Đơn hàng...
          </div>
        )}

        {!loadingData && (
          <div className="p-6">
            {activeTab === "split" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đơn hàng gốc
                    </label>
                    <select
                      value={splitState.sourceOrderId}
                      onChange={(e) => handleSelectSourceOrder(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    >
                      <option value="">Chọn đơn hàng...</option>
                      {orders.map((order) => (
                        <option key={order.id} value={order.id}>
                          #{order.id} - {order.table?.tableNumber} -{" "}
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(order.totalAmount)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bàn mới
                    </label>
                    <select
                      value={splitState.newTableId}
                      onChange={(e) =>
                        setSplitState((prev) => ({
                          ...prev,
                          newTableId: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    >
                      <option value="">Chọn bàn...</option>
                      {tables.map((table) => (
                        <option key={table.id} value={table.id}>
                          {table.tableNumber} ({table.capacity} chỗ)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {splitState.sourceOrder && (
                  <div className="grid grid-cols-2 gap-6 min-h-[400px]">
                    <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">
                            Đơn #{splitState.sourceOrder.id}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {splitState.sourceOrder.table?.tableNumber}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(splitState.sourceOrder.totalAmount)}
                        </span>
                      </div>

                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {Object.values(splitState.leftItems).filter(
                          (item) => item.totalQty - item.assignedQty > 0
                        ).length === 0 && (
                          <div className="text-center py-16 text-gray-400">
                            <p className="text-sm">Đã chuyển hết</p>
                          </div>
                        )}

                        {Object.values(splitState.leftItems)
                          .filter(
                            (item) => item.totalQty - item.assignedQty > 0
                          )
                          .map((item) => {
                            const remainingQty =
                              item.totalQty - item.assignedQty;
                            return (
                              <div
                                key={item.menuItemId}
                                className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-all"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900 text-sm">
                                      {item.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Còn lại:{" "}
                                      <span className="font-semibold text-gray-900">
                                        {remainingQty}
                                      </span>
                                      /{item.totalQty}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      moveItemToRight(
                                        String(item.menuItemId),
                                        1
                                      )
                                    }
                                    className="flex-1 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-all text-xs font-medium"
                                  >
                                    +1{" "}
                                    <ChevronRight className="inline w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      moveAllToRight(String(item.menuItemId))
                                    }
                                    className="flex-1 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-all text-xs font-medium"
                                  >
                                    Tất cả
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">
                            Đơn mới
                          </h3>
                          <p className="text-sm text-gray-500">
                            {tables.find(
                              (t) => t.id === parseInt(splitState.newTableId)
                            )?.tableNumber || "Chọn bàn"}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {Object.keys(splitState.rightItems).length} món
                        </span>
                      </div>

                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {Object.keys(splitState.rightItems).length === 0 ? (
                          <div className="text-center py-16 text-gray-400">
                            <p className="text-sm mb-1">Chưa có món</p>
                            <p className="text-xs">Chọn món từ bên trái</p>
                          </div>
                        ) : (
                          Object.entries(splitState.rightItems).map(
                            ([menuItemId, qty]) => {
                              const item = splitState.leftItems[menuItemId];
                              return (
                                <div
                                  key={menuItemId}
                                  className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-all"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900 text-sm">
                                        {item.name}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        Số lượng:{" "}
                                        <span className="font-semibold text-gray-900">
                                          {qty}
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        moveItemToLeft(menuItemId, 1)
                                      }
                                      className="flex-1 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-all text-xs font-medium"
                                    >
                                      <ChevronLeft className="inline w-3 h-3" />{" "}
                                      -1
                                    </button>
                                    <button
                                      onClick={() => moveAllToLeft(menuItemId)}
                                      className="flex-1 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-all text-xs font-medium"
                                    >
                                      Trả hết
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!splitState.sourceOrder && (
                  <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-sm">Chọn đơn hàng để bắt đầu</p>
                  </div>
                )}

                {splitState.sourceOrder && (
                  <button
                    onClick={handleSplitOrder}
                    disabled={
                      loading ||
                      !splitState.newTableId ||
                      Object.keys(splitState.rightItems).length === 0
                    }
                    className="w-full py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading ? "Đang xử lý..." : "Xác nhận tách đơn"}
                  </button>
                )}
              </div>
            )}

            {activeTab === "merge" && (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 text-gray-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-xs text-gray-600">
                      <p className="font-medium mb-1">Yêu cầu:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>Cả 2 đơn phải có trạng thái PENDING</li>
                        <li>
                          Tất cả món ăn (trong đơn) phải đã hoàn thành
                          (COMPLETED)
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đơn nguồn
                    </label>
                    <select
                      value={mergeState.sourceOrderId}
                      onChange={(e) =>
                        handleSelectMergeOrders(
                          e.target.value,
                          mergeState.targetOrderId
                        )
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    >
                      <option value="">Chọn đơn cần gộp...</option>
                      {orders.map((order) => (
                        <option key={order.id} value={order.id}>
                          #{order.id} - {order.table?.tableNumber} -{" "}
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(order.totalAmount)}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Sẽ chuyển sang trạng thái MERGED
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đơn đích
                    </label>
                    <select
                      value={mergeState.targetOrderId}
                      onChange={(e) =>
                        handleSelectMergeOrders(
                          mergeState.sourceOrderId,
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    >
                      <option value="">Chọn đơn chính...</option>
                      {orders
                        .filter(
                          (o) => o.id !== parseInt(mergeState.sourceOrderId)
                        )
                        .map((order) => (
                          <option key={order.id} value={order.id}>
                            #{order.id} - {order.table?.tableNumber} -{" "}
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(order.totalAmount)}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Sẽ nhận tất cả món ăn
                    </p>
                  </div>
                </div>

                {(mergeState.sourceOrder || mergeState.targetOrder) && (
                  <div className="grid grid-cols-2 gap-6 min-h-[300px]">
                    {mergeState.sourceOrder ? (
                      <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white">
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">
                              Đơn #{mergeState.sourceOrder.id}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {mergeState.sourceOrder.table?.tableNumber}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-gray-900">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(mergeState.sourceOrder.totalAmount)}
                          </span>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {groupItemsByMenuItem(mergeState.sourceOrder.items) &&
                            Object.values(
                              groupItemsByMenuItem(mergeState.sourceOrder.items)
                            ).map((item) => (
                              <div
                                key={item.menuItemId}
                                className="bg-white border border-gray-200 rounded-lg p-2.5"
                              >
                                <p className="font-medium text-gray-900 text-sm">
                                  {item.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  SL: {item.totalQty}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-300 rounded-xl p-5 bg-gray-50 flex items-center justify-center">
                        <p className="text-gray-400 text-sm">Chọn đơn nguồn</p>
                      </div>
                    )}

                    {mergeState.targetOrder ? (
                      <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white">
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">
                              Đơn #{mergeState.targetOrder.id}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {mergeState.targetOrder.table?.tableNumber}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-gray-900">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(mergeState.targetOrder.totalAmount)}
                          </span>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {groupItemsByMenuItem(mergeState.targetOrder.items) &&
                            Object.values(
                              groupItemsByMenuItem(mergeState.targetOrder.items)
                            ).map((item) => (
                              <div
                                key={item.menuItemId}
                                className="bg-white border border-gray-200 rounded-lg p-2.5"
                              >
                                <p className="font-medium text-gray-900 text-sm">
                                  {item.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  SL: {item.totalQty}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-300 rounded-xl p-5 bg-gray-50 flex items-center justify-center">
                        <p className="text-gray-400 text-sm">Chọn đơn đích</p>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleMergeOrders}
                  disabled={
                    loading ||
                    !mergeState.sourceOrderId ||
                    !mergeState.targetOrderId
                  }
                  className="w-full py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "Đang xử lý..." : "Xác nhận gộp đơn"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h3 className="text-red-800 font-semibold text-sm">Lỗi</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-green-600 mb-4">
            ✓ Thành công!
          </h2>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Đơn hàng</p>
              <p className="text-xl font-bold text-gray-900">#{result.id}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Trạng thái</p>
              <p className="text-xl font-bold text-gray-900">{result.status}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Bàn</p>
              <p className="text-xl font-bold text-gray-900">
                {result.table?.tableNumber}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Tổng tiền</p>
              <p className="text-xl font-bold text-gray-900">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(result.totalAmount)}
              </p>
            </div>
          </div>

          {result.items && result.items.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Danh sách món
              </h3>
              <div className="space-y-2">
                {result.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {item.menuItem?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        SL: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(item.price)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;

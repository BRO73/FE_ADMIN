import { useState, useEffect } from "react";
import { useTables } from "@/hooks/useTables";
import { useOrders } from "@/hooks/useOrders";
import { TableResponse, OrderResponse } from "@/types/type";

interface TableData {
  id: number;
  tableNumber: string;
  capacity: number;
  locationName: string;
  hasActiveOrder: boolean;
  orderNumber?: string;
}

const TableCard = ({
  tableNumber,
  capacity,
  hasActiveOrder,
  orderNumber,
  onClick,
}: {
  tableNumber: string;
  capacity: number;
  hasActiveOrder: boolean;
  orderNumber?: string;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative p-6 rounded-2xl border-2 transition-all duration-200 min-h-[120px] flex items-center justify-center ${
        hasActiveOrder
          ? "bg-blue-100 border-blue-200 hover:bg-blue-200"
          : "bg-white border-gray-200 hover:bg-gray-50"
      }`}
    >
      {hasActiveOrder && (
        <div className="absolute top-3 right-3">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        <div
          className={`text-base font-semibold ${
            hasActiveOrder ? "text-blue-700" : "text-gray-700"
          }`}
        >
          Bàn {tableNumber}
        </div>

        <div
          className={`text-sm ${
            hasActiveOrder ? "text-blue-600" : "text-gray-500"
          }`}
        >
          {capacity} chỗ
        </div>

        {orderNumber && (
          <div className="text-xs font-medium text-blue-600 mt-1">
            {orderNumber}
          </div>
        )}
      </div>
    </button>
  );
};

const TableGrid = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-4">
      {children}
    </div>
  );
};

const Index = () => {
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  // Use hooks to fetch data
  const { tables, loading: tablesLoading, error: tablesError } = useTables();
  const { orders, loading: ordersLoading, error: ordersError } = useOrders();

  const loading = tablesLoading || ordersLoading;
  const error = tablesError || ordersError;

  // Process data when tables or orders change
  useEffect(() => {
    if (!tables || !orders) return;

    // Filter active orders (PENDING, IN_PROGRESS)
    const activeOrders = orders.filter(
      (order: OrderResponse) =>
        order.status === "PENDING" || order.status === "IN_PROGRESS"
    );

    // Create map: tableId -> orderNumber
    const tableOrderMap = new Map(
      activeOrders.map((order: OrderResponse) => [
        order.table.id,
        order.orderNumber,
      ])
    );

    // Combine data
    const processed: TableData[] = tables.map((table: TableResponse) => ({
      id: table.id,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      locationName: table.locationName,
      hasActiveOrder: tableOrderMap.has(table.id),
      orderNumber: tableOrderMap.get(table.id),
    }));

    setTableData(processed);
  }, [tables, orders]);

  // Get unique locations
  const locations = ["all", ...new Set(tableData.map((t) => t.locationName))];

  // Filter tables by location
  const filteredTables =
    selectedLocation === "all"
      ? tableData
      : tableData.filter((t) => t.locationName === selectedLocation);

  // Group by location
  const tablesByLocation = filteredTables.reduce((acc, table) => {
    if (!acc[table.locationName]) {
      acc[table.locationName] = [];
    }
    acc[table.locationName].push(table);
    return acc;
  }, {} as Record<string, TableData[]>);

  const handleTableClick = (tableId: number) => {
    window.location.href = `/live-order?tableId=${tableId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Lỗi: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button className="lg:hidden">
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded-sm" />
              </div>
              <span className="font-bold text-lg text-gray-900">
                Restaurant
              </span>
            </div>
          </div>
          jsx
          <div className="flex items-center gap-2">
            <button
              onClick={() => (window.location.href = "/orders")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="hidden sm:inline">Đơn hàng</span>
            </button>

            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="sticky top-[57px] z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {locations.map((location) => (
            <button
              key={location}
              onClick={() => setSelectedLocation(location)}
              className={`px-5 py-2.5 rounded-full font-medium whitespace-nowrap transition-all ${
                selectedLocation === location
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {location === "all" ? "Tất cả" : location}
            </button>
          ))}
        </div>
      </div>

      <main className="p-4 md:p-6">
        <div className="max-w-[1800px] mx-auto space-y-8">
          {Object.entries(tablesByLocation).map(
            ([locationName, locationTables]) => (
              <div key={locationName}>
                {selectedLocation === "all" && (
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">
                    {locationName}
                  </h2>
                )}
                <TableGrid>
                  {locationTables.map((table) => (
                    <TableCard
                      key={table.id}
                      tableNumber={table.tableNumber}
                      capacity={table.capacity}
                      hasActiveOrder={table.hasActiveOrder}
                      orderNumber={table.orderNumber}
                      onClick={() => handleTableClick(table.id)}
                    />
                  ))}
                </TableGrid>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;

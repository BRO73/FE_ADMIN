import api from "./axiosInstance";
import { OrderRequest, OrderResponse, TableResponse } from "@/types/type";

/**
 * Tạo order mới (thường là khi check-out giỏ hàng)
 * OrderRequest cần chứa tableId và list orderDetails
 */
export const createOrder = async (
  request: OrderRequest
): Promise<OrderResponse> => {
  const response = await api.post<OrderResponse>("/orders", request);
  return response.data;
};

/**
 * Lấy order theo ID
 */
export const getOrderById = async (orderId: number): Promise<OrderResponse> => {
  const response = await api.get<OrderResponse>(`/orders/${orderId}`);
  return response.data;
};

/**
 * Lấy tất cả orders của một bàn (bất kể status)
 */
export const getOrdersByTable = async (
  tableId: number
): Promise<OrderResponse[]> => {
  const response = await api.get<OrderResponse[]>(`/orders/table/${tableId}`);
  return response.data;
};

/**
 * (HÀM QUAN TRỌNG)
 * Lấy tất cả các order đang "active" (chưa thanh toán) của bàn.
 * Đây là hàm CartPage sẽ gọi.
 */
export const getActiveOrdersByTable = async (
  tableId: number
): Promise<OrderResponse[]> => {
  // Backend nên hỗ trợ filter theo status active (PENDING, IN_PROGRESS)
  // Nếu không, bạn phải dùng getOrdersByTable và filter ở frontend
  try {
    const response = await api.get<OrderResponse[]>(
      `/orders/table/${tableId}/active`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching active orders, falling back...", error);
    // Fallback: Lấy tất cả và tự filter (ít hiệu quả hơn)
    const allOrders = await getOrdersByTable(tableId);
    return allOrders.filter(
      (order) => order.status === "PENDING" || order.status === "IN_PROGRESS"
    );
  }
};

/**
 * Cập nhật order
 * (Ví dụ: thêm ghi chú, áp dụng promotion)
 */
export const updateOrder = async (
  orderId: number,
  request: Partial<OrderRequest> // Dùng Partial vì bạn có thể chỉ cập nhật 1 phần
): Promise<OrderResponse> => {
  const response = await api.put<OrderResponse>(`/orders/${orderId}`, request);
  return response.data;
};

/**
 * (NGHIỆP VỤ TÁCH BILL)
 * Gán một order (đang có customer_id = NULL) cho khách hàng hiện tại
 */
export const claimOrder = async (orderId: number): Promise<OrderResponse> => {
  // Backend sẽ tự lấy customerId từ JWT token
  const response = await api.put<OrderResponse>(`/orders/${orderId}/claim`);
  return response.data;
};

/**
 * (NGHIỆP VỤ TÁCH BILL)
 * Chuyển một món ăn (OrderDetail) từ order này sang order khác
 */
export const splitOrderItem = async (
  orderDetailId: number,
  targetOrderId: number | null
): Promise<void> => {
  // targetOrderId = null nghĩa là "Tách ra thành order mới"
  // targetOrderId = 123 nghĩa là "Chuyển vào order 123"
  await api.post(`/orders/split-item`, { orderDetailId, targetOrderId });
};

/**
 * (NGHIỆP VỤ GIỎ HÀNG)
 * Thêm món vào một Order đã có
 */
export const addItemsToOrder = async (
  orderId: number,
  items: Array<{ menuItemId: number; quantity: number; notes?: string }>
): Promise<OrderResponse> => {
  const response = await api.post<OrderResponse>(
    `/orders/${orderId}/add-items`,
    {
      items,
    }
  );
  return response.data;
};

/**
 * Xóa order (thường là admin hoặc hủy khi order rỗng)
 */
export const deleteOrder = async (orderId: number): Promise<void> => {
  await api.delete(`/orders/${orderId}`);
};

/**
 * Lấy orders theo status (cho admin)
 */
export const getOrdersByStatus = async (
  status: string
): Promise<OrderResponse[]> => {
  const response = await api.get<OrderResponse[]>(`/orders/status/${status}`);
  return response.data;
};

export const unlinkCustomerFromOrder = async (
  orderId: number
): Promise<OrderResponse> => {
  const response = await api.put<OrderResponse>(
    `/orders/${orderId}/unlink-customer`
  );
  return response.data;
};

// Mapper: API → UI (Lấy từ file tableApi.js của bạn)
const mapToTable = (res: TableResponse): TableResponse => ({
  id: res.id,
  tableNumber: res.tableNumber,
  capacity: res.capacity,
  locationId: res.locationId,
  locationName: res.locationName,
  status: res.status as "Available" | "Occupied" | "Reserved" | "Maintenance",
});

/**
 * Lấy tất cả danh sách bàn (cho modal Tách/Gộp)
 */
export const getTables = async (): Promise<TableResponse[]> => {
  const { data } = await api.get<TableResponse[]>("/tables");
  return data.map(mapToTable);
};

/**
 * Lấy danh sách order (chỉ PENDING) (cho modal Tách/Gộp)
 */
export const getPendingOrders = async (): Promise<OrderResponse[]> => {
  // Đảm bảo backend hỗ trợ filter ?status=PENDING
  const { data } = await api.get<OrderResponse[]>("/orders/status/PENDING");
  return data;
};

/**
 * API Tách đơn
 * Gửi request Tách đơn lên backend
 */
export const splitOrder = async (request: {
  sourceOrderId: number;
  newTableId: number;
  splitItems: Record<number, number>;
}): Promise<OrderResponse> => {
  const { data } = await api.post<OrderResponse>("/orders/split", request);
  return data;
};

/**
 * API Gộp đơn
 * Gửi request Gộp đơn lên backend
 */
export const mergeOrder = async (request: {
  sourceOrderId: number;
  targetOrderId: number;
}): Promise<OrderResponse> => {
  const { data } = await api.post<OrderResponse>("/orders/merge", request);
  return data;
};

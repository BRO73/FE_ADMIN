import api from "@/api/axiosInstance";
import { Promotion } from "@/types/type";

export interface PromotionResponse {
  id: number;
  name: string;
  code?: string;
  description?: string;
  promotionType: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  minSpend?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  createdAt?: string;
  updatedAt?: string;
  activated?: boolean;
  deleted?: boolean;
}

export interface PromotionFormData {
  title: string;
  code?: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minSpend?: number;
  startDate: string;
  endDate: string;
  maxUsage?: number;
}

// --- Mapper: API → UI ---
const mapToPromotion = (res: PromotionResponse) => ({
  id: res.id,
  title: res.name,
  code: res.code,
  description: res.description || "",
  discountType:
    res.promotionType === "PERCENTAGE" ? "PERCENTAGE" : "FIXED_AMOUNT",
  discountValue: res.value,
  minSpend: res.minSpend,
  startDate: res.startDate.split("T")[0],
  endDate: res.endDate.split("T")[0],
  maxUsage: res.usageLimit,
  status: (() => {
    const now = new Date();
    const start = new Date(res.startDate);
    const end = new Date(res.endDate);
    if (now < start) return "scheduled";
    if (now > end) return "expired";
    return res.activated ? "active" : "inactive";
  })(),
});

// --- Mapper: UI → API ---
const mapToApiPayload = (data: PromotionFormData) => ({
  name: data.title,
  code: data.code,
  description: data.description,
  promotionType:
    data.discountType === "PERCENTAGE" ? "PERCENTAGE" : "FIXED_AMOUNT",
  value: data.discountValue,
  minSpend: data.minSpend,
  startDate: `${data.startDate}T00:00:00`,
  endDate: `${data.endDate}T23:59:59`,
  usageLimit: data.maxUsage,
});

// --- API functions ---
export const getAllPromotions = async () => {
  const { data } = await api.get<PromotionResponse[]>("/promotions");
  return data.map(mapToPromotion);
};

export const getPromotionById = async (id: number) => {
  const { data } = await api.get<PromotionResponse>(`/promotions/${id}`);
  return mapToPromotion(data);
};

export const createPromotion = async (payload: PromotionFormData) => {
  const { data } = await api.post<PromotionResponse>(
    "/promotions",
    mapToApiPayload(payload)
  );
  return mapToPromotion(data);
};

export const updatePromotion = async (
  id: number,
  payload: PromotionFormData
) => {
  const { data } = await api.put<PromotionResponse>(
    `/promotions/${id}`,
    mapToApiPayload(payload)
  );
  return mapToPromotion(data);
};

export const deletePromotion = async (id: number): Promise<void> => {
  await api.delete(`/promotions/${id}`);
};

export const getActivePromotions = async () => {
  const { data } = await api.get<PromotionResponse[]>("/promotions/active");
  return data.map(mapToPromotion);
};

export const getPromotionsByType = async (type: string) => {
  const { data } = await api.get<PromotionResponse[]>(
    `/promotions/type/${type}`
  );
  return data.map(mapToPromotion);
};

export const getPromotionsByCode = async (
  code: string
): Promise<Promotion[]> => {
  try {
    const { data } = await api.get(`/promotions/code/${code}`);

    console.log("API Response:", data);

    let promotionsData = data;
    if (!Array.isArray(data)) {
      promotionsData = [data];
    }

    return promotionsData.map((promotion: any) => ({
      id: promotion.id,
      name: promotion.name,
      code: promotion.code || "",
      description: promotion.description || "",
      promotionType: promotion.promotionType() as "PERCENTAGE" | "FIXED_AMOUNT",
      value: promotion.value,
      minSpend: promotion.minSpend || 0,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      usageLimit: promotion.usageLimit || 0,
      createdAt: promotion.createdAt || "",
      updatedAt: promotion.updatedAt || "",
      deleted: promotion.deleted || false,
      activated: promotion.activated || false,
    }));
  } catch (error) {
    console.error("Error fetching promotion by code:", error);
    throw error;
  }
};

// ✅ FIX: Gửi userId lên backend
export const validatePromotion = async (
  code: string,
  totalAmount: number,
  userId?: number
): Promise<Promotion> => {
  try {
    // Tạo payload động: chỉ gửi userId nếu có
    const payload: { code: string; totalAmount: number; userId?: number } = {
      code: code,
      totalAmount: totalAmount,
    };

    // ✅ CHỈ THÊM userId NẾU CÓ GIÁ TRỊ
    if (userId !== undefined && userId !== null) {
      payload.userId = userId;
    }

    console.log("📤 Sending validation request:", payload);

    const { data } = await api.post(`/promotions/validate`, payload);

    console.log("✅ API Response (Valid Promotion):", data);

    return {
      id: data.id,
      name: data.name,
      code: data.code || "",
      description: data.description || "",
      promotionType: data.promotionType as "PERCENTAGE" | "FIXED_AMOUNT",
      value: data.value,
      minSpend: data.minSpend || 0,
      startDate: data.startDate,
      endDate: data.endDate,
      usageLimit: data.usageLimit || 0,
      createdAt: data.createdAt || "",
      updatedAt: data.updatedAt || "",
      deleted: data.deleted || false,
      activated: data.activated || false,
    };
  } catch (error) {
    console.error("❌ Error validating promotion:", error);
    throw error;
  }
};

interface CustomerResponse {
  id: number;
  userId: number;
  fullName: string;
  phoneNumber: string;
  email?: string;
}

interface OrderResponseDetail {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  customerUserId?: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    note?: string;
  }>;
}

export const getOrderById = async (id: number) => {
  const { data } = await api.get<OrderResponseDetail>(`/orders/${id}`);
  return data;
};

export const findOrCreateCustomer = async (
  phone: string,
  fullName: string
): Promise<CustomerResponse> => {
  const { data } = await api.post<CustomerResponse>(
    "/customers/find-or-create",
    {
      phone: phone,
      fullName: fullName,
    }
  );
  return data;
};

export const linkCustomerToOrder = async (
  orderId: number,
  userId: number
): Promise<OrderResponseDetail> => {
  const { data } = await api.put<OrderResponseDetail>(
    `/orders/${orderId}/link-customer`,
    {
      userId: userId,
    }
  );
  return data;
};

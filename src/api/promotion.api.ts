import api from "@/api/axiosInstance";

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
  discountType: "percentage" | "fixed";
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
  discountType: res.promotionType === "PERCENTAGE" ? "percentage" : "fixed",
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
  promotionType: data.discountType === "percentage" ? "percentage" : "fixed",
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
  const { data } = await api.post<PromotionResponse>("/promotions", mapToApiPayload(payload));
  return mapToPromotion(data);
};

export const updatePromotion = async (id: number, payload: PromotionFormData) => {
  const { data } = await api.put<PromotionResponse>(`/promotions/${id}`, mapToApiPayload(payload));
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
  const { data } = await api.get<PromotionResponse[]>(`/promotions/type/${type}`);
  return data.map(mapToPromotion);
};

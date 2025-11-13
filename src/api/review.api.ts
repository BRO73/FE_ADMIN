import api from "@/api/axiosInstance";

export interface ReviewRequest {
  orderId: number;
  ratingScore: number;
  comment: string;
}

export interface ReviewResponse {
  id: number;
  orderId: number;
  ratingScore: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  activated: boolean;
  customerName?: string;   
  customerEmail?: string; 
  customerPhone: string;
}

// Mapper (nếu cần chỉnh dữ liệu về FE)
const mapToReview = (res: ReviewResponse): ReviewResponse => ({
  id: res.id,
  orderId: res.orderId,
  ratingScore: res.ratingScore,
  comment: res.comment,
  createdAt: res.createdAt,
  updatedAt: res.updatedAt,
  deleted: res.deleted,
  activated: res.activated,
  customerName: res.customerName,   
  customerEmail: res.customerEmail,
  customerPhone: res.customerPhone,
});


// --- API Methods ---
export const getAllReviews = async (): Promise<ReviewResponse[]> => {
  const { data } = await api.get<ReviewResponse[]>("/reviews");
  return data.map(mapToReview);
};

export const getReviewById = async (id: number): Promise<ReviewResponse> => {
  const { data } = await api.get<ReviewResponse>(`/reviews/${id}`);
  return mapToReview(data);
};

export const getReviewByOrder = async (orderId: number): Promise<ReviewResponse> => {
  const { data } = await api.get<ReviewResponse>(`/reviews/order/${orderId}`);
  return mapToReview(data);
};

export const getReviewsByRating = async (rating: number): Promise<ReviewResponse[]> => {
  const { data } = await api.get<ReviewResponse[]>(`/reviews/rating/${rating}`);
  return data.map(mapToReview);
};

export const getReviewsByMinRating = async (rating: number): Promise<ReviewResponse[]> => {
  const { data } = await api.get<ReviewResponse[]>(`/reviews/min-rating/${rating}`);
  return data.map(mapToReview);
};

export const createReview = async (payload: ReviewRequest): Promise<ReviewResponse> => {
  const { data } = await api.post<ReviewResponse>("/reviews", payload);
  return mapToReview(data);
};

export const updateReview = async (id: number, payload: ReviewRequest): Promise<ReviewResponse> => {
  const { data } = await api.put<ReviewResponse>(`/reviews/${id}`, payload);
  return mapToReview(data);
};

export const deleteReview = async (id: number): Promise<void> => {
  await api.delete(`/reviews/${id}`);
};

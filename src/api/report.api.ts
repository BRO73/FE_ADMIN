import api from "@/api/axiosInstance";

export interface RevenueDay {
  day: string;
  revenue: number;
  orders: number;
}

export interface TopItem {
  id: number;
  name: string;
  orders: number;
  revenue: number;
}

export interface DailyReport {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  customerVisits: number;
}

export interface PeakHour {
  hour: number;
  revenue: number;
}

export interface TopCustomer {
  id: number;          
  name: string;
  revenue: number;
  visitCount: number;  
}

export interface LowRatingReview {
  id: number;
  orderId: number;
  customerName?: string;
  customerEmail?: string;
  ratingScore: number;
  comment: string;
  createdAt: string;
}

// Lấy thống kê tổng theo ngày
export const getDailyReport = async (start: string, end: string): Promise<DailyReport> => {
  const { data } = await api.get("/reports/daily", { params: { start, end } });
  return data;
};

// Lấy doanh thu 7 ngày gần nhất
export const getRevenueLast7Days = async (): Promise<RevenueDay[]> => {
  const { data } = await api.get("/reports/last-7-days/revenue");
  return data.map((d: any) => ({
    day: new Date(d.day).toLocaleDateString(),
    revenue: d.revenue,
    orders: d.orders,
  }));
};

// Lấy top món theo doanh thu
export const getTopItemsLast7Days = async (): Promise<TopItem[]> => {
  const { data } = await api.get("/reports/last-7-days/top-items");
  return data;
};

// 🆕 Lấy thống kê tổng hợp theo số ngày tùy chọn (ví dụ: 7, 30, 90)
export const getSummaryReport = async (days: number): Promise<DailyReport> => {
  const { data } = await api.get(`/reports/summary`, { params: { days } });
  return data;
};

// ✅ Lấy top khách hàng trong N ngày
export const getTopCustomers = async (days: number): Promise<TopCustomer[]> => {
  const { data } = await api.get(`/reports/top-customers?days=${days}`);
  return data;
};

// ✅ Lấy doanh thu theo giờ trong N ngày
export const getPeakHours = async (days: number): Promise<PeakHour[]> => {
  const { data } = await api.get(`/reports/peak-hours?days=${days}`);
  return data;
};

export const getLowRatingReviews = async (): Promise<LowRatingReview[]> => {
  const { data } = await api.get('/reports/reviews/low-rating');
  return data;
};



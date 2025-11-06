import api from "@/api/axiosInstance";

export interface RevenueDay {
  day: string;
  revenue: number;
  orders: number;
}

export interface TopItem {
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

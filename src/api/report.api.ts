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
  name: string;
  revenue: number;
  visitCount: number;
}

export const getDailyReport = async (start: string, end: string): Promise<DailyReport> => {
  const { data } = await api.get("/reports/daily", { params: { start, end } });
  return data;
};

export const getRevenueByDays = async (days: number): Promise<RevenueDay[]> => {
  const { data } = await api.get(`/reports/revenue?days=${days}`);
  return data.map((d: any) => ({
    day: new Date(d.day).toLocaleDateString(),
    revenue: d.revenue,
    orders: d.orders,
  }));
};


export const getTopItemsByDays = async (days: number): Promise<TopItem[]> => {
  const { data } = await api.get(`/reports/top-items/days?days=${days}`);
  return data;
};

export const getSummaryReport = async (days: number): Promise<DailyReport> => {
  const { data } = await api.get(`/reports/summary`, { params: { days } });
  return data;
};

export const getTopCustomers = async (days: number): Promise<TopCustomer[]> => {
  const { data } = await api.get(`/reports/top-customers?days=${days}`);
  return data.map((c: any) => ({
    name: c.name,
    revenue: c.revenue,
    visitCount: c.visitCount,
  }));
};

export const getPeakHours = async (days: number): Promise<PeakHour[]> => {
  const { data } = await api.get(`/reports/peak-hours?days=${days}`);
  return data;
};

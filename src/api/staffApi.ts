// src/api/staffApi.ts
import api from "./axiosInstance";

export const getAllStaff = async () => {
  const { data } = await api.get("/staff");
  return data.data; // backend trả về RestaurantResponse.data
};

export interface Staff {
  id: number;
  name: string;        
  email: string;
  phoneNumber: string;
  createdAt: string;
  isActivated: boolean;
  userId: number;
  roles: string[];
}


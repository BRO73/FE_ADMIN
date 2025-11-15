// src/api/staff.api.ts
import axios from "@/api/axiosInstance";

// Role database từ backend (string)
export type StaffRoleDb = "WAITSTAFF" | "KITCHEN_STAFF" | "CASHIER" | "ADMIN";

export interface StaffResponse {
  id: number;
  name: string;                 // BE trả "name"
  email: string;
  phoneNumber: string;
  isActivated: boolean;
  createdAt: string;
  userId: number | null;
  roles: string[];              // BE trả Set<String>
}

export interface CreateStaffRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string; // string
}

export interface UpdateStaffRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  role?: string;
  isActivated?: boolean;
}

interface RestaurantResponse<T> {
  httpStatus: number;
  message: string;
  success: boolean;
  code: string;
  data: T;
}

/* ------------------------------
 * GET ALL STAFF  →  GET /api/staff
 * ------------------------------ */
export async function fetchStaffs(): Promise<StaffResponse[]> {
  const res = await axios.get<RestaurantResponse<StaffResponse[]>>("/staff");
  return res.data.data ?? [];
}

/* ------------------------------
 * CREATE STAFF  →  POST /api/staff
 * ------------------------------ */
export async function createStaff(body: CreateStaffRequest): Promise<StaffResponse> {
  const res = await axios.post<RestaurantResponse<StaffResponse>>("/staff", body);
  return res.data.data;
}

/* ------------------------------
 * UPDATE STAFF  →  PUT /api/staff/{id}
 * ------------------------------ */
export async function updateStaff(
  id: number,
  body: UpdateStaffRequest
): Promise<StaffResponse> {
  const res = await axios.put<RestaurantResponse<StaffResponse>>(`/staff/${id}`, body);
  return res.data.data;
}

/* ------------------------------
 * DELETE STAFF  →  DELETE /api/staff/{id}
 * ------------------------------ */
export async function deleteStaff(id: number): Promise<void> {
  await axios.delete(`/staff/${id}`);
}

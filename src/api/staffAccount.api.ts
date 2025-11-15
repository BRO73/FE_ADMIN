import axios from "@/api/axiosInstance";
import type { StaffRoleDb } from "./staff.api";

export interface StaffAccountResponse {
  id: number;
  username: string;
  role: StaffRoleDb | string;
  staffName: string;
  passwordText: string;
  createdAt: string;
}

export interface CreateStaffAccountRequest {
  staffId: number;
  username: string;
  password: string;
}

export interface UpdateUserAccountRequest {
  username: string;
  password?: string;
  role?: StaffRoleDb;
}

interface RestaurantResponse<T> {
  httpStatus: number;
  message: string;
  success: boolean;
  code: string;
  data: T;
}

export async function fetchUserAccounts(): Promise<StaffAccountResponse[]> {
  const res = await axios.get<RestaurantResponse<StaffAccountResponse[]>>(
    "/staff-accounts"
  );
  return Array.isArray(res.data.data) ? res.data.data : [];
}

export async function createUserAccount(
  body: CreateStaffAccountRequest
): Promise<StaffAccountResponse> {
  const res = await axios.post<RestaurantResponse<StaffAccountResponse>>(
    "/staff-accounts",
    body
  );
  return res.data.data;
}

export async function updateUserAccount(
  id: number,
  body: UpdateUserAccountRequest
): Promise<StaffAccountResponse> {
  const res = await axios.put<RestaurantResponse<StaffAccountResponse>>(
    `/staff-accounts/${id}`,
    body
  );
  return res.data.data;
}

export async function deleteUserAccount(id: number): Promise<void> {
  await axios.delete(`/staff-accounts/${id}`);
}

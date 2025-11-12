import axios from "./axiosInstance";

/** Enum role khớp BE (StaffRole) */
export type StaffRoleBE = string;

/** Wrapper cho toàn API của dự án */
export interface RestaurantResponse<T> {
    data: T;
    message?: string;
    status?: string;
}

/** Dòng user account trong bảng */
export interface UserAccountResponse {
    id: number;                  // userId
    username: string;
    role: StaffRoleBE;           // role của Staff
    staffName: string;
    passwordText: string | null; // prefill modal Edit
    createdAt: string;           // ISO
}

export interface UpdateUserAccountRequest {
    username: string;
    password?: string;           // gửi khi user muốn đổi (hoặc giữ nguyên theo prefill)
    role?: StaffRoleBE;          // "MANAGER" | "WAITER" | ...
}

/** GET /api/user-accounts — trả wrapper RestaurantResponse<UserAccountResponse[]> */
export async function fetchUserAccounts(): Promise<UserAccountResponse[]> {
    const res = await axios.get<RestaurantResponse<UserAccountResponse[]>>("user-accounts");
    return res.data.data;
}

/** PUT /api/user-accounts/{id} — trả wrapper RestaurantResponse<UserAccountResponse> */
export async function updateUserAccount(
    id: number,
    body: UpdateUserAccountRequest
): Promise<UserAccountResponse> {
    const res = await axios.put<RestaurantResponse<UserAccountResponse>>(`user-accounts/${id}`, body);
    return res.data.data;
}
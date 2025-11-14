// src/api/staffAccount.api.ts
import axios from "@/api/axiosInstance";

export interface StaffAccountResponse {
    id: number;          // userId
    username: string;
    role: string;        // từ Staff.role
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
    role?: string; // "ADMIN", "WAITSTAFF", "KITCHEN_STAFF", "CASHIER"
}

// Wrapper type từ BE
interface RestaurantResponse<T> {
    httpStatus: number;
    message: string;
    success: boolean;
    code: string;
    data: T;
}

// Type guard để check RestaurantResponse
function isRestaurantResponse<T>(value: unknown): value is RestaurantResponse<T> {
    return (
        typeof value === "object" &&
        value !== null &&
        "data" in value &&
        "success" in value
    );
}

// Helper unwrap response an toàn
function unwrap<T>(response: unknown): T {
    if (isRestaurantResponse<T>(response)) {
        return response.data;
    }
    return response as T;
}

// ========== GET all staff accounts ==========
export async function fetchUserAccounts(): Promise<StaffAccountResponse[]> {
    const res = await axios.get<RestaurantResponse<StaffAccountResponse[]>>("/staff-accounts");
    const body = res.data;                // RestaurantResponse<StaffAccountResponse[]>
    return Array.isArray(body.data) ? body.data : [];
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


// ========== DELETE staff account ==========
export async function deleteUserAccount(id: number): Promise<void> {
    await axios.delete(`/staff-accounts/${id}`);
}

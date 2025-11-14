// src/api/staff.api.ts
import axios from "@/api/axiosInstance";

export type StaffRoleBE = "WAITER" | "CHEF" | "CASHIER" | "ADMIN";

export interface StaffResponse {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    isActivated: boolean;
    createdAt: string;
    userId: number | null;
    role: string; // "WAITSTAFF", "KITCHEN_STAFF", "CASHIER", "ADMIN"...
}

export interface CreateStaffRequest {
    fullName: string;
    email: string;
    phoneNumber: string;
    storeId: number;
    role: StaffRoleBE;
}

export interface UpdateStaffRequest {
    fullName: string;
    email: string;
    phoneNumber: string;
    isActivated?: boolean;
    role?: StaffRoleBE;
}

// Vì baseURL đã là ".../api" nên path chỉ là "/staffs/..."
export async function fetchStaffs(): Promise<StaffResponse[]> {
    const res = await axios.get("/staffs/my-store-staff");

    type Wrapped = { data: StaffResponse[] };

    // res (runtime) = response.data do interceptor
    const payload = res as unknown;

    // Case 1: payload là StaffResponse[]
    if (Array.isArray(payload)) {
        return payload as StaffResponse[];
    }

    // Case 2: payload là RestaurantResponse<StaffResponse[]>
    if (
        typeof payload === "object" &&
        payload !== null &&
        "data" in payload &&
        Array.isArray((payload as Wrapped).data)
    ) {
        return (payload as Wrapped).data;
    }

    return [];
}


export async function createStaff(body: CreateStaffRequest): Promise<StaffResponse> {
    const res = await axios.post("/staffs", body);
    return res as unknown as StaffResponse;
}

export async function updateStaff(
    id: number,
    body: UpdateStaffRequest
): Promise<StaffResponse> {
    const res = await axios.put(`/staffs/${id}`, body);
    return res as unknown as StaffResponse;
}

export async function deleteStaff(id: number): Promise<void> {
    await axios.delete(`/staffs/${id}`);
}

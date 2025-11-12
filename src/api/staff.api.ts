import api from "@/api/axiosInstance";

/** ===== Roles (enum thuần) ===== */
export type StaffRoleBE =
    | "WAITER"
    | "MANAGER"
    | "CHEF"
    | "CLEANER"
    | "CASHIER"
    | "ADMIN";

/** Map BE role string -> FE enum thuần */
const ROLE_MAP_BE_TO_FE: Record<string, StaffRoleBE> = {
    "ROLE_WAITER": "WAITER",
    "ROLE_WAITSTAFF": "WAITER",
    "ROLE_MANAGER": "MANAGER",
    "ROLE_CHEF": "CHEF",
    "ROLE_KITCHEN_STAFF": "CHEF", // ✅ mới thêm
    "ROLE_CLEANER": "CLEANER",
    "ROLE_CASHIER": "CASHIER",
    "ROLE_ADMIN": "ADMIN",
    // Enum thuần + DB name
    "WAITER": "WAITER",
    "WAITSTAFF": "WAITER",
    "MANAGER": "MANAGER",
    "CHEF": "CHEF",
    "KITCHEN_STAFF": "CHEF", // ✅ mới thêm
    "CLEANER": "CLEANER",
    "CASHIER": "CASHIER",
    "ADMIN": "ADMIN",
};


/** Map FE enum thuần -> BE enum thuần (KHÔNG ROLE_) */
const ROLE_MAP_FE_TO_BE: Record<StaffRoleBE, string> = {
    WAITER: "WAITER",
    MANAGER: "MANAGER",
    CHEF: "CHEF",
    CLEANER: "CLEANER",
    CASHIER: "CASHIER",
    ADMIN: "ADMIN",
};

/** ===== Kiểu dữ liệu FE đã chuẩn hoá ===== */
export type StaffResponse = {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    isActivated: boolean;
    createdAt: string; // ISO
    storeName?: string | null;
    userId?: number | null;
    role: StaffRoleBE; // enum thuần
};

/** ===== Kiểu raw từ BE (chấp nhận nhiều biến thể field) ===== */
type StaffResponseRaw = {
    id: number;
    fullName?: string;
    full_name?: string;

    email: string;

    phoneNumber?: string;
    phone_number?: string;

    isActivated?: boolean;
    is_activated?: boolean;

    createdAt?: string;
    created_at?: string;

    storeName?: string | null;
    store_name?: string | null;

    userId?: number | null;
    user_id?: number | null;

    role?: string;       // một số BE
    staffRole?: string;  // một số BE khác
};

/** ===== Request types ===== */
export type CreateStaffRequest = {
    fullName: string;
    username: string;
    email: string;
    phoneNumber: string;
    /** Optional; nếu không truyền sẽ mặc định WAITER */
    role?: StaffRoleBE;
    storeId: number;
    initialPassword?: string;
};

export type UpdateStaffRequest = {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    isActivated?: boolean;
    role?: StaffRoleBE; // enum thuần
    username?: string; // nếu cần relink user
};

/** ===== Helpers: chuẩn hoá và map dữ liệu ===== */
function normalizeRole(input: string | undefined): StaffRoleBE {
    if (!input) return "WAITER";
    let up = String(input).trim().toUpperCase();
    if (up.startsWith("ROLE_")) up = up.slice(5); // strip ROLE_
    if (up === "WAITSTAFF") up = "WAITER";
    if (up === "KITCHEN_STAFF") up = "CHEF"; // ✅ thêm dòng này
    return ROLE_MAP_BE_TO_FE[up] ?? (up as StaffRoleBE);
}


function toFE(raw: StaffResponseRaw): StaffResponse {
    return {
        id: raw.id,
        fullName: raw.fullName ?? raw.full_name ?? "",
        email: raw.email,
        phoneNumber: raw.phoneNumber ?? raw.phone_number ?? "",
        isActivated: (raw.isActivated ?? raw.is_activated) ?? false,
        createdAt: raw.createdAt ?? raw.created_at ?? "",
        storeName: raw.storeName ?? raw.store_name ?? null,
        userId: raw.userId ?? raw.user_id ?? null,
        role: normalizeRole(raw.role ?? raw.staffRole),
    };
}

function toBECreate(payload: CreateStaffRequest) {
    const role = ROLE_MAP_FE_TO_BE[payload.role ?? "WAITER"]; // enum thuần
    return {
        fullName: payload.fullName,
        username: payload.username,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        role, // ✅ KHÔNG ROLE_
        storeId: payload.storeId,
        initialPassword: payload.initialPassword,
    };
}

function toBEUpdate(payload: UpdateStaffRequest) {
    // payload.role đã là enum thuần (CHEF/WAITER/...), gửi thẳng
    return {
        fullName: payload.fullName,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        isActivated: payload.isActivated,
        role: payload.role,    // ✅ KHÔNG ROLE_
        username: payload.username,
    };
}

/** ===== Base path (axiosInstance đã set baseURL = http://localhost:8082/api) ===== */
const STAFFS_PATH = "/staffs";

/** ===== API ===== */
export async function getMyStoreStaff(): Promise<StaffResponse[]> {
    const res = await api.get<StaffResponseRaw[]>(`${STAFFS_PATH}/my-store-staff`);
    const arr = Array.isArray(res.data) ? res.data : [];
    return arr.map(toFE);
}

export async function createStaff(payload: CreateStaffRequest): Promise<StaffResponse> {
    const body = toBECreate(payload);
    const res = await api.post<StaffResponseRaw>(`${STAFFS_PATH}`, body);
    return toFE(res.data);
}

export async function updateStaff(staffId: number, payload: UpdateStaffRequest): Promise<StaffResponse> {
    const body = toBEUpdate(payload);
    const res = await api.put<StaffResponseRaw>(`${STAFFS_PATH}/${staffId}`, body);
    return toFE(res.data);
}

export async function deleteStaff(staffId: number): Promise<void> {
    await api.delete<void>(`${STAFFS_PATH}/${staffId}`);
}

export { normalizeRole };

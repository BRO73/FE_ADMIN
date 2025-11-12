import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createStaff,
    getMyStoreStaff,
    updateStaff,
    deleteStaff,
    type CreateStaffRequest,
    type UpdateStaffRequest,
    type StaffResponse,
} from "@/api/staff.api";

/** Thống nhất queryKey dùng cho staff list */
export const STAFFS_QK = ["staffs", "my-store-staff"];

export function useStaffs() {
    return useQuery<StaffResponse[]>({
        queryKey: STAFFS_QK,
        queryFn: getMyStoreStaff,
    });
}

export function useCreateStaff() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateStaffRequest) => createStaff(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: STAFFS_QK }),
    });
}

export function useUpdateStaff() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateStaffRequest }) =>
            updateStaff(id, data),
        onSuccess: (res) => {
            // merge lạc quan + refetch
            qc.setQueryData<StaffResponse[] | undefined>(STAFFS_QK, (old) =>
                Array.isArray(old) ? old.map((s) => (s.id === res.id ? res : s)) : old
            );
            qc.invalidateQueries({ queryKey: STAFFS_QK });
        },
    });
}

export function useDeleteStaff() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteStaff(id),
        onSuccess: (_, id) => {
            qc.setQueryData<StaffResponse[] | undefined>(STAFFS_QK, (old) =>
                Array.isArray(old) ? old.filter((s) => s.id !== id) : old
            );
            qc.invalidateQueries({ queryKey: STAFFS_QK });
        },
    });
}

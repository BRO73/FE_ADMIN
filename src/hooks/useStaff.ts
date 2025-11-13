// src/hooks/useStaff.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchStaffs,
    createStaff,
    updateStaff,
    deleteStaff,
    type StaffResponse,
    type CreateStaffRequest,
    type UpdateStaffRequest,
} from "@/api/staff.api";

export function useStaffs() {
    return useQuery<StaffResponse[]>({
        queryKey: ["staffs", "my-store-staff"],
        queryFn: fetchStaffs,
    });
}

export function useCreateStaff() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateStaffRequest) => createStaff(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["staffs"] });
            qc.invalidateQueries({ queryKey: ["staffs", "my-store-staff"] });
        },
    });
}

export function useUpdateStaff() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (p: { id: number; data: UpdateStaffRequest }) => updateStaff(p.id, p.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["staffs"] });
            qc.invalidateQueries({ queryKey: ["staffs", "my-store-staff"] });
        },
    });
}

export function useDeleteStaff() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteStaff(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["staffs"] });
            qc.invalidateQueries({ queryKey: ["staffs", "my-store-staff"] });
        },
    });
}

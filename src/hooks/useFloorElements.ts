import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getAllFloorElementsApi,
    getFloorElementByIdApi,
    createFloorElementApi,
    updateFloorElementApi,
    deleteFloorElementApi,
} from "@/api/elementApi.ts";
import { FloorElementRequest } from "@/types/type";

// 🔹 Fetch all
export const useFloorElements = () => {
    return useQuery({
        queryKey: ["floor-elements"],
        queryFn: getAllFloorElementsApi,
    });
};

// 🔹 Fetch one by id
export const useFloorElement = (id: number) => {
    return useQuery({
        queryKey: ["floor-element", id],
        queryFn: () => getFloorElementByIdApi(id),
        enabled: !!id,
    });
};

// 🔹 Create new
export const useCreateFloorElement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createFloorElementApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["floor-elements"] });
        },
    });
};

// 🔹 Update
export const useUpdateFloorElement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FloorElementRequest }) =>
            updateFloorElementApi(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["floor-elements"] });
        },
    });
};

// 🔹 Delete
export const useDeleteFloorElement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteFloorElementApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["floor-elements"] });
        },
    });
};

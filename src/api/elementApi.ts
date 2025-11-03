import api from "@/api/axiosInstance";
import { FloorElementRequest, FloorElementResponse } from "@/types/type";

// 🧭 Mapper: API → UI
export const mapToFloorElement = (res: FloorElementResponse) => ({
    id: res.id,
    type: res.type,
    x: res.x,
    y: res.y,
    width: res.width,
    height: res.height,
    rotation: res.rotation,
    color: res.color,
    label: res.label,
    floor: res.floor,
    tableId: res.tableId
});

// --- 📡 API functions ---

export const getAllFloorElementsApi = async () => {
    const { data } = await api.get<FloorElementResponse[]>("/elements");
    return data.map(mapToFloorElement);
};

export const getFloorElementByIdApi = async (id: number) => {
    const { data } = await api.get<FloorElementResponse>(`/elements/${id}`);
    return mapToFloorElement(data);
};

export const createFloorElementApi = async (payload: FloorElementRequest) => {
    const { data } = await api.post<FloorElementResponse>("/elements", payload);
    return mapToFloorElement(data);
};

export const updateFloorElementApi = async (id: number, payload: FloorElementRequest) => {
    const { data } = await api.put<FloorElementResponse>(`/elements/${id}`, payload);
    return mapToFloorElement(data);
};

export const deleteFloorElementApi = async (id: number) => {
    await api.delete(`/elements/${id}`);
};

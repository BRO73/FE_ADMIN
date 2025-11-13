import api from "@/api/axiosInstance";
import { TableResponse, TableFormData } from "@/types/type";

// Mapper: API → UI
const mapToTable = (res: TableResponse): TableResponse => ({
  id: res.id,
  tableNumber: res.tableNumber,
  capacity: res.capacity,
  locationId: res.locationId,
  locationName: res.locationName,
  status: res.status as "Available" | "Occupied" | "Reserved" | "Maintenance",
});

// --- API functions ---
export const getAllTables = async (): Promise<TableResponse[]> => {
  const { data } = await api.get<TableResponse[]>("/tables");
  return data.map(mapToTable);
};

export const getTableById = async (id: number): Promise<TableResponse> => {
  const { data } = await api.get<TableResponse>(`/tables/${id}`);
  return mapToTable(data);
};

export const createTable = async (
  payload: TableFormData
): Promise<TableResponse> => {
  const { data } = await api.post<TableResponse>("/tables", payload);
  return mapToTable(data);
};

export const updateTable = async (
  id: number,
  payload: TableFormData
): Promise<TableResponse> => {
  const { data } = await api.put<TableResponse>(`/tables/${id}`, payload);
  return mapToTable(data);
};

export const deleteTable = async (id: number): Promise<void> => {
  await api.delete(`/tables/${id}`);
};

export const getTablesByLocation = async (
  locationId: number
): Promise<TableResponse[]> => {
  const { data } = await api.get<TableResponse[]>(
    `/tables/location/${locationId}`
  );
  return data.map(mapToTable);
};

export const getTablesByStatus = async (
  status: "Available" | "Occupied" | "Reserved" | "Maintenance"
): Promise<TableResponse[]> => {
  const { data } = await api.get<TableResponse[]>(`/tables/status/${status}`);
  return data.map(mapToTable);
};

export  const getTableStatusByDay = async (date: string) => {
    const { data } = await api.get<TableResponse[]>(`/tables/day/${date}`);
    return data.map(mapToTable);
}

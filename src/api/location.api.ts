import api from "@/api/axiosInstance";
import { LocationResponse, LocationFormData } from "@/types/type";

export const getAllLocations = async (): Promise<LocationResponse[]> => {
  const { data } = await api.get<LocationResponse[]>("/locations");
  return data;
};

export const getLocationById = async (id: number): Promise<LocationResponse> => {
  const { data } = await api.get<LocationResponse>(`/locations/${id}`);
  return data;
};

export const createLocation = async (payload: LocationFormData): Promise<LocationResponse> => {
  const { data } = await api.post<LocationResponse>("/locations", payload);
  return data;
};

export const updateLocation = async (id: number, payload: LocationFormData): Promise<LocationResponse> => {
  const { data } = await api.put<LocationResponse>(`/locations/${id}`, payload);
  return data;
};

export const deleteLocation = async (id: number): Promise<void> => {
  await api.delete(`/locations/${id}`);
};

import { useEffect, useState } from "react";
import {
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "@/api/location.api";
import { LocationResponse, LocationFormData } from "@/types/type";

export const useLocations = () => {
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await getAllLocations();
      setLocations(data);
    } catch {
      setError("Failed to fetch locations");
    } finally {
      setLoading(false);
    }
  };

  const addLocation = async (payload: LocationFormData) => {
    const newLoc = await createLocation(payload);
    setLocations((prev) => [...prev, newLoc]);
  };

  const editLocation = async (id: number, payload: LocationFormData) => {
    const updated = await updateLocation(id, payload);
    setLocations((prev) => prev.map((l) => (l.id === id ? updated : l)));
  };

  const removeLocation = async (id: number) => {
    await deleteLocation(id);
    setLocations((prev) => prev.filter((l) => l.id !== id));
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  return { locations, loading, error, addLocation, editLocation, removeLocation };
};

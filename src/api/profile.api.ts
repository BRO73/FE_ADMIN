import api from "@/api/axiosInstance";

export const updateProfile = async (payload: {
  fullName: string;
  email: string;
  phoneNumber: string;
}) => {
  const { data } = await api.put("/users/profile", payload);
  return data.data;
};

import api from "@/api/axiosInstance";
import { CustomerResponse } from "@/types/type";

const mapToCustomer = (res: CustomerResponse): CustomerResponse => ({
    userId: res.userId,
    fullName: res.fullName,
    phoneNumber: res.phoneNumber,
    email: res.email,
    id: res.id,
});


export const getAllCustomers = async (): Promise<CustomerResponse[]> => {
    const { data } = await api.get<CustomerResponse[]>("/customers");
    return data.map(mapToCustomer);
};


export const deleteCustomer = async (id: number): Promise<void> => {
    await api.delete(`/customers/${id}`);
  };

import api from './axiosInstance';
import { BookingRequest, BookingResponse } from '@/types/type.ts';

/**
 * 🟢 Tạo mới booking
 */
export const createBooking = async (bookingData: BookingRequest): Promise<BookingResponse> => {
    try {
        const response = await api.post<BookingResponse>('/bookings', bookingData);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to create booking.');
    }
};

/**
 * 🟡 Cập nhật booking
 */
export const updateBooking = async (id: number, bookingData: BookingRequest): Promise<BookingResponse> => {
    try {
        const response = await api.put<BookingResponse>(`/bookings/${id}`, bookingData);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to update booking.');
    }
};

/**
 * 🔴 Xóa booking
 */
export const deleteBooking = async (id: number): Promise<void> => {
    try {
        await api.delete(`/bookings/${id}`);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to delete booking.');
    }
};

/**
 * 🔍 Kiểm tra bàn có khả dụng hay không
 */
export const checkTableAvailability = async (
    tableId: number,
    bookingTime: string
): Promise<{ available: boolean }> => {
    try {
        const response = await api.get<{ available: boolean }>('/bookings/check-availability', {
            params: { tableId, bookingTime },
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to check table availability.');
    }
};

/**
 * 📋 Lấy tất cả booking
 */
export const getAllBookings = async (): Promise<BookingResponse[]> => {
    try {
        const response = await api.get<BookingResponse[]>('/bookings');
        return response.data;
    } catch (error: any) {
        throw new Error('Failed to fetch bookings.');
    }
};

/**
 * 🔎 Lấy chi tiết booking theo ID
 */
export const getBookingById = async (id: number): Promise<BookingResponse> => {
    try {
        const response = await api.get<BookingResponse>(`/bookings/${id}`);
        return response.data;
    } catch (error: any) {
        throw new Error('Failed to fetch booking details.');
    }
};

/**
 * 👤 Lấy danh sách booking theo khách hàng
 */
export const getBookingsByCustomer = async (customerUserId: number): Promise<BookingResponse[]> => {
    try {
        const response = await api.get<BookingResponse[]>(`/bookings/customer/${customerUserId}`);
        return response.data;
    } catch (error: any) {
        throw new Error('Failed to fetch customer bookings.');
    }
};

/**
 * 🧩 Format dữ liệu booking từ form người dùng sang BookingRequest
 */
const formatBookingTime = (rawTime: string) => {
    // Trường hợp HH:mm
    if (/^\d{2}:\d{2}$/.test(rawTime)) {
        return `${rawTime}:00`;
    }

    // Trường hợp HH:mm:ss → giữ nguyên
    if (/^\d{2}:\d{2}:\d{2}$/.test(rawTime)) {
        return rawTime;
    }

    // Trường hợp ISO string YYYY-MM-DDTHH:mm → chuyển thành YYYY-MM-DDTHH:mm:00
    const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (isoPattern.test(rawTime)) {
        return `${rawTime}:00`;
    }

    // fallback giữ nguyên
    return rawTime;
};

export const formatBookingData = (rawData: BookingRequest): BookingRequest => {
    const bookingTime = formatBookingTime(rawData.bookingTime);
    console.log("send data",bookingTime);
    const formattedPhone = rawData.customerPhone.replace(/\D/g, '');

    return {
        customerName: rawData.customerName.trim(),
        customerPhone: formattedPhone,
        customerEmail: rawData.customerEmail.trim(),
        bookingTime,
        numGuests: Number(rawData.numGuests),
        tableIds: rawData.tableIds || [],
        status: rawData.status || 'Pending',
        notes: rawData.notes || '',
        staffId: rawData.staffId || undefined,
    };
};

export default {
    createBooking,
    updateBooking,
    deleteBooking,
    getAllBookings,
    getBookingById,
    getBookingsByCustomer,
    checkTableAvailability,
    formatBookingData,
};

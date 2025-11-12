import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    getAllBookings,
    createBooking,
    updateBooking,
    deleteBooking,
    formatBookingData,
} from "@/api/bookingApi";

import { BookingRequest, BookingResponse } from "@/types/type.ts";

export const useBooking = () => {
    const { toast } = useToast();

    const [bookings, setBookings] = useState<BookingResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ✅ Hàm sắp xếp theo thời gian (mới nhất trước)
    const sortByBookingTimeDesc = (list: BookingResponse[]) => {
        return [...list].sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
        );
    };

    /**
     * ✅ Lấy tất cả bookings khi khởi tạo
     */
    const fetchBookings = async () => {
        setLoading(true);
        try {
            const data = await getAllBookings();
            setBookings(sortByBookingTimeDesc(data));
        } catch (err: any) {
            setError(err.message);
            toast({
                title: "Error",
                description: "Failed to load bookings.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    /**
     * ✅ Tạo mới booking
     */
    const addBooking = async (rawData: any) => {
        setLoading(true);
        try {
            const formatted: BookingRequest = formatBookingData(rawData);
            const newBooking = await createBooking(formatted);
            setBookings((prev) => sortByBookingTimeDesc([...prev, newBooking]));
            toast({
                title: "Booking Created",
                description: "New booking has been successfully created.",
            });
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to create booking.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * ✅ Cập nhật booking
     */
    const editBooking = async (id: number, data: BookingRequest) => {
        setLoading(true);
        console.log("edit for Booking:", data);
        try {
            const formatted: BookingRequest = formatBookingData(data);
            const updated = await updateBooking(id, formatted);
            setBookings((prev) =>
                sortByBookingTimeDesc(prev.map((b) => (b.id === id ? updated : b)))
            );
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to update booking.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * ✅ Xóa booking (hoặc hủy)
     */
    const removeBooking = async (id: number) => {
        setLoading(true);
        try {
            await deleteBooking(id);
            setBookings((prev) =>
                sortByBookingTimeDesc(prev.filter((b) => b.id !== id))
            );
            toast({
                title: "Booking Deleted",
                description: "Booking has been successfully removed.",
            });
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to delete booking.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return {
        bookings,
        loading,
        error,
        fetchBookings,
        addBooking,
        editBooking,
        removeBooking,
    };
};

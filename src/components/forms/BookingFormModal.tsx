import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTables } from "@/hooks/useTables";
import { Checkbox } from "@/components/ui/checkbox";
import {BookingRequest, BookingResponse} from "@/types/type.ts";
import {format} from "date-fns";


// ✅ Schema khớp hoàn toàn BookingRequest
const bookingSchema = z.object({
    tableIds: z.array(z.number()).min(1, "Phải chọn ít nhất 1 bàn"),
    customerName: z.string().min(2, "Tên khách hàng tối thiểu 2 ký tự"),
    customerPhone: z.string().min(8, "Số điện thoại không hợp lệ"),
    customerEmail: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
    numGuests: z.coerce.number().min(1, "Phải có ít nhất 1 khách"),
    status: z.enum(["pending", "confirmed", "cancelled", "completed"]).default("pending"),
    notes: z.string().optional(),
    staffId: z.number().optional(),
    bookingTime: z.string().min(1, "Thời gian đặt bàn không được để trống"),
});

// nếu BookingFormData chính là BookingRequest thì alias:
type BookingFormData = BookingRequest; // or keep infer typeof zod schema

interface BookingFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    // onSubmit trả Promise<void> và nhận đúng BookingFormData (không optional)
    onSubmit: (data: BookingFormData) => Promise<void> | void;
    booking?: BookingResponse;
    mode: "add" | "edit";
}


const BookingFormModal = ({ isOpen, onClose, onSubmit, booking, mode }: BookingFormModalProps) => {
    const { toast } = useToast();
    const { getTableByDay,tables, loading: tablesLoading } = useTables();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [date, setDate] = useState<Date | undefined>(new Date());

    const form = useForm<BookingFormData>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            tableIds: [],
            customerName: "",
            customerPhone: "",
            customerEmail: "",
            numGuests: 1,
            status: "pending",
            notes: "",
            bookingTime: new Date().toISOString().slice(0, 16),
        },
    });
    const handleSelectDate = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedDateTime = e.target.value; // ví dụ: "2025-11-06T20:30"
        const selectedDate = selectedDateTime.split("T")[0]; // 👉 "2025-11-06"
        const formatted = format(selectedDate, "yyyy-MM-dd");
        updateTables(formatted);
    };

    async function updateTables(  date : string){
        await getTableByDay(date);
    }


    // ✅ Load khi edit
    useEffect(() => {
        if (booking && mode === "edit") {
            const tableIds = booking.table?.map((t: any) => t.id) || [];
            const totalCapacity = booking.table?.reduce((acc: number, t: any) => acc + (t.capacity || 0), 0);

            form.reset({
                tableIds,
                customerName: booking.customerName || "",
                customerPhone: booking.customerPhone || "",
                customerEmail: booking.customerEmail || "",
                numGuests: totalCapacity || booking.numGuests || 1,
                status: (booking.status as "pending" | "confirmed" | "cancelled" | "completed") || "pending",
                notes: booking.notes || "",
                bookingTime: booking.bookingTime
                    ? booking.bookingTime.slice(0, 16) // cắt dạng yyyy-MM-ddTHH:mm
                    : new Date().toISOString().slice(0, 16),
            });
        } else if (mode === "add") {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            form.reset({
                tableIds: [],
                customerName: "",
                customerPhone: "",
                customerEmail: "",
                numGuests: 1,
                status: "pending",
                notes: "",
                bookingTime: tomorrow.toISOString().slice(0, 16),
            });
        }
    }, [booking, mode, form]);

    // ✅ Khi chọn bàn → tính tổng capacity
    const handleTableSelect = (tableId: number) => {
        const currentIds = form.getValues("tableIds");
        const newIds = currentIds.includes(tableId)
            ? currentIds.filter((id) => id !== tableId)
            : [...currentIds, tableId];

        form.setValue("tableIds", newIds);

        // Tính tổng capacity
        const totalCapacity = tables
            .filter((t) => newIds.includes(t.id))
            .reduce((sum, t) => sum + (t.capacity || 0), 0);

        form.setValue("numGuests", totalCapacity);
    };

    const handleSubmit = async (data: BookingFormData) => {
        setIsSubmitting(true);
        try {
            // format bookingTime sang ISO chuẩn có giây
            const formattedData = {
                ...data
            };
            await onSubmit(formattedData);
            toast({
                title: mode === "add" ? "Đã tạo đặt bàn" : "Đã cập nhật đặt bàn",
                description: `Khách hàng: ${data.customerName}`,
            });
            form.reset();
            onClose?.();
        } catch {
            toast({
                title: "Lỗi",
                description: "Không thể lưu đặt bàn. Vui lòng thử lại.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        form.reset();
        onClose();
    };

    const selectedTables = form.watch("tableIds");
    const totalCapacity = tables
        .filter((t) => selectedTables.includes(t.id))
        .reduce((sum, t) => sum + (t.capacity || 0), 0);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === "add" ? "Đặt bàn mới" : "Chỉnh sửa đặt bàn"}</DialogTitle>
                    <DialogDescription>
                        {mode === "add"
                            ? "Điền thông tin khách hàng và chọn bàn để tạo đặt chỗ."
                            : "Cập nhật thông tin chi tiết của đơn đặt bàn."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

                        {/* Tên khách hàng */}
                        <FormField
                            control={form.control}
                            name="customerName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên khách hàng</FormLabel>
                                    <FormControl><Input {...field} placeholder="Nguyễn Văn A" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* SĐT & email */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="customerPhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số điện thoại</FormLabel>
                                        <FormControl><Input {...field} placeholder="0987 654 321" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="customerEmail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl><Input type="email" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        {/* Thời gian đặt */}
                        <FormField
                            control={form.control}
                            name="bookingTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Thời gian đặt</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="datetime-local"
                                            {...field}
                                            onChange={(e) => {
                                                field.onChange(e); // ✅ cập nhật giá trị cho form
                                                handleSelectDate(e); // ✅ gọi thêm logic riêng của m
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Chọn bàn */}
                        <FormItem>
                            <FormLabel>Chọn bàn</FormLabel>
                            <div className="grid grid-cols-2 gap-2 border p-2 rounded-md">
                                {tablesLoading ? (
                                    <p>Đang tải danh sách bàn...</p>
                                ) : (
                                    tables.filter((t)=>t.status.toLowerCase() === "available").map((t) => (
                                        <div key={t.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                checked={selectedTables.includes(t.id)}
                                                onCheckedChange={() => handleTableSelect(t.id)}
                                            />
                                            <label>
                                                {t.tableNumber} ({t.capacity} người)
                                            </label>
                                        </div>
                                    ))
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Tổng sức chứa: <strong>{totalCapacity}</strong> người
                            </p>
                        </FormItem>



                        {/* Trạng thái */}
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Trạng thái</FormLabel>
                                    <FormControl>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Đang chờ</SelectItem>
                                                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                                                <SelectItem value="cancelled">Đã huỷ</SelectItem>
                                                <SelectItem value="completed">Hoàn tất</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Ghi chú */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ghi chú</FormLabel>
                                    <FormControl><Textarea {...field} placeholder="Yêu cầu đặc biệt..." /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                                Huỷ
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Đang lưu..." : mode === "add" ? "Tạo đặt bàn" : "Cập nhật"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default BookingFormModal;

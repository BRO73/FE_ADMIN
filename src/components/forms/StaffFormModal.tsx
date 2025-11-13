// src/components/forms/StaffFormModal.tsx
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/** ✨ Schema chỉ còn 4 vai trò + không còn initialPassword */
const staffSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
    role: z.enum(["waiter", "chef", "cashier", "admin"]),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    joinDate: z.string().min(1, "Join date is required"),
});

export type StaffFormData = z.infer<typeof staffSchema>;

interface Staff {
    id: number;
    name: "waiter" | "chef" | "cashier" | "admin" | string;
    role: "waiter" | "chef" | "cashier" | "admin";
    email: string;
    phone: string;
    joinDate: string;
}

interface StaffFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: StaffFormData) => void | Promise<void>;
    staff?: Staff;
    mode: "add" | "edit";
    isEmailTaken?: (email: string, excludeId?: number) => boolean;
    isPhoneTaken?: (phone: string, excludeId?: number) => boolean;
}

const StaffFormModal = ({
                            isOpen,
                            onClose,
                            onSubmit,
                            staff,
                            mode,
                            isEmailTaken,
                            isPhoneTaken,
                        }: StaffFormModalProps) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<StaffFormData>({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            name: "",
            role: "waiter",
            email: "",
            phone: "",
            joinDate: new Date().toISOString().split("T")[0],
        },
    });

    useEffect(() => {
        if (staff && mode === "edit") {
            form.setValue("name", String(staff.name));
            form.setValue("role", staff.role);
            form.setValue("email", staff.email);
            form.setValue("phone", staff.phone);
            form.setValue("joinDate", staff.joinDate);
        } else if (mode === "add") {
            form.reset({
                name: "",
                role: "waiter",
                email: "",
                phone: "",
                joinDate: new Date().toISOString().split("T")[0],
            });
        }
    }, [staff, mode, form]);

    const handleSubmit = async (data: StaffFormData) => {
        setIsSubmitting(true);
        try {
            const trimmedEmail = data.email.trim().toLowerCase();
            const normalizedPhone = data.phone.replace(/[^\d]/g, "");

            const excludeId = mode === "edit" && staff ? staff.id : undefined;
            let hasError = false;

            form.clearErrors(["email", "phone"]);

            if (isEmailTaken && trimmedEmail) {
                const duplicated = isEmailTaken(trimmedEmail, excludeId);
                if (duplicated) {
                    form.setError("email", {
                        type: "manual",
                        message: "Email already exists",
                    });
                    hasError = true;
                }
            }

            if (isPhoneTaken && normalizedPhone) {
                const duplicated = isPhoneTaken(normalizedPhone, excludeId);
                if (duplicated) {
                    form.setError("phone", {
                        type: "manual",
                        message: "Phone number already exists",
                    });
                    hasError = true;
                }
            }

            if (hasError) return;

            const payload: StaffFormData = {
                ...data,
                email: trimmedEmail,
                phone: normalizedPhone,
            };

            await onSubmit(payload);
        } catch (e) {
            const msg =
                e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.";
            toast({
                title: "Error",
                description: msg,
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

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "add" ? "Add New Staff Member" : "Edit Staff Member"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "add"
                            ? "Add a new staff member to your team."
                            : "Update the staff member information."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Smith" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <FormControl>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="waiter">Waiter</SelectItem>
                                                <SelectItem value="chef">Chef</SelectItem>
                                                <SelectItem value="cashier">Cashier</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="john@restaurant.com"
                                            {...field}
                                            onBlur={(e) => {
                                                const value = e.target.value.trim();
                                                form.setValue("email", value);
                                                field.onBlur();
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="+1 234-567-8901"
                                            {...field}
                                            onBlur={(e) => {
                                                const value = e.target.value.replace(/[^\d]/g, "");
                                                form.setValue("phone", value);
                                                field.onBlur();
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="joinDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Join Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : mode === "add" ? "Add Staff Member" : "Update Staff Member"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default StaffFormModal;

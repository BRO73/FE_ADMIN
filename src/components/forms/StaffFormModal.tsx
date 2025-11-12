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

/** ✨ Schema chỉ còn 4 vai trò hợp lệ */
const staffSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
    role: z.enum(["waiter", "chef", "cashier", "admin"]),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    joinDate: z.string().min(1, "Join date is required"),
    initialPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
});

type StaffFormData = z.infer<typeof staffSchema>;

interface Staff {
    id: number;
    name: string;
    role: "waiter" | "chef" | "cashier" | "admin";
    email: string;
    phone: string;
    joinDate: string;
}

interface StaffFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: StaffFormData) => void;
    staff?: Staff;
    mode: "add" | "edit";
}

const StaffFormModal = ({ isOpen, onClose, onSubmit, staff, mode }: StaffFormModalProps) => {
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
            initialPassword: "123456",
        },
    });

    useEffect(() => {
        if (staff && mode === "edit") {
            form.setValue("name", staff.name);
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
                initialPassword: "123456",
            });
        }
    }, [staff, mode, form]);

    const handleSubmit = async (data: StaffFormData) => {
        setIsSubmitting(true);
        try {
            onSubmit(data);
            toast({
                title: mode === "add" ? "Staff Member Added" : "Staff Member Updated",
                description: `${data.name} has been ${mode === "add" ? "added" : "updated"} successfully.`,
            });
            onClose();
            form.reset();
        } catch {
            toast({
                title: "Error",
                description: "Something went wrong. Please try again.",
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
                                        <Input type="email" placeholder="john@restaurant.com" {...field} />
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
                                        <Input placeholder="+1 234-567-8901" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {mode === "add" && (
                            <FormField
                                control={form.control}
                                name="initialPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Initial Password</FormLabel>
                                        <FormControl>
                                            <Input type="text" placeholder="Default: 123456" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        <p className="text-sm text-muted-foreground">
                                            Default password for the user account. Can be changed later.
                                        </p>
                                    </FormItem>
                                )}
                            />
                        )}

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

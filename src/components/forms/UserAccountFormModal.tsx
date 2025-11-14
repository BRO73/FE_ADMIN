// src/components/forms/UserAccountFormModal.tsx
import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface UserAccountModalData {
    id: number;
    username: string;
    role: string; // DB role name: "WAITSTAFF", "KITCHEN_STAFF", "CASHIER", "ADMIN"
    passwordText?: string | null;
}

type SubmitPayload = {
    username: string;
    password?: string;
    role?: string; // gửi thẳng DB role string lên BE
};

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    initial?: UserAccountModalData | null;
    onSubmit: (payload: SubmitPayload) => void;
}

const UserAccountFormModal: React.FC<Props> = ({ open, onOpenChange, initial, onSubmit }) => {
    const [username, setUsername] = React.useState<string>("");
    const [password, setPassword] = React.useState<string>("");
    const [role, setRole] = React.useState<string>("WAITSTAFF"); // default waiter

    useEffect(() => {
        if (initial) {
            setUsername(initial.username ?? "");
            setPassword(initial.passwordText ?? "");
            setRole((initial.role ?? "WAITSTAFF").toUpperCase());
        } else {
            setUsername("");
            setPassword("");
            setRole("WAITSTAFF");
        }
    }, [initial, open]);

    const handleSave = () => {
        const payload: SubmitPayload = { username };
        if (password) payload.password = password;
        if (role) payload.role = role; // ví dụ: "ADMIN" / "WAITSTAFF" / "KITCHEN_STAFF" / "CASHIER"
        onSubmit(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit User Account</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        You can change the password or user role here.
                    </p>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Username</Label>
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username..."
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Password</Label>
                        <Input
                            type="text"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter new password..."
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Role</Label>
                        <select
                            className="border rounded-md p-2"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="ADMIN">Admin</option>
                            <option value="WAITSTAFF">Waiter</option>
                            <option value="KITCHEN_STAFF">Chef</option>
                            <option value="CASHIER">Cashier</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>Update Account</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UserAccountFormModal;

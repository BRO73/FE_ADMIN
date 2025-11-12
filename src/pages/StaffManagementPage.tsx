import { useMemo, useState, type ComponentProps } from "react";
import { Plus, Edit, Trash2, Search, Phone, Mail, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import StaffFormModal from "@/components/forms/StaffFormModal";
import UserAccountFormModal from "@/components/forms/UserAccountFormModal";
import DeleteConfirmDialog from "@/components/forms/DeleteConfirmDialog";
import { useStaffs, useCreateStaff, useUpdateStaff, useDeleteStaff } from "@/hooks/useStaff";
import type { StaffResponse, UpdateStaffRequest, StaffRoleBE } from "@/api/staff.api";
import {
    fetchUserAccounts,
    updateUserAccount,
    type UserAccountResponse as UserAccountRowBE,
} from "@/api/userAccount.api";

/* =========================
 * Types
 * ========================= */
type StaffModalProps = ComponentProps<typeof StaffFormModal>;
type ModalStaff = StaffModalProps["staff"];
type ModalOnSubmit = NonNullable<StaffModalProps["onSubmit"]>;

/** Chỉ còn 4 role hợp lệ */
type UiRole = "waiter" | "chef" | "cashier" | "admin";
type UiAccountRole = UiRole;

type AdminStaffRow = {
    id: number;
    name: string;
    role: UiRole;
    email: string;
    phone: string;
    joinDate: string;
};

type AccountRow = {
    id: number;
    name: string; // username
    role: UiAccountRole;
    createdAt: string;
    passwordText?: string;
};

type SelectedUA = {
    id: number;
    username: string;
    role: string; // "ROLE_*"
    passwordText?: string;
};
type UAPayload = {
    username?: string;
    role?: string; // "ROLE_*"
    password?: string;
};
type UAInitial = SelectedUA;

/* =========================
 * Role helpers
 * ========================= */

/** BE -> UI (chỉ map về 4 role) */
const normalizeRoleToUi = (beRole?: string): UiRole => {
    const raw = (beRole ?? "").trim().toUpperCase();
    const noPrefix = raw.startsWith("ROLE_") ? raw.slice(5) : raw;
    switch (noPrefix) {
        case "ADMIN":
            return "admin";
        case "CHEF":
        case "KITCHEN_STAFF":
            return "chef";
        case "CASHIER":
            return "cashier";
        case "WAITER":
        case "WAITSTAFF":
        default:
            return "waiter";
    }
};

/** UI -> BE (Staff service – enum thuần, không có ROLE_) */
const UI_TO_BE_STAFF: Record<UiRole, string> = {
    waiter: "WAITER",
    chef: "CHEF",
    cashier: "CASHIER",
    admin: "ADMIN",
};

/** UI -> BE (UserAccount service – ROLE_*) */
const UI_TO_BE_ACCOUNT: Record<UiRole, string> = {
    waiter: "ROLE_WAITER",
    chef: "ROLE_CHEF",
    cashier: "ROLE_CASHIER",
    admin: "ROLE_ADMIN",
};

const ROLE_LABEL: Record<UiRole, string> = {
    waiter: "Waiter",
    chef: "Chef",
    cashier: "Cashier",
    admin: "Admin",
};

/** BE (string bất kỳ) -> UI role cho bảng Accounts (fallback = waiter) */
const BE_TO_UI_ACCOUNT: Record<string, UiAccountRole> = {
    ROLE_WAITER: "waiter",
    ROLE_WAITSTAFF: "waiter",
    ROLE_CHEF: "chef",
    ROLE_KITCHEN_STAFF: "chef",
    ROLE_CASHIER: "cashier",
    ROLE_ADMIN: "admin",
    WAITER: "waiter",
    WAITSTAFF: "waiter",
    CHEF: "chef",
    KITCHEN_STAFF: "chef",
    CASHIER: "cashier",
    ADMIN: "admin",
};

/* Helper lấy message lỗi */
const extractErrorMessage = (e: unknown): string => {
    if (typeof e === "object" && e !== null) {
        const resp = (e as { response?: { data?: { message?: unknown } } }).response;
        const msg = resp?.data?.message;
        if (typeof msg === "string") return msg;
    }
    return "Operation failed";
};

const StaffManagementPage = () => {
    const { toast } = useToast();
    const qc = useQueryClient();

    // ==== State (Staff) ====
    const [searchTerm, setSearchTerm] = useState("");
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [formMode, setFormMode] = useState<"add" | "edit">("add");
    const [selectedRow, setSelectedRow] = useState<AdminStaffRow | undefined>();
    const [selectedModalStaff, setSelectedModalStaff] = useState<ModalStaff | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ==== Hooks Staff API ====
    const { data: staffData, isLoading: isStaffLoading } = useStaffs();
    const { mutateAsync: createStaffMut } = useCreateStaff();
    const { mutateAsync: updateStaffMut } = useUpdateStaff();
    const { mutateAsync: deleteStaffMut } = useDeleteStaff();

    // Map Staff BE -> UI
    const staffList: AdminStaffRow[] = useMemo(() => {
        const raw = staffData ?? [];
        return raw.map((s: StaffResponse) => ({
            id: s.id,
            name: s.fullName,
            role: normalizeRoleToUi(s.role),
            email: s.email,
            phone: s.phoneNumber,
            joinDate: s.createdAt ? s.createdAt.slice(0, 10) : "",
        }));
    }, [staffData]);

    const filteredStaff = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return staffList;
        return staffList.filter((m) => {
            const roleLabel = ROLE_LABEL[m.role].toLowerCase();
            return m.name.toLowerCase().includes(q) || roleLabel.includes(q) || m.email.toLowerCase().includes(q);
        });
    }, [searchTerm, staffList]);

    // ==== Accounts (real BE) ====
    const [userSearchTerm, setUserSearchTerm] = useState("");
    const [isUserFormModalOpen, setIsUserFormModalOpen] = useState(false);
    const [isUserDeleteDialogOpen, setIsUserDeleteDialogOpen] = useState(false);
    const [selectedUserAccount, setSelectedUserAccount] = useState<SelectedUA | undefined>();

    // GET user accounts
    const { data: accountsRes, isLoading: isAccountsLoading } = useQuery<UserAccountRowBE[]>({
        queryKey: ["user-accounts"],
        queryFn: fetchUserAccounts,
    });

    // Map BE -> AccountRow (render bảng)
    const userAccounts = useMemo<AccountRow[]>(() => {
        const rows = accountsRes ?? [];
        return rows.map((u) => ({
            id: u.id,
            name: u.username,
            role: BE_TO_UI_ACCOUNT[(u.role ?? "").toUpperCase()] ?? "waiter",
            createdAt: (u.createdAt || "").slice(0, 10),
            passwordText: u.passwordText ?? "",
        }));
    }, [accountsRes]);

    const filteredUserAccounts = useMemo(() => {
        const q = userSearchTerm.trim().toLowerCase();
        if (!q) return userAccounts;
        return userAccounts.filter((a) => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q));
    }, [userSearchTerm, userAccounts]);

    // PUT update user account
    const { mutateAsync: updateUserAccountMut } = useMutation({
        mutationFn: (p: { id: number; body: { username: string; password?: string; role?: string } }) =>
            updateUserAccount(p.id, p.body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["user-accounts"] });
        },
    });

    /* ====== UI Helpers ====== */
    const getRoleColor = (role: UiRole) => {
        switch (role) {
            case "admin":
                return "bg-red-500 text-white";
            case "chef":
                return "bg-orange-500 text-white";
            case "waiter":
                return "bg-blue-500 text-white";
            case "cashier":
                return "bg-emerald-500 text-white";
            default:
                return "bg-muted text-muted-foreground";
        }
    };

    /* ====== Staff handlers ====== */
    const toModalStaff = (row: AdminStaffRow): ModalStaff => ({
        id: row.id,
        name: row.name,
        role: row.role,
        email: row.email,
        phone: row.phone,
        joinDate: row.joinDate,
    });

    const handleAddStaff = () => {
        setFormMode("add");
        setSelectedRow(undefined);
        setSelectedModalStaff(undefined);
        setIsFormModalOpen(true);
    };

    const handleEditStaff = (member: AdminStaffRow) => {
        setFormMode("edit");
        setSelectedRow(member);
        setSelectedModalStaff(toModalStaff(member));
        setIsFormModalOpen(true);
    };

    const handleDeleteStaff = (member: AdminStaffRow) => {
        setSelectedRow(member);
        setIsDeleteDialogOpen(true);
    };

    const CURRENT_STORE_ID = 1;

    // KHÔNG dùng username – BE tự sinh từ email
    const saveStaff = async (payload: {
        name: string;
        email: string;
        phone: string;
        role: UiRole;
        joinDate?: string;
        initialPassword?: string;
    }) => {
        const enumRole = UI_TO_BE_STAFF[payload.role];
        setIsSubmitting(true);
        try {
            if (formMode === "add") {
                await createStaffMut({
                    username: "",
                    fullName: payload.name,
                    email: payload.email,
                    phoneNumber: payload.phone,
                    role: enumRole as unknown as StaffRoleBE, // enum thuần (KHÔNG ROLE_)
                    storeId: CURRENT_STORE_ID,
                    initialPassword: payload.initialPassword || "123456",
                });
                toast({ title: "Tạo nhân viên thành công" });
            } else if (formMode === "edit" && selectedRow) {
                const updateData: UpdateStaffRequest = {
                    fullName: payload.name,
                    email: payload.email,
                    phoneNumber: payload.phone,
                    role: enumRole as unknown as StaffRoleBE,
                };
                await updateStaffMut({ id: selectedRow.id, data: updateData });
                toast({ title: "Cập nhật nhân viên thành công" });
            }

            // Refresh
            await qc.invalidateQueries({ queryKey: ["staffs"] });
            await qc.invalidateQueries({ queryKey: ["staffs", "my-store-staff"] });

            setIsFormModalOpen(false);
        } catch (e: unknown) {
            toast({ title: "Lỗi", description: extractErrorMessage(e), variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormSubmitFromModal: ModalOnSubmit = (data) => {
        const name = data.name ?? "";
        const email = data.email ?? "";
        const phone = data.phone ?? "";
        const role = data.role ?? "waiter";
        const initialPassword = data.initialPassword ?? "123456";

        void saveStaff({
            name,
            email,
            phone,
            role,
            joinDate: data.joinDate,
            initialPassword,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!selectedRow) return;
        setIsSubmitting(true);
        try {
            await deleteStaffMut(selectedRow.id);
            toast({ title: "Đã xoá nhân viên", description: selectedRow.name });
            setIsDeleteDialogOpen(false);
            setSelectedRow(undefined);
            await qc.invalidateQueries({ queryKey: ["staffs"] });
            await qc.invalidateQueries({ queryKey: ["staffs", "my-store-staff"] });
        } catch (e: unknown) {
            toast({ title: "Lỗi", description: extractErrorMessage(e), variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ====== Accounts handlers (edit-only) ====== */
    const handleEditUserAccount = (account: AccountRow) => {
        const initial: SelectedUA = {
            id: account.id,
            username: account.name,
            role: `ROLE_${account.role.toUpperCase()}`, // giữ ROLE_*
            passwordText: account.passwordText ?? "",
        };
        setSelectedUserAccount(initial);
        setIsUserFormModalOpen(true);
    };

    const handleUserAccountFormSubmit = async (data: UAPayload) => {
        try {
            if (!selectedUserAccount) return;

            await updateUserAccountMut({
                id: selectedUserAccount.id,
                body: {
                    username: data.username ?? selectedUserAccount.username,
                    role: data.role ?? selectedUserAccount.role, // ROLE_*
                    ...(data.password !== undefined ? { password: data.password } : {}),
                },
            });

            toast({ title: "Updated", description: "User account updated successfully." });
            setIsUserFormModalOpen(false);
            setSelectedUserAccount(undefined);
        } catch (e: unknown) {
            toast({ title: "Lỗi", description: extractErrorMessage(e), variant: "destructive" });
        }
    };

    const handleUserAccountDeleteConfirm = async () => {
        // hiện tại không hỗ trợ xoá account tại đây
        setIsUserDeleteDialogOpen(false);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
                    <p className="text-muted-foreground mt-1">Manage restaurant staff members and user account access.</p>
                </div>
            </div>

            <Tabs defaultValue="staff" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="staff">Staff Members</TabsTrigger>
                    <TabsTrigger value="accounts">User Accounts</TabsTrigger>
                </TabsList>

                {/* STAFF */}
                <TabsContent value="staff" className="space-y-6">
                    <div className="flex justify-end">
                        <Button onClick={handleAddStaff} className="btn-primary">
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Staff
                        </Button>
                    </div>

                    {/* Search */}
                    <Card className="dashboard-card">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search staff by name, role, or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Desktop Table */}
                    <Card className="desktop-table">
                        <div className="table-header flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                                {isStaffLoading ? "Loading staff..." : `All Staff (${filteredStaff.length})`}
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Name</th>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Role</th>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Contact</th>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Join Date</th>
                                    <th className="text-right py-4 px-6 font-medium text-muted-foreground">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {isStaffLoading ? (
                                    <tr>
                                        <td className="py-6 px-6 text-sm text-muted-foreground" colSpan={5}>
                                            Fetching staff list...
                                        </td>
                                    </tr>
                                ) : filteredStaff.length === 0 ? (
                                    <tr>
                                        <td className="py-6 px-6 text-sm text-muted-foreground" colSpan={5}>
                                            No staff found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStaff.map((member) => (
                                        <tr key={member.id} className="table-row">
                                            <td className="py-4 px-6 font-medium text-foreground">{member.name}</td>
                                            <td className="py-4 px-6">
                                                <Badge className={getRoleColor(member.role)}>{ROLE_LABEL[member.role]}</Badge>
                                            </td>
                                            <td className="py-4 px-6 text-muted-foreground">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-3 h-3" />
                                                        <span className="text-sm">{member.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-3 h-3" />
                                                        <span className="text-sm">{member.phone}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-muted-foreground">{member.joinDate}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEditStaff(member)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteStaff(member)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Mobile Cards */}
                    <div className="lg:hidden space-y-4">
                        {isStaffLoading ? (
                            <Card className="mobile-card p-4 text-sm text-muted-foreground">Fetching staff list...</Card>
                        ) : filteredStaff.length === 0 ? (
                            <Card className="mobile-card p-4 text-sm text-muted-foreground">No staff found.</Card>
                        ) : (
                            filteredStaff.map((member) => (
                                <Card key={member.id} className="mobile-card">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-foreground">{member.name}</h4>
                                        <div className="flex gap-2">
                                            <Badge className={getRoleColor(member.role)}>{ROLE_LABEL[member.role]}</Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            <span>{member.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            <span>{member.phone}</span>
                                        </div>
                                        <p>
                                            <span className="font-medium">Joined:</span> {member.joinDate}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
                                        <Button variant="outline" size="sm" onClick={() => handleEditStaff(member)}>
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleDeleteStaff(member)}>
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* ACCOUNTS */}
                <TabsContent value="accounts" className="space-y-6">
                    <div className="flex justify-end">
                        <Button
                            onClick={() =>
                                toast({
                                    title: "Not supported",
                                    description: "User account được tạo đồng thời khi tạo Staff.",
                                })
                            }
                            className="btn-primary"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create User Account
                        </Button>
                    </div>

                    <Card className="dashboard-card">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search accounts by username or role..."
                                    value={userSearchTerm}
                                    onChange={(e) => setUserSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="desktop-table">
                        <div className="table-header flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                                {isAccountsLoading ? "Loading accounts..." : `All User Accounts (${filteredUserAccounts.length})`}
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Username</th>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Role</th>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Created Date</th>
                                    <th className="text-right py-4 px-6 font-medium text-muted-foreground">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {isAccountsLoading ? (
                                    <tr>
                                        <td className="py-6 px-6 text-sm text-muted-foreground" colSpan={4}>
                                            Fetching user accounts...
                                        </td>
                                    </tr>
                                ) : filteredUserAccounts.length === 0 ? (
                                    <tr>
                                        <td className="py-6 px-6 text-sm text-muted-foreground" colSpan={4}>
                                            No user accounts found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUserAccounts.map((account) => (
                                        <tr key={account.id} className="table-row">
                                            <td className="font-medium text-foreground">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    {account.name}
                                                </div>
                                            </td>
                                            <td>
                                                <Badge className={getRoleColor(account.role)}>{account.role}</Badge>
                                            </td>
                                            <td className="text-muted-foreground">{account.createdAt}</td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEditUserAccount(account)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                        {
                                                            setIsUserDeleteDialogOpen(true);
                                                        }
                                                        }
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Mobile cards */}
                    <div className="lg:hidden space-y-4">
                        {isAccountsLoading ? (
                            <Card className="mobile-card p-4 text-sm text-muted-foreground">Fetching user accounts...</Card>
                        ) : filteredUserAccounts.length === 0 ? (
                            <Card className="mobile-card p-4 text-sm text-muted-foreground">No user accounts found.</Card>
                        ) : (
                            filteredUserAccounts.map((account) => (
                                <Card key={account.id} className="mobile-card">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            <h4 className="font-semibold text-foreground">{account.name}</h4>
                                        </div>
                                        <Badge className={getRoleColor(account.role)}>{account.role}</Badge>
                                    </div>
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <p>
                                            <span className="font-medium">Created:</span> {account.createdAt}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
                                        <Button variant="outline" size="sm" onClick={() => handleEditUserAccount(account)}>
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setIsUserDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modals & Dialogs */}
            <StaffFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmitFromModal}
                staff={selectedModalStaff}
                mode={formMode}
            />

            <UserAccountFormModal
                open={isUserFormModalOpen}
                onOpenChange={setIsUserFormModalOpen}
                initial={selectedUserAccount as UAInitial}
                onSubmit={handleUserAccountFormSubmit}
            />

            <DeleteConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Remove Staff Member"
                description="Are you sure you want to remove"
                itemName={selectedRow?.name}
                isLoading={isSubmitting}
            />

            <DeleteConfirmDialog
                isOpen={isUserDeleteDialogOpen}
                onClose={() => setIsUserDeleteDialogOpen(false)}
                onConfirm={handleUserAccountDeleteConfirm}
                title="Delete User Account"
                description="Are you sure you want to delete the account"
                itemName={selectedUserAccount?.username}
                isLoading={isSubmitting}
            />
        </div>
    );
};

export default StaffManagementPage;

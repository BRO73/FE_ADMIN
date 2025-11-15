// src/pages/StaffManagementPage.tsx
import { useMemo, useState, type ComponentProps, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Phone,
  Mail,
  User,
  UserPlus,
} from "lucide-react";
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
import {
  useStaffs,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
} from "@/hooks/useStaff";
import type {
  StaffResponse,
  UpdateStaffRequest,
  StaffRoleDb,
} from "@/api/staff.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import {
  fetchUserAccounts,
  createUserAccount,
  updateUserAccount,
  deleteUserAccount,
  type StaffAccountResponse as UserAccountRowBE,
  type CreateStaffAccountRequest,
  StaffAccountResponse,
} from "@/api/staffAccount.api";

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
  userId: number | null;
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
  role: StaffRoleDb; // DB role name: "WAITSTAFF" / "KITCHEN_STAFF" / "CASHIER" / "ADMIN"
  passwordText?: string;
};
type UAPayload = {
  username?: string;
  role?: string;
  password?: string;
};
type UAInitial = SelectedUA;

/* =========================
 * Role helpers
 * ========================= */

/** BE -> UI (chỉ map về 4 role) */
const normalizeDbRole = (beRole?: string): StaffRoleDb => {
  const raw = (beRole ?? "").trim().toUpperCase();
  const noPrefix = raw.startsWith("ROLE_") ? raw.slice(5) : raw;

  switch (noPrefix) {
    case "ADMIN":
      return "ADMIN";
    case "KITCHEN_STAFF":
    case "CHEF":
      return "KITCHEN_STAFF";
    case "CASHIER":
      return "CASHIER";
    case "WAITSTAFF":
      return "WAITSTAFF";
    case "WAITER":
    default:
      return "WAITSTAFF";
  }
};

/** UI -> BE (Staff service – enum thuần, không có ROLE_) */
const UI_ROLE_TO_DB: Record<UiRole, StaffRoleDb> = {
  waiter: "WAITSTAFF",
  chef: "KITCHEN_STAFF",
  cashier: "CASHIER",
  admin: "ADMIN",
};

const ROLE_LABEL: Record<UiRole, string> = {
  waiter: "Waiter",
  chef: "Chef",
  cashier: "Cashier",
  admin: "Admin",
};

/** BE (string bất kỳ) -> UI role cho bảng Accounts (fallback = waiter) */
const DB_ROLE_TO_UI: Record<StaffRoleDb, UiRole> = {
  WAITSTAFF: "waiter",
  KITCHEN_STAFF: "chef",
  CASHIER: "cashier",
  ADMIN: "admin",
};

/* Helper lấy message lỗi từ BE */
const extractErrorMessage = (e: unknown): string => {
  if (typeof e === "object" && e !== null) {
    const anyErr = e as {
      response?: { status?: number; data?: { message?: unknown } };
    };
    const msg = anyErr.response?.data?.message;
    if (typeof msg === "string" && msg) return msg;
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
  const [selectedModalStaff, setSelectedModalStaff] = useState<
    ModalStaff | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==== Hooks Staff API ====
  const { data: staffData, isLoading: isStaffLoading } = useStaffs();
  const { mutateAsync: createStaffMut } = useCreateStaff();
  const { mutateAsync: updateStaffMut } = useUpdateStaff();
  const { mutateAsync: deleteStaffMut } = useDeleteStaff();

  // Map Staff BE -> UI
  const staffList: AdminStaffRow[] = useMemo(() => {
  const raw = Array.isArray(staffData) ? staffData : [];

  return raw.map((s) => {
    let dbRole: StaffRoleDb;

    // Nếu staff có user -> lấy role từ userRole
    if (s.userId && Array.isArray((s as any).roles) && (s as any).roles.length > 0) {
      dbRole = normalizeDbRole((s as any).roles[0]);
    } else {
      // Staff chưa có account → dùng role trong Staff table
      dbRole = normalizeDbRole(s.roles && s.roles.length > 0 ? s.roles[0] : "WAITSTAFF");
    }

    return {
      id: s.id,
      name: s.name ?? s.name ?? "",
      role: DB_ROLE_TO_UI[dbRole],
      email: s.email ?? "",
      phone: s.phoneNumber ?? "",
      joinDate: s.createdAt?.slice(0, 10) ?? "",
      userId: s.userId ?? null,
    };
  });
}, [staffData]);



  const filteredStaff = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return staffList;
    return staffList.filter((m) => {
      const roleLabel = ROLE_LABEL[m.role].toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        roleLabel.includes(q) ||
        m.email.toLowerCase().includes(q)
      );
    });
  }, [searchTerm, staffList]);

  // ===== Duplicate helpers (client-side) =====
  const normEmail = (s?: string | null) =>
    typeof s === "string" ? s.trim().toLowerCase() : "";

  const normPhone = (s?: string | null) =>
    typeof s === "string" ? s.replace(/[^\d]/g, "") : "";


  const isDuplicateEmail = (email: string, excludeId?: number) => {
    const target = normEmail(email);
    return staffList.some(
      (s) => normEmail(s.email) === target && s.id !== excludeId
    );
  };

  const isDuplicatePhone = (phone: string, excludeId?: number) => {
    const target = normPhone(phone);
    return staffList.some(
      (s) => normPhone(s.phone) === target && s.id !== excludeId
    );
  };

  // ==== Accounts (StaffAccount) ====
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isUserFormModalOpen, setIsUserFormModalOpen] = useState(false);
  const [isUserDeleteDialogOpen, setIsUserDeleteDialogOpen] = useState(false);
  const [selectedUserAccount, setSelectedUserAccount] = useState<
    SelectedUA | undefined
  >();

  const {
    data: accountsRes = [], // default = []
    isLoading: isAccountsLoading,
    isError: isAccountsError,
  } = useQuery<StaffAccountResponse[]>({
    queryKey: ["user-accounts"],
    queryFn: fetchUserAccounts,
  });

  const userAccounts = useMemo<AccountRow[]>(() => {
    const rows = Array.isArray(accountsRes) ? accountsRes : [];
    return rows.map((u) => {
      const dbRole = normalizeDbRole(u.role);
      return {
        id: u.id,
        name: u.username,
        role: DB_ROLE_TO_UI[dbRole],
        createdAt: (u.createdAt || "").slice(0, 10),
        passwordText: u.passwordText ?? "",
      };
    });
  }, [accountsRes]);


  const filteredUserAccounts = useMemo(() => {
    const q = userSearchTerm.trim().toLowerCase();
    if (!q) return userAccounts;
    return userAccounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        ROLE_LABEL[a.role].toLowerCase().includes(q)
    );
  }, [userSearchTerm, userAccounts]);

  // PUT update user account
  const { mutateAsync: updateUserAccountMut } = useMutation({
    mutationFn: (p: {
      id: number;
      body: { username: string; password?: string; role?: StaffRoleDb };
    }) => updateUserAccount(p.id, p.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-accounts"] });
      qc.invalidateQueries({ queryKey: ["staffs", "my-store-staff"] });
    },
  });

  const { mutateAsync: deleteUserAccountMut } = useMutation({
    mutationFn: (id: number) => deleteUserAccount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-accounts"] });
      qc.invalidateQueries({ queryKey: ["staffs", "my-store-staff"] });
    },
  });
  const { mutateAsync: createUserAccountMut } = useMutation({
    mutationFn: (payload: CreateStaffAccountRequest) =>
      createUserAccount(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["user-accounts"] });
      await qc.invalidateQueries({ queryKey: ["staffs", "my-store-staff"] });
    },
  });
  useEffect(() => {
    console.log("accountsRes = ", accountsRes);
    console.log("userAccounts = ", userAccounts);
    console.log("filteredUserAccounts = ", filteredUserAccounts);
  }, [accountsRes, userAccounts, filteredUserAccounts]);

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
  email: row.email,
  phoneNumber: row.phone,
  role: row.role, // NEW
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

  // mở modal tạo account cho staff
  const handleOpenCreateAccount = (member: AdminStaffRow) => {
    setSelectedStaffForAccount(member);

    // gợi ý username từ email: trước @
    const baseUsername = member.email.includes("@")
      ? member.email.split("@")[0]
      : member.email;
    setAccountUsername(baseUsername);
    setAccountPassword("");
    setAccountPasswordConfirm("");
    setIsCreateAccountOpen(true);
  };

  const handleCreateAccountSubmit = async () => {
    if (!selectedStaffForAccount) return;

    const username = accountUsername.trim();
    const password = accountPassword.trim();
    const confirm = accountPasswordConfirm.trim();

    if (!username || !password) {
      toast({
        title: "Validation error",
        description: "Username and password are required.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirm) {
      toast({
        title: "Validation error",
        description: "Password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createUserAccountMut({
        staffId: selectedStaffForAccount.id,
        username,
        password,
      });

      toast({
        title: "Account created",
        description: `User account for ${selectedStaffForAccount.name} has been created.`,
      });

      setIsCreateAccountOpen(false);
      setSelectedStaffForAccount(null);
    } catch (e) {
      const msg = extractErrorMessage(e);
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    }
  };

  // ==== Create account cho staff ====
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [selectedStaffForAccount, setSelectedStaffForAccount] =
    useState<AdminStaffRow | null>(null);
  const [accountUsername, setAccountUsername] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountPasswordConfirm, setAccountPasswordConfirm] = useState("");

  const CURRENT_STORE_ID = 1;

  const saveStaff = async (payload: {
    name: string;
    email: string;
    phone: string;
    role: UiRole;
    joinDate?: string;
  }) => {
    const dbRole = UI_ROLE_TO_DB[payload.role];
    setIsSubmitting(true);

    const excludeId = formMode === "edit" && selectedRow ? selectedRow.id : undefined;

    if (isDuplicateEmail(payload.email, excludeId)) {
      toast({ title: "Lỗi", description: "Email đã tồn tại", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    if (isDuplicatePhone(payload.phone, excludeId)) {
      toast({ title: "Lỗi", description: "Số điện thoại đã tồn tại", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    try {
      if (formMode === "add") {
        await createStaffMut({
          fullName: payload.name,
          email: payload.email,
          phoneNumber: payload.phone,
          role: dbRole,
        });
      } else if (formMode === "edit" && selectedRow) {
        await updateStaffMut({
          id: selectedRow.id,
          data: {
            fullName: payload.name,
            email: payload.email,
            phoneNumber: payload.phone,
            role: dbRole,
          },
        });
      }

      toast({ title: "Success" });
      qc.invalidateQueries({ queryKey: ["staffs"] });
      qc.invalidateQueries({ queryKey: ["staffs", "my-store-staff"] });
      setIsFormModalOpen(false);
    } catch (e) {
      toast({ title: "Lỗi", description: extractErrorMessage(e), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleFormSubmitFromModal: ModalOnSubmit = (data) => {
    void saveStaff({
      name: data.name ?? "",
      email: data.email ?? "",
      phone: data.phoneNumber ?? "",
      role: data.role,
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
      toast({
        title: "Lỗi",
        description: extractErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ====== Accounts handlers (edit-only) ====== */
  const handleEditUserAccount = (account: AccountRow) => {
    const rawRole = accountsRes?.find(u => u.id === account.id)?.role;
    const dbRole = normalizeDbRole(rawRole);

    const initial: SelectedUA = {
      id: account.id,
      username: account.name,
      role: dbRole,
      passwordText: account.passwordText ?? "",
    };
    setSelectedUserAccount(initial);
    setIsUserFormModalOpen(true);
  };

  const handleUserAccountFormSubmit = async (data: UAPayload) => {
    try {
      if (!selectedUserAccount) return;

      // role cũ của user account → chuẩn DB role
      const oldDbRole = normalizeDbRole(selectedUserAccount.role);

      // role mới nếu user chọn → convert UI role -> DB role
      const newDbRole = data.role
        ? UI_ROLE_TO_DB[data.role as UiRole]
        : oldDbRole;

      await updateUserAccountMut({
        id: selectedUserAccount.id,
        body: {
          username: data.username ?? selectedUserAccount.username,
          role: newDbRole,
          ...(data.password ? { password: data.password } : {}),
        },
      });

      toast({
        title: "Updated",
        description: "User account updated successfully.",
      });

      setIsUserFormModalOpen(false);
      setSelectedUserAccount(undefined);

    } catch (e) {
      toast({
        title: "Lỗi",
        description: extractErrorMessage(e),
        variant: "destructive",
      });
    }
  };


  const handleUserAccountDeleteConfirm = async () => {
    if (!selectedUserAccount) return;
    setIsSubmitting(true);
    try {
      await deleteUserAccountMut(selectedUserAccount.id);

      toast({
        title: "Đã xoá tài khoản",
        description: selectedUserAccount.username,
      });

      setIsUserDeleteDialogOpen(false);
      setSelectedUserAccount(undefined);
    } catch (e: unknown) {
      toast({
        title: "Lỗi",
        description: extractErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Staff Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage restaurant staff members and user account access.
          </p>
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
                {isStaffLoading
                  ? "Loading staff..."
                  : `All Staff (${filteredStaff.length})`}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">
                      Contact
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">
                      Join Date
                    </th>
                    <th className="text-right py-4 px-6 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isStaffLoading ? (
                    <tr>
                      <td
                        className="py-6 px-6 text-sm text-muted-foreground"
                        colSpan={5}
                      >
                        Fetching staff list...
                      </td>
                    </tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr>
                      <td
                        className="py-6 px-6 text-sm text-muted-foreground"
                        colSpan={5}
                      >
                        No staff found.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((member) => (
                      <tr key={member.id} className="table-row">
                        <td className="py-4 px-6 font-medium text-foreground">
                          {member.name}
                        </td>
                        <td className="py-4 px-6">
                          <Badge className={getRoleColor(member.role)}>
                            {ROLE_LABEL[member.role]}
                          </Badge>
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
                        <td className="py-4 px-6 text-muted-foreground">
                          {member.joinDate}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Nếu staff chưa có userId -> cho tạo account */}
                            {!member.userId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenCreateAccount(member)}
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Create Account
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStaff(member)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStaff(member)}
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

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {isStaffLoading ? (
              <Card className="mobile-card p-4 text-sm text-muted-foreground">
                Fetching staff list...
              </Card>
            ) : filteredStaff.length === 0 ? (
              <Card className="mobile-card p-4 text-sm text-muted-foreground">
                No staff found.
              </Card>
            ) : (
              filteredStaff.map((member) => (
                <Card key={member.id} className="mobile-card">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-foreground">
                      {member.name}
                    </h4>
                    <div className="flex gap-2">
                      <Badge className={getRoleColor(member.role)}>
                        {ROLE_LABEL[member.role]}
                      </Badge>
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
                      <span className="font-medium">Joined:</span>{" "}
                      {member.joinDate}
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
                    {!member.userId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenCreateAccount(member)}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Create
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditStaff(member)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteStaff(member)}
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

        {/* ACCOUNTS */}
        <TabsContent value="accounts" className="space-y-6">
          <div className="flex justify-end">
            <Button
              onClick={() =>
                toast({
                  title: "Not supported yet",
                  description:
                    "Creating staff accounts will be handled from a dedicated flow.",
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
                {isAccountsLoading
                  ? "Loading accounts..."
                  : `All User Accounts (${filteredUserAccounts.length})`}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">
                      Username
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">
                      Created Date
                    </th>
                    <th className="text-right py-4 px-6 font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isAccountsLoading ? (
                    <tr>
                      <td
                        className="py-6 px-6 text-sm text-muted-foreground"
                        colSpan={4}
                      >
                        Fetching user accounts...
                      </td>
                    </tr>
                  ) : filteredUserAccounts.length === 0 ? (
                    <tr>
                      <td
                        className="py-6 px-6 text-sm text-muted-foreground"
                        colSpan={4}
                      >
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
                          <Badge className={getRoleColor(account.role)}>
                            {ROLE_LABEL[account.role]}
                          </Badge>
                        </td>
                        <td className="text-muted-foreground">
                          {account.createdAt}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUserAccount(account)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const rawRole = accountsRes?.find(u => u.id === account.id)?.role;
                                const dbRole = normalizeDbRole(rawRole);

                                setSelectedUserAccount({
                                  id: account.id,
                                  username: account.name,
                                  role: dbRole,
                                  passwordText: account.passwordText ?? "",
                                });
                                setIsUserDeleteDialogOpen(true);
                              }}
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
              <Card className="mobile-card p-4 text-sm text-muted-foreground">
                Fetching user accounts...
              </Card>
            ) : filteredUserAccounts.length === 0 ? (
              <Card className="mobile-card p-4 text-sm text-muted-foreground">
                No user accounts found.
              </Card>
            ) : (
              filteredUserAccounts.map((account) => (
                <Card key={account.id} className="mobile-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <h4 className="font-semibold text-foreground">
                        {account.name}
                      </h4>
                    </div>
                    <Badge className={getRoleColor(account.role)}>
                      {ROLE_LABEL[account.role]}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium">Created:</span>{" "}
                      {account.createdAt}
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUserAccount(account)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const rawRole = accountsRes?.find(u => u.id === account.id)?.role;
                        const dbRole = normalizeDbRole(rawRole);

                        setSelectedUserAccount({
                          id: account.id,
                          username: account.name,
                          role: dbRole,
                          passwordText: account.passwordText ?? "",
                        });
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

      {/* Modal tạo account cho staff */}
      <Dialog open={isCreateAccountOpen} onOpenChange={setIsCreateAccountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Account for Staff</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Link a login account to this staff. Password will be stored hashed
              in User and kept as plain text in Staff for editing.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {selectedStaffForAccount && (
              <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/40">
                <div className="font-medium text-foreground">
                  {selectedStaffForAccount.name}
                </div>
                <div>{selectedStaffForAccount.email}</div>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Username</Label>
              <Input
                value={accountUsername}
                onChange={(e) => setAccountUsername(e.target.value)}
                placeholder="Enter username..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
                placeholder="Enter password..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={accountPasswordConfirm}
                onChange={(e) => setAccountPasswordConfirm(e.target.value)}
                placeholder="Confirm password..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateAccountOpen(false);
                  setSelectedStaffForAccount(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateAccountSubmit}>
                Create Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagementPage;

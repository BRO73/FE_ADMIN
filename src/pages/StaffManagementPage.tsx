import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Phone, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

import StaffFormModal from "@/components/forms/StaffFormModal";
import DeleteConfirmDialog from "@/components/forms/DeleteConfirmDialog";

import { Staff } from "@/types/Staff";
import { getAllStaff } from "@/api/staffApi";

const StaffManagementPage = () => {
  const { toast } = useToast(); 

  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ----------------------------------
  // 🔥 FETCH STAFF FROM BACKEND
  // ----------------------------------
  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const list = await getAllStaff();
      setStaff(list);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load staff list.",
        variant: "destructive",
      });
    }
  };

  // ----------------------------------
  // 🔍 FILTER STAFF SEARCH
  // ----------------------------------
  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ----------------------------------
  // 🎨 ROLE COLOR
  // ----------------------------------
  const getRoleColor = (roles: string[]) => {
    const role = roles[0]?.toLowerCase();

    switch (role) {
      case "admin": return "bg-red-500 text-white";
      case "manager": return "bg-blue-500 text-white";
      case "staff": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  // ----------------------------------
  // 🧹 Delete Handler
  // ----------------------------------
  const handleDeleteConfirm = async () => {
    if (!selectedStaff) return;

    setIsSubmitting(true);
    try {
      // TODO: Thêm API DELETE khi backend có
      toast({
        title: "Delete success",
        description: `${selectedStaff.name} removed.`,
      });

      setStaff(prev => prev.filter(s => s.id !== selectedStaff.id));
      setIsDeleteDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <h1 className="text-3xl font-bold">Staff Management</h1>
      <p className="text-muted-foreground">
        Manage restaurant staff members from backend data.
      </p>

      <Tabs defaultValue="staff">
        <TabsList className="gri max-w-md">
          <TabsTrigger value="staff">Staff Members</TabsTrigger>
        </TabsList>

        {/* ===========================
             STAFF TAB
        ============================ */}
        <TabsContent value="staff" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => { setFormMode("add"); setIsFormModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Staff
            </Button>
          </div>

          {/* Search */}
          <Card className="dashboard-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          {/* TABLE */}
          <Card className="desktop-table">
            <h3 className="text-lg font-semibold p-4">All Staff ({filteredStaff.length})</h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">Name</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Created</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="border-b hover:bg-muted/40">
                      <td className="py-3 px-4">{member.name}</td>

                      <td>
                        <Badge className={getRoleColor(member.roles)}>
                          {member.roles.join(", ")}
                        </Badge>
                      </td>

                      <td className="text-muted-foreground flex items-center gap-2">
                        <Mail className="w-4 h-4" /> {member.email}
                      </td>

                      <td className="text-muted-foreground flex items-center gap-2">
                        <Phone className="w-4 h-4" /> {member.phoneNumber}
                      </td>

                      <td className="text-muted-foreground">
                        {member.createdAt?.slice(0, 10)}
                      </td>

                      <td className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedStaff(member);
                            setFormMode("edit");
                            setIsFormModalOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedStaff(member);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </Card>

        </TabsContent>

      </Tabs>

      {/* MODALS */}
      <StaffFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={() => {}}
        staff={selectedStaff ?? undefined}
        mode={formMode}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Staff Member"
        description="Are you sure you want to remove"
        itemName={selectedStaff?.name}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default StaffManagementPage;

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

export type StaffFormData = {
  name: string;
  email: string;
  phoneNumber: string;
  role: "waiter" | "chef" | "cashier" | "admin";
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StaffFormData) => void;
  staff?: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
    role: "waiter" | "chef" | "cashier" | "admin";
  };
  mode: "add" | "edit";
}

const StaffFormModal = ({ isOpen, onClose, onSubmit, staff, mode }: Props) => {
  const [formData, setFormData] = useState<StaffFormData>({
    name: "",
    email: "",
    phoneNumber: "",
    role: "waiter",
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name,
        email: staff.email,
        phoneNumber: staff.phoneNumber,
        role: staff.role, // lấy đúng role khi edit
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phoneNumber: "",
        role: "waiter", // default khi create
      });
    }
  }, [staff, isOpen]);

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Staff" : "Edit Staff"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* NAME */}
          <div className="grid gap-2">
            <Label>Full Name</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter full name..."
            />
          </div>

          {/* EMAIL */}
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Enter email..."
            />
          </div>

          {/* PHONE */}
          <div className="grid gap-2">
            <Label>Phone Number</Label>
            <Input
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              placeholder="Enter phone number..."
            />
          </div>

          {/* ROLE */}
          <div className="grid gap-2">
            <Label>Role</Label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as StaffFormData["role"],
                })
              }
              className="border rounded-md px-2 py-2"
            >
              <option value="waiter">Waiter</option>
              <option value="chef">Chef</option>
              <option value="cashier">Cashier</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {mode === "add" ? "Create Staff" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StaffFormModal;

import { useState, useEffect } from "react";
import { Plus, Trash2, Search, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import DeleteConfirmDialog from "@/components/forms/DeleteConfirmDialog";
import { CustomerResponse } from "@/types/type";
import { deleteCustomer, getAllCustomers } from "@/api/customer.api";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
}

const CustomerManagementPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Real data - Customers
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Fetch customers from API
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const customerData = await getAllCustomers();
      const mappedCustomers: Customer[] = customerData.map(customer => ({
        id: customer.userId,
        name: customer.fullName,
        email: customer.email || "N/A",
        phone: customer.phoneNumber || "N/A",
        status: "active" // Mặc định active vì API không cung cấp status
      }));
      setCustomers(mappedCustomers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Customer["status"]) => {
    switch (status) {
      case "active": return "bg-success text-success-foreground";
      case "inactive": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return;

    setIsSubmitting(true);
    try {
      await deleteCustomer(selectedCustomer.id);
      setCustomers(customers.filter(c => c.id !== selectedCustomer.id));
      toast({
        title: "Customer Deleted",
        description: `${selectedCustomer.name} has been deleted successfully.`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(undefined);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
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
          <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage restaurant customers.
          </p>
        </div>
        <Button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add New Customer
        </Button>
      </div>

      {/* Search */}
      <Card className="dashboard-card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card className="dashboard-card">
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading customers...</p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="desktop-table">
            <div className="table-header flex items-center justify-between">
              <h3 className="text-lg font-semibold">All Customers ({filteredCustomers.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground w-1/4">Name</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground w-1/4">Email</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground w-1/4">Phone Number</th>
                    <th className="text-center py-4 px-6 font-medium text-muted-foreground w-1/6">Status</th>
                    <th className="text-center py-4 px-6 font-medium text-muted-foreground w-1/6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="table-row">
                      <td className="py-4 px-6 font-medium text-foreground">{customer.name}</td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{customer.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{customer.phone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Badge className={getStatusColor(customer.status)}>
                          {customer.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="mobile-card">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground">{customer.name}</h4>
                  <Badge className={getStatusColor(customer.status)}>
                    {customer.status}
                  </Badge>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <div>
                      <p className="font-medium text-xs text-muted-foreground">Email</p>
                      <p>{customer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <div>
                      <p className="font-medium text-xs text-muted-foreground">Phone Number</p>
                      <p>{customer.phone}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCustomer(customer)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer"
        description="Are you sure you want to delete"
        itemName={selectedCustomer?.name}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default CustomerManagementPage;
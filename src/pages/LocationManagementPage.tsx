import { useState } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import LocationFormModal from "@/components/forms/LocationFormModal";
import DeleteConfirmDialog from "@/components/forms/DeleteConfirmDialog";
import { useLocations } from "@/hooks/useLocations";
import { LocationResponse, LocationFormData } from "@/types/type";

const LocationManagementPage = () => {
  const { toast } = useToast();
  const { locations, loading, error, addLocation, editLocation, removeLocation } = useLocations();

  const [searchTerm, setSearchTerm] = useState("");
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedLocation, setSelectedLocation] = useState<LocationResponse | undefined>();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const handleAddLocation = () => {
    setFormMode("add");
    setSelectedLocation(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditLocation = (location: LocationResponse) => {
    setFormMode("edit");
    setSelectedLocation(location);
    setIsFormModalOpen(true);
  };

  const handleDeleteLocation = (location: LocationResponse) => {
    setSelectedLocation(location);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: LocationFormData) => {
    setIsSubmitting(true);
    try {
      if (formMode === "add") {
        await addLocation(data);
      } else if (formMode === "edit" && selectedLocation) {
        await editLocation(selectedLocation.id, data);
      }
      setIsFormModalOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to save location.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLocation) return;
    setIsSubmitting(true);
    try {
      await removeLocation(selectedLocation.id);
      toast({ title: "Location Deleted", description: `${selectedLocation.name} deleted.` });
      setIsDeleteDialogOpen(false);
      setSelectedLocation(undefined);
    } catch {
      toast({ title: "Error", description: "Failed to delete location.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Location Management</h1>
          <p className="text-muted-foreground mt-1">Manage restaurant locations.</p>
        </div>
        <Button onClick={handleAddLocation}>
          <Plus className="w-4 h-4 mr-2" /> Add Location
        </Button>
      </div>

      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <Card>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-4 px-6">Name</th>
              <th className="text-left py-4 px-6">Description</th>
              <th className="text-right py-4 px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="text-center py-6">Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={3} className="text-center py-6 text-red-500">{error}</td></tr>
            ) : (
              filteredLocations.map((loc) => (
                <tr key={loc.id} className="border-b">
                  <td>{loc.name}</td>
                  <td>{loc.description}</td>
                  <td className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditLocation(loc)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteLocation(loc)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <LocationFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        location={selectedLocation}
        mode={formMode}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Location"
        description="Are you sure you want to delete"
        itemName={selectedLocation?.name}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default LocationManagementPage;

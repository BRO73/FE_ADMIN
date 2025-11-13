import { useState } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import TableFormModal from "@/components/forms/TableFormModal";
import LocationFormModal from "@/components/forms/LocationFormModal";
import DeleteConfirmDialog from "@/components/forms/DeleteConfirmDialog";
import { useTables } from "@/hooks/useTables";
import { useLocations } from "@/hooks/useLocations";
import { TableFormData, TableResponse, LocationResponse, LocationFormData } from "@/types/type";
import {SelectDateButton} from "@/components/SelectDateButton";

const TableManagementPage = () => {
  const { toast } = useToast();

  // Tables hook
  const { tables, loading, error, addTable, editTable, removeTable,getTableByDay } = useTables();

  // Locations hook
  const { locations, loading: locationLoading, error: locationError, addLocation, editLocation, removeLocation } = useLocations();

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>("all");

  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedTable, setSelectedTable] = useState<TableResponse | undefined>();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [locationFormMode, setLocationFormMode] = useState<"add" | "edit">("add");
  const [selectedLocation, setSelectedLocation] = useState<LocationResponse | undefined>();
  const [isLocationFormModalOpen, setIsLocationFormModalOpen] = useState(false);
  const [isLocationDeleteDialogOpen, setIsLocationDeleteDialogOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [TablesByDay, setTablesByDay] = useState<TableResponse[]>([]);

  // Filtered tables
  const filteredTables = tables.filter(
    (table) =>
      (table.tableNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.locationName.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedLocationFilter === "all" || table.locationName === selectedLocationFilter)
  );

  // Filtered locations
  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(locationSearchTerm.toLowerCase()) ||
      (loc.description?.toLowerCase().includes(locationSearchTerm.toLowerCase()) ?? false)
  );

  // Status color
  const getStatusColor = (status: TableResponse["status"]) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-500 text-white";
      case "occupied":
        return "bg-yellow-500 text-white";
      case "reserved":
        return "bg-blue-500 text-white";
      case "maintenance":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-300 text-gray-700";
    }
  };

  // Table handlers
  const handleAddTable = () => {
    setFormMode("add");
    setSelectedTable(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditTable = (table: TableResponse) => {
    setFormMode("edit");
    setSelectedTable(table);
    setIsFormModalOpen(true);
  };

  const handleDeleteTable = (table: TableResponse) => {
    setSelectedTable(table);
    setIsDeleteDialogOpen(true);
  };

  const handleTableFormSubmit = async (data: TableFormData) => {
    setIsSubmitting(true);
    try {
      if (formMode === "add") {
        await addTable(data);
        toast({ title: "Table Added", description: `Table ${data.tableNumber} has been added.` });
      } else if (formMode === "edit" && selectedTable) {
        await editTable(selectedTable.id, data);
        toast({ title: "Table Updated", description: `Table ${data.tableNumber} has been updated.` });
      }
      setIsFormModalOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to save table.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSelectDate = async (dateString: string) => {
    console.log("Selected date:", dateString);

    try {
      await getTableByDay(dateString);
    } catch (error) {
      console.error("Failed to fetch table status by day:", error);
    }
  };
  const handleDeleteTableConfirm = async () => {
    if (!selectedTable) return;
    setIsSubmitting(true);
    try {
      await removeTable(selectedTable.id);
      toast({ title: "Table Deleted", description: `Table ${selectedTable.tableNumber} deleted.` });
      setIsDeleteDialogOpen(false);
      setSelectedTable(undefined);
    } catch {
      toast({ title: "Error", description: "Failed to delete table.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Location handlers
  const handleAddLocation = () => {
    setLocationFormMode("add");
    setSelectedLocation(undefined);
    setIsLocationFormModalOpen(true);
  };

  const handleEditLocation = (location: LocationResponse) => {
    setLocationFormMode("edit");
    setSelectedLocation(location);
    setIsLocationFormModalOpen(true);
  };

  const handleDeleteLocation = (location: LocationResponse) => {
    setSelectedLocation(location);
    setIsLocationDeleteDialogOpen(true);
  };

  const handleLocationFormSubmit = async (data: LocationFormData) => {
    setIsSubmitting(true);
    try {
      if (locationFormMode === "add") {
        await addLocation(data);
      } else if (locationFormMode === "edit" && selectedLocation) {
        await editLocation(selectedLocation.id, data);
      }
      setIsLocationFormModalOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to save location.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocationConfirm = async () => {
    if (!selectedLocation) return;
    setIsSubmitting(true);
    try {
      await removeLocation(selectedLocation.id);
      toast({ title: "Location Deleted", description: `${selectedLocation.name} deleted.` });
      setIsLocationDeleteDialogOpen(false);
      setSelectedLocation(undefined);
    } catch {
      toast({ title: "Error", description: "Failed to delete location.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Table Management</h1>
      <p className="text-muted-foreground">Manage tables, locations, and availability.</p>

      <Tabs defaultValue="tables" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
        </TabsList>

        {/* Tables */}
        <TabsContent value="tables" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Card className="flex-1">
              <div className="flex flex-col sm:flex-row gap-4 p-4 items-center">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                      placeholder="Search tables..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                  />
                </div>

                {/* Location filter */}
                <select
                    value={selectedLocationFilter}
                    onChange={(e) => setSelectedLocationFilter(e.target.value)}
                    className="border rounded-md p-2"
                >
                  <option value="all">All Locations</option>
                  {locations.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name}
                      </option>
                  ))}
                </select>

                {/* Date picker button */}
                <SelectDateButton
                    onSelectDate={handleSelectDate}
                />
              </div>
            </Card>
            <Button onClick={handleAddTable}><Plus className="w-4 h-4 mr-2" /> Add Table</Button>

          </div>

          <Card>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="py-3 px-4 text-center">Table</th>
                  <th className="py-3 px-4 text-center">Capacity</th>
                  <th className="py-3 px-4 text-center">Location</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6">Loading...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-red-500">{error}</td>
                  </tr>
                ) : (
                  filteredTables.map((table) => (
                    <tr key={table.id} className="border-t">
                      <td className="text-center align-middle">{table.tableNumber}</td>
                      <td className="text-center align-middle">{table.capacity}</td>
                      <td className="text-center align-middle">{table.locationName}</td>
                      <td className="text-center align-middle">
                        <Badge className={getStatusColor(table.status)}>
                          {table.status}
                        </Badge>
                      </td>
                      <td className="text-center align-middle">
                        <div className="flex justify-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditTable(table)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteTable(table)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

          </Card>
        </TabsContent>

        {/* Locations */}
        <TabsContent value="locations" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Card className="flex-1">
              <div className="p-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  value={locationSearchTerm}
                  onChange={(e) => setLocationSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </Card>
            <Button onClick={handleAddLocation}><Plus className="w-4 h-4 mr-2" /> Add Location</Button>
          </div>

          <Card>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="py-3 px-4 text-center">Name</th>
                  <th className="py-3 px-4 text-center">Description</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {locationLoading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6">Loading...</td>
                  </tr>
                ) : locationError ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-red-500">{locationError}</td>
                  </tr>
                ) : (
                  filteredLocations.map((loc) => (
                    <tr key={loc.id} className="border-t">
                      <td className="text-center align-middle">{loc.name}</td>
                      <td className="text-center align-middle">{loc.description}</td>
                      <td className="text-center align-middle">
                        <div className="flex justify-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditLocation(loc)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteLocation(loc)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <TableFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleTableFormSubmit}
        table={selectedTable}
        mode={formMode}
      />
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteTableConfirm}
        title="Delete Table"
        description="Are you sure you want to delete"
        itemName={selectedTable?.tableNumber}
        isLoading={isSubmitting}
      />

      <LocationFormModal
        isOpen={isLocationFormModalOpen}
        onClose={() => setIsLocationFormModalOpen(false)}
        onSubmit={handleLocationFormSubmit}
        location={selectedLocation}
        mode={locationFormMode}
      />
      <DeleteConfirmDialog
        isOpen={isLocationDeleteDialogOpen}
        onClose={() => setIsLocationDeleteDialogOpen(false)}
        onConfirm={handleDeleteLocationConfirm}
        title="Delete Location"
        description="Are you sure you want to delete"
        itemName={selectedLocation?.name}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default TableManagementPage;

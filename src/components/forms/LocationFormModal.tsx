import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LocationFormData } from "@/types/type";

const locationSchema = z.object({
  name: z.string().min(1, "Location name is required").max(50),
  description: z.string().max(200).optional(),
});

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LocationFormData) => void;
  location?: LocationFormData;
  mode: "add" | "edit";
}

const LocationFormModal = ({ isOpen, onClose, onSubmit, location, mode }: LocationFormModalProps) => {
  const { toast } = useToast();

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (location && mode === "edit") {
      form.reset(location);
    } else {
      form.reset({ name: "", description: "" });
    }
  }, [location, mode, form]);

  const handleSubmit = async (data: LocationFormData) => {
    try {
      onSubmit(data);
      toast({
        title: mode === "add" ? "Location Added" : "Location Updated",
        description: `Location "${data.name}" has been ${mode === "add" ? "added" : "updated"}.`,
      });
      onClose();
    } catch {
      toast({
        title: "Error",
        description: `Failed to ${mode} location.`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add Location" : "Edit Location"}</DialogTitle>
          <DialogDescription>
            {mode === "add" ? "Enter details for new location." : "Update location details."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl><Input placeholder="Ground Floor" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Optional description..." className="resize-none" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="btn-primary">
                {mode === "add" ? "Add" : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default LocationFormModal;

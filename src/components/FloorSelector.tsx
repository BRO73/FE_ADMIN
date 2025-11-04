import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FloorSelectorProps {
    floors : string[];
  currentFloor: string;
  onFloorChange: (floor: string) => void;
}

export const FloorSelector = ({ floors,currentFloor, onFloorChange }: FloorSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Select Floor</label>
      <Select value={currentFloor} onValueChange={onFloorChange}>
        <SelectTrigger className="w-full bg-card shadow-soft">
          <SelectValue placeholder="Choose a floor" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
            {floors.map((floor, i) => (
                <SelectItem key={floor} value={floor}>
                    {floor.charAt(0).toUpperCase()+floor.slice(1)}
                </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
};

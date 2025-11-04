import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Trash2 } from "lucide-react";
import { FloorElement } from "./FloorCanvas";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {TableResponse} from "@/types/type.ts";

interface PropertiesPanelProps {
    tables: TableResponse[];
  element: FloorElement | null;
  onUpdate: (updates: Partial<FloorElement>) => void;
  onDelete: () => void;
}

const colorPresets = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Red", value: "#EF4444" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Orange", value: "#F97316" },
  { name: "Gray", value: "#6B7280" },
];

export const PropertiesPanel = ({ tables,element, onUpdate, onDelete }: PropertiesPanelProps) => {
  if (!element) {
    return (
      <div className="space-y-2 p-4 border border-border rounded-lg bg-muted/30">
        <p className="text-sm text-muted-foreground text-center py-4">
          Click on an element to edit its properties
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground capitalize">
          {element.type} Properties
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {/* Width */}
        <div>
          <Label className="text-xs">Width</Label>
          <Slider
              value={[element.width]}
              onValueChange={([width]) => {
                element.width = width;
                onUpdate(element);
              }}
              min={5}
              max={element.type === "other" || element.type === "balcony" ? 1000 : 300}
              step={5}
              className="mt-2"
          />
          <span className="text-xs text-muted-foreground">{element.width}px</span>
        </div>

        {/* Height */}
        <div>
          <Label className="text-xs">Height</Label>
          <Slider
              value={[element.height]}
              onValueChange={([height]) => {
                element.height = height;
                onUpdate(element);
              }}
              min={5}
              max={element.type === "other" || element.type === "balcony" ? 1000 : 300}
              step={5}
              className="mt-2"
          />
          <span className="text-xs text-muted-foreground">{element.height}px</span>
        </div>

        {/* Rotation */}
        <div>
          <Label className="text-xs">Rotation</Label>
          <Slider
              value={[element.rotation]}
              onValueChange={([rotation]) => {
                element.rotation = rotation;
                onUpdate(element);
              }}
              min={0}
              max={360}
              step={15}
              className="mt-2"
          />
          <span className="text-xs text-muted-foreground">{element.rotation}°</span>
        </div>

        {/* Color */}
        <div>
          <Label className="text-xs mb-2 block">Color</Label>
          <div className="grid grid-cols-3 gap-2">
            {colorPresets.map((preset) => (
                <button
                    key={preset.value}
                    onClick={() => {
                      element.color = preset.value;
                      onUpdate(element);
                    }}
                    className={`h-8 rounded border-2 transition-all ${
                        element.color === preset.value
                            ? "border-primary scale-110"
                            : "border-border hover:border-primary/50"
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                />
            ))}
          </div>
          <Input
              type="color"
              value={element.color}
              onChange={(e) => {
                element.color = e.target.value;
                onUpdate(element);
              }}
              className="mt-2 h-8"
          />
        </div>

        {/* Label */}
        <div>
          <Label className="text-xs" htmlFor="label">
            Label
          </Label>
          <Input
              id="label"
              value={element.label}
              onChange={(e) => {
                element.label = e.target.value;
                onUpdate(element);
              }}
              className="mt-1 h-8 text-xs"
              placeholder="Enter label..."
          />
        </div>
          {/* Table */}
          <div>
              <Label className="text-xs" htmlFor="table">
                  Table
              </Label>
              <Select
                  value={element.tableId!=null ?element.tableId.toString() : ""} // lấy tableId hiện tại của element
                  onValueChange={(value) => {
                      element.tableId = Number(value);
                      element.label = tables.find((tb) => tb.id == Number(value)).tableNumber ;// cập nhật tableId
                      onUpdate(element);         // gọi callback
                  }}
              >
                  <SelectTrigger className="w-full bg-card shadow-soft">
                      <SelectValue placeholder="Choose a table" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                      {tables.map((table) => (
                          <SelectItem key={table.id} value={table.id.toString()}>
                              {table.tableNumber}
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
          </div>

      </div>

    </div>
  );
};

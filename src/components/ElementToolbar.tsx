import { Square, Circle, Columns, DoorOpen, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import {FloorElement} from "@/components/FloorCanvas.tsx";

export type ElementType = "table" | "window" | "balcony" | "door" | "other";

interface ElementToolbarProps {
    currentElement: FloorElement;
  selectedTool: ElementType;
  onToolChange: (tool: ElementType) => void;
}

const tools: { type: ElementType; icon: typeof Square; label: string }[] = [
  { type: "table", icon: Circle, label: "Table" },
  { type: "window", icon: Columns, label: "Window" },
  { type: "balcony", icon: Square, label: "Balcony" },
  { type: "door", icon: DoorOpen, label: "Door" },
  { type: "other", icon: Box, label: "Other" },
];

export const ElementToolbar = ({selectedTool, currentElement, onToolChange }: ElementToolbarProps) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground mb-3">Add Elements</h3>
      <div className="grid grid-cols-2 gap-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Button
              key={tool.type}
              variant={selectedTool === tool.type ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => onToolChange(tool.type)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {tool.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

import { FloorSelector } from "./FloorSelector";
import { ElementToolbar, ElementType } from "./ElementToolbar";
import { PropertiesPanel } from "./PropertiesPanel";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw } from "lucide-react";
import { FloorElement } from "./FloorCanvas";
import { Separator } from "@/components/ui/separator";
import {TableResponse} from "@/types/type.ts";

interface SidebarProps {
  tables: TableResponse[];
  floors: string[];
  currentFloor: string;
  onFloorChange: (floor: string) => void;
  onSave: () => void;
  onReset: () => void;
  selectedTool: ElementType;
  onToolChange: (tool: ElementType) => void;
  selectedElement: FloorElement | null;
  onElementUpdate: (updates: Partial<FloorElement>) => void;
  onElementDelete: () => void;
}

export const Sidebar = ({
    tables,
    floors,
  currentFloor,
  onFloorChange,
  onSave,
  onReset,
  selectedTool,
  onToolChange,
  selectedElement,
  onElementUpdate,
  onElementDelete,
}: SidebarProps) => {
  return (
    <aside className="w-[22%] min-w-[280px] max-w-[320px] h-screen bg-card border-r border-border overflow-y-auto">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Table Map Editor</h1>
          <p className="text-sm text-muted-foreground">Restaurant Layout Designer</p>
        </div>

        <FloorSelector floors={floors} currentFloor={currentFloor} onFloorChange={onFloorChange} />

        <Separator />

        <ElementToolbar currentElement={selectedElement} selectedTool={selectedTool} onToolChange={onToolChange} />

        <Separator />

        <PropertiesPanel
            tables={tables}
          element={selectedElement}
          onUpdate={onElementUpdate}
          onDelete={onElementDelete}
        />

        <Separator />

        <div className="space-y-3">
          <Button onClick={onSave} className="w-full shadow-soft" variant="default">
            <Save className="mr-2 h-4 w-4" />
            Save Layout
          </Button>

          <Button onClick={onReset} className="w-full shadow-soft" variant="secondary">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Layout
          </Button>
        </div>

        <div className="pt-2">
          <h3 className="text-xs font-semibold text-foreground mb-2">Instructions</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Select element type and click canvas to add</li>
            <li>• Click on element to select and edit</li>
            <li>• Drag elements to reposition</li>
            <li>• Adjust properties in the panel</li>
            <li>• Save to store current layout</li>
          </ul>
        </div>
      </div>
    </aside>
  );
};

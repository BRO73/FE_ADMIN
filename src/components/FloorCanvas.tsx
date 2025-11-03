import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Circle, Text, Group, Rect, Line } from "react-konva";
import Konva from "konva";
import { ElementType } from "./ElementToolbar";
import {FloorElementResponse} from "@/types/type.ts";

export type FloorElement = FloorElementResponse;

interface FloorCanvasProps {
    currentFloor: string;
  elements: FloorElement[];
  onElementsUpdate: (elements: FloorElement[]) => void;
  selectedElementId: number | null;
  onElementSelect: (id: number | null) => void;
  selectedTool: ElementType;
}

const Element = ({
  element,
  isSelected,
  onDragEnd,
  onClick,
}: {
  element: FloorElement;
  isSelected: boolean;
  onDragEnd: (id: number, x: number, y: number) => void;
  onClick: (id: number) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const renderShape = () => {
    const commonProps = {
      fill: element.color,
      stroke: isSelected ? "#FFD700" : isHovered ? "#000000" : "#333333",
      strokeWidth: isSelected ? 4 : 2,
      shadowColor: "rgba(0, 0, 0, 0.2)",
      shadowBlur: isHovered ? 12 : 8,
      shadowOffset: { x: 0, y: 2 },
    };

    switch (element.type) {
      case "table":
        // Square table - top-down view
        return (
          <Rect
            width={element.width}
            height={element.height}
            offsetX={element.width / 2}
            offsetY={element.height / 2}
            {...commonProps}
            cornerRadius={4}
          />
        );
      case "window":
        // Window with glass panes - top-down view
        return (
          <>
            <Rect
              width={element.width}
              height={element.height}
              offsetX={element.width / 2}
              offsetY={element.height / 2}
              fill="#E0F2FE"
              stroke={isSelected ? "#FFD700" : isHovered ? "#000000" : "#0369A1"}
              strokeWidth={isSelected ? 4 : 3}
              shadowColor="rgba(0, 0, 0, 0.2)"
              shadowBlur={isHovered ? 12 : 8}
              shadowOffset={{ x: 0, y: 2 }}
            />
            {/* Window frame divisions */}
            <Line
              points={[
                -element.width / 2,
                0,
                element.width / 2,
                0,
              ]}
              stroke="#0369A1"
              strokeWidth={2}
            />
            <Line
              points={[
                0,
                -element.height / 2,
                0,
                element.height / 2,
              ]}
              stroke="#0369A1"
              strokeWidth={2}
            />
          </>
        );
      case "balcony":
        // Balcony with railing - top-down view
        return (
          <>
            <Rect
              width={element.width}
              height={element.height}
              offsetX={element.width / 2}
              offsetY={element.height / 2}
              {...commonProps}
              cornerRadius={4}
            />
            {/* Railing lines */}
            <Line
              points={[
                -element.width / 2 + 10,
                -element.height / 2 + 10,
                element.width / 2 - 10,
                -element.height / 2 + 10,
              ]}
              stroke="#ffffff"
              strokeWidth={2}
              opacity={0.6}
            />
            <Line
              points={[
                -element.width / 2 + 10,
                element.height / 2 - 10,
                element.width / 2 - 10,
                element.height / 2 - 10,
              ]}
              stroke="#ffffff"
              strokeWidth={2}
              opacity={0.6}
            />
          </>
        );
      case "door":
        // Door with swing arc - top-down view
        return (
          <>
            <Rect
              width={element.width}
              height={element.height}
              offsetX={element.width / 2}
              offsetY={element.height / 2}
              fill="#FEF3C7"
              stroke={isSelected ? "#FFD700" : isHovered ? "#000000" : "#92400E"}
              strokeWidth={isSelected ? 4 : 2}
              shadowColor="rgba(0, 0, 0, 0.2)"
              shadowBlur={isHovered ? 12 : 8}
              shadowOffset={{ x: 0, y: 2 }}
            />
            {/* Door panel */}
            <Rect
              width={element.width * 0.7}
              height={element.height * 0.15}
              offsetX={(element.width * 0.7) / 2}
              offsetY={element.height / 2}
              y={-element.height / 2}
              fill="#D97706"
              cornerRadius={2}
            />
          </>
        );
      case "other":
        // Generic rectangular element
        return (
          <Rect
            width={element.width}
            height={element.height}
            offsetX={element.width / 2}
            offsetY={element.height / 2}
            {...commonProps}
            cornerRadius={4}
          />
        );
    }
  };

  return (
    <Group
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      draggable
      onDragEnd={(e) => {
        onDragEnd(element.id, e.target.x(), e.target.y());
      }}
      onClick={() => onClick(element.id)}
      onTap={() => onClick(element.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {renderShape()}
      {element.label && (
        <Text
          text={element.label}
          fontSize={12}
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#1F2937"
          fontStyle="600"
          align="center"
          offsetY={-element.height / 2 - 15}
          width={element.width}
          offsetX={element.width / 2}
        />
      )}
    </Group>
  );
};

export const FloorCanvas = ({
    currentFloor,
  elements,
  onElementsUpdate,
  selectedElementId,
  onElementSelect,
  selectedTool,
}: FloorCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleDragEnd = (id: number, x: number, y: number) => {
    const updatedElements = elements.map((el) =>
      el.id == id ? { ...el, x, y } : el
    );
    onElementsUpdate(updatedElements);
  };

    const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // If clicked on empty area, add new element or deselect
        if (e.target === e.target.getStage()) {
            const stage = stageRef.current;
            if (!stage) return;

            const pos = stage.getPointerPosition();
            if (!pos) return;

            // Generate temporary unique ID for new elements (negative numbers)
            const tempId = elements.length > 0
                ? Math.min(...elements.map(el => el.id), 0) - 1
                : -1;

            // Add new element at click position
            const newElement: FloorElement = {
                id: tempId,
                type: selectedTool,
                x: pos.x,
                y: pos.y,
                width: selectedTool === "table" ? 80 : selectedTool === "door" ? 60 : 100,
                height: selectedTool === "table" ? 80 : selectedTool === "door" ? 80 : 100,
                rotation: 0,
                color: getDefaultColor(selectedTool),
                label: `${selectedTool} ${elements.filter((el) => el.type === selectedTool).length + 1}`,
                floor: currentFloor
            };
            onElementsUpdate([...elements, newElement]);
            onElementSelect(newElement.id);
        }
    };

  const getDefaultColor = (type: ElementType): string => {
    switch (type) {
      case "table":
        return "#8B5CF6";
      case "window":
        return "#3B82F6";
      case "balcony":
        return "#10B981";
      case "door":
        return "#F59E0B";
      case "other":
        return "#6B7280";
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-canvas-bg rounded-lg shadow-medium cursor-crosshair">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        <Layer>
          {elements.map((element) => (
            <Element
              key={element.id}
              element={element}
              isSelected={selectedElementId === element.id}
              onDragEnd={handleDragEnd}
              onClick={onElementSelect}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

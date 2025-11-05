import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { FloorCanvas, FloorElement } from "@/components/FloorCanvas";
import { ElementType } from "@/components/ElementToolbar";
import { toast } from "sonner";

import { useLocations } from "@/hooks/useLocations";
import {
    useCreateFloorElement,
    useDeleteFloorElement,
    useUpdateFloorElement,
    useFloorElements,
} from "@/hooks/useFloorElements";
import {useTables} from "@/hooks/useTables.ts";

const TableMapEditor = () => {
    // Tables hook
    const { tables} = useTables();
    const { locations, loading, error } = useLocations();
    const floors = locations.map((location) => location.name);

    const [currentFloor, setCurrentFloor] = useState<string>("");
    const [selectedElementId, setSelectedElementId] = useState<number | null>(null);
    const [selectedTool, setSelectedTool] = useState<ElementType>("table");

    const { data: elements = [], refetch } = useFloorElements();
    const createElement = useCreateFloorElement();
    const updateElement = useUpdateFloorElement();
    const deleteElement = useDeleteFloorElement();

    const previousFloorRef = useRef<string>(currentFloor);

    // 🔹 Lọc elements theo tầng hiện tại
    const currentFloorElements = elements.filter(
        (el) => el.floor === currentFloor
    );
    useEffect(() => {
        if (floors.length > 0 && !currentFloor) {
            setCurrentFloor(floors[0]);
        }
    }, [floors, currentFloor]);

    const selectedElement =
        currentFloorElements.find((el) => el.id === selectedElementId) || null;

    // 🧠 Hàm update tất cả element thuộc 1 floor
    const updateFloorElements = async (floorName: string) => {
        console.log(updateElement);
        const floorElements = elements.filter((el) => el.floor === floorName);
        if (!floorElements.length) return;

        try {
            await Promise.all(
                floorElements.map(async (el) => {
                    // Nếu chưa có ID (chưa lưu trong DB) → POST (create)
                    console.log(el.id);
                    if (el.id === -1) {
                        await createElement.mutateAsync({
                            type: el.type,
                            x: el.x,
                            y: el.y,
                            width: el.width,
                            height: el.height,
                            rotation: el.rotation,
                            color: el.color,
                            label: el.label,
                            floor: el.floor,
                            tableId: el.tableId,
                        });
                    }
                    // Nếu đã có ID → PUT (update)
                    else {
                        await updateElement.mutateAsync({
                            id: el.id,
                            payload: {
                                type: el.type,
                                x: el.x,
                                y: el.y,
                                width: el.width,
                                height: el.height,
                                rotation: el.rotation,
                                color: el.color,
                                label: el.label,
                                floor: el.floor,
                                tableId: el.tableId,
                            },
                        });
                    }
                })
            );

            toast.success(`Floor "${floorName}" saved successfully!`);
        } catch (error) {
            console.error(error);
            toast.error(`Failed to save floor "${floorName}"`);
        }
    };


    // 🔁 Khi đổi tầng → update tầng cũ + load tầng mới
    const handleFloorChange = async (newFloor: string) => {
        const prevFloor = previousFloorRef.current;
        if (prevFloor !== newFloor) {
            await updateFloorElements(prevFloor);
            previousFloorRef.current = newFloor;
            setCurrentFloor(newFloor);
            setSelectedElementId(null);
            await refetch();
        }
    };

    // 🔹 Update 1 element duy nhất
    const handleElementUpdate = async (updatedElement: FloorElement) => {
        console.log(updatedElement);
        try {
            if(updatedElement.id === -1) {
                await createElement.mutateAsync({
                    type: updatedElement.type,
                    x: updatedElement.x,
                    y: updatedElement.y,
                    width: updatedElement.width,
                    height: updatedElement.height,
                    rotation: updatedElement.rotation,
                    color: updatedElement.color ?? "#000000", // fallback nếu chưa có màu
                    label: updatedElement.label ?? "",        // fallback nếu chưa có nhãn
                    floor: updatedElement.floor,              // hoặc currentFloor nếu bạn đang ở tầng hiện tại
                    tableId: updatedElement.tableId ?? undefined,
                });

            }
            await updateElement.mutateAsync({
                id: updatedElement.id,
                payload: updatedElement,
            });
            await refetch();

        } catch (error) {
            console.error(error);
            toast.error("Failed to update element");
        }
    };

    // 🔹 Xoá element
    const handleElementDelete = async () => {
        if (!selectedElementId) return;
        try {
            await deleteElement.mutateAsync(selectedElementId);
            setSelectedElementId(null);
            await refetch();
            toast.success("Element deleted successfully!");
        } catch (error) {
            toast.error("Failed to delete element");
        }
    };

    // 🔹 Update nhiều element trong cùng floor (ví dụ khi kéo thả)
    const handleElementsUpdate = async (updatedElements: FloorElement[]) => {
        try {
            await Promise.all(
                updatedElements.map((el) => {
                    if(el.id === -1){
                        createElement.mutateAsync({
                            type: el.type,
                            x: el.x,
                            y: el.y,
                            width: el.width,
                            height: el.height,
                            rotation: el.rotation,
                            color: el.color ?? "#000000", // fallback nếu chưa có màu
                            label: el.label ?? "",        // fallback nếu chưa có nhãn
                            floor: el.floor,              // hoặc currentFloor nếu bạn đang ở tầng hiện tại
                            tableId: el.tableId ?? undefined,
                        })
                    }else {
                        updateElement.mutateAsync({
                            id: el.id,
                            payload: el,
                        })
                    }
                }
                ));
            await refetch();
        } catch (error) {
            toast.error("Failed to update elements");
        }
    };

    return (
        <div className="flex h-screen w-full bg-background">
            <Sidebar
                tables={tables}
                floors={floors}
                currentFloor={currentFloor}
                onFloorChange={handleFloorChange}
                onSave={() => toast.success("Layout saved successfully!")}
                onReset={async () => {
                    await refetch();
                    toast.success(`${currentFloor} reset successfully!`);
                }}
                selectedTool={selectedTool}
                onToolChange={setSelectedTool}
                selectedElement={selectedElement}
                onElementUpdate={handleElementUpdate}
                onElementDelete={handleElementDelete}
            />

            <main className="flex-1 p-6">
                <div className="h-full">
                    <FloorCanvas
                        tables={tables}
                        currentFloor={currentFloor}
                        elements={currentFloorElements} // ✅ chỉ render element của tầng hiện tại
                        onElementsUpdate={handleElementsUpdate}
                        selectedElementId={selectedElementId}
                        onElementSelect={setSelectedElementId}
                        selectedTool={selectedTool}
                    />
                </div>
            </main>
        </div>
    );
};

export default TableMapEditor;

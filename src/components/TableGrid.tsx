import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TableGridProps {
  children: ReactNode;
  className?: string;
}

export const TableGrid = ({ children, className }: TableGridProps) => {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4",
        className
      )}
    >
      {children}
    </div>
  );
};

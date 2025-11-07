import { cn } from "@/lib/utils";
import { Lock, User, Clock, Plus, Printer } from "lucide-react";

export type TableStatus =
  | "available"
  | "occupied"
  | "reserved"
  | "selected"
  | "printed"
  | "merged"
  | "reserved-soon";

interface TableCardProps {
  name: string;
  status: TableStatus;
  isVIP?: boolean;
  onClick?: () => void;
  className?: string;
  orderNumber?: string;
}

export const TableCard = ({
  name,
  status,
  isVIP,
  onClick,
  className,
  orderNumber,
}: TableCardProps) => {
  const getStatusStyles = () => {
    // VIP phòng có ưu tiên cao nhất khi available
    if (isVIP && status === "available") {
      return "bg-[hsl(var(--vip))] text-[hsl(var(--vip-foreground))] border-[hsl(var(--vip))]";
    }

    switch (status) {
      case "available":
        return "bg-card text-card-foreground border-border";
      case "occupied":
        return "bg-[hsl(var(--available))] text-[hsl(var(--available-foreground))] border-[hsl(var(--available))]";
      case "selected":
        return "bg-[hsl(var(--selected))] text-[hsl(var(--selected-foreground))] border-[hsl(var(--selected))] shadow-lg";
      case "printed":
        return "bg-[hsl(var(--printed))] text-[hsl(var(--printed-foreground))] border-[hsl(var(--printed-foreground))]";
      case "merged":
        return "bg-[hsl(var(--merged))] text-[hsl(var(--merged-foreground))] border-[hsl(var(--merged-foreground))]";
      case "reserved-soon":
        return "bg-[hsl(var(--reserved-soon))] text-[hsl(var(--reserved-soon-foreground))] border-[hsl(var(--reserved-soon-foreground))]";
      case "reserved":
        return "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] border-[hsl(var(--warning))]";
      default:
        return "";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "occupied":
        return <User className="w-4 h-4 md:w-5 md:h-5" />;
      case "printed":
        return <Lock className="w-4 h-4 md:w-5 md:h-5" />;
      case "merged":
        return <Plus className="w-4 h-4 md:w-5 md:h-5" />;
      case "reserved-soon":
        return <Clock className="w-4 h-4 md:w-5 md:h-5" />;
      case "reserved":
        return <Lock className="w-4 h-4 md:w-5 md:h-5" />;
      default:
        return null;
    }
  };

  const icon = getStatusIcon();

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border-2 transition-all duration-200",
        "hover:scale-105 hover:shadow-lg active:scale-95",
        "min-h-[90px] md:min-h-[110px]",
        getStatusStyles(),
        className
      )}
    >
      {/* Icon - top right corner */}
      {icon && <div className="absolute top-2 right-2">{icon}</div>}

      {/* Table name */}
      <span className="text-sm md:text-base font-semibold text-center mb-1">
        {name}
      </span>

      {/* Order number - for printed status */}
      {orderNumber && status === "printed" && (
        <div className="flex items-center gap-1 text-xs md:text-sm font-medium">
          <Printer className="w-3 h-3 md:w-4 md:h-4" />
          <span>{orderNumber}</span>
        </div>
      )}
    </button>
  );
};

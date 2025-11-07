import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const TabNavigation = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}: TabNavigationProps) => {
  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200",
            "border-2",
            activeTab === tab.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-card-foreground border-border hover:border-primary hover:bg-accent"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-2 text-sm">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
};

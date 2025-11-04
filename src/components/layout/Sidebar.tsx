import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard,
  Users,
  Table,
  ChefHat,
  Calendar,
  MessageSquare,
  Megaphone,
  BarChart3,
  CreditCard,
  X,
  UserCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navigationItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Table Management", href: "/admin/tables", icon: Table },
  { name: "Customer Management", href: "/admin/customers", icon: UserCircle },
  { name: "Staff Management", href: "/admin/staff", icon: Users },
  { name: "Menu Management", href: "/admin/menu", icon: ChefHat },
  { name: "Bookings", href: "/admin/bookings", icon: Calendar },
  { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
  { name: "Promotions", href: "/admin/promotions", icon: Megaphone },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "Transactions", href: "/admin/transactions", icon: CreditCard },
  { name: "Table Map", href: "/admin/tablemap", icon: CreditCard },
];

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      {!collapsed && (
        <div 
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "sidebar-container",
        collapsed ? "collapsed" : ""
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className={cn(
            "flex items-center space-x-3",
            collapsed && "lg:justify-center"
          )}>
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-xl font-bold text-foreground">Admin</span>
            )}
          </div>
          
          {/* Mobile Close Button */}
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => {
                  // Close mobile sidebar on navigation
                  if (window.innerWidth < 1024) {
                    onToggle();
                  }
                }}
                className={cn(
                  "flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  collapsed && "lg:justify-center lg:px-3"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 flex-shrink-0",
                  collapsed ? "lg:w-6 lg:h-6" : "mr-3"
                )} />
                {!collapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
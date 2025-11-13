import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut, Shield, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthUser } from "@/hooks/useAuthUser";

const UserProfileDropdown = () => {
  const navigate = useNavigate();
  const user = useAuthUser(); // 🔥 Lấy user từ API /api/users/profile

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2 hover:bg-muted/50"
        >
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>

          <span className="hidden sm:block text-sm font-medium">
            {user?.fullName || "User"}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user?.fullName || "Unknown"}</p>
            <p className="text-xs text-muted-foreground">{user?.email || "No email"}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* nút Profile */}
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="w-4 h-4 mr-2" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Settings className="w-4 h-4 mr-2" />
          <span>Account Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Shield className="w-4 h-4 mr-2" />
          <span>Security</span>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <CreditCard className="w-4 h-4 mr-2" />
          <span>Billing</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileDropdown;

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface BookingResponse {
  id: number;
  customerName: string;
  bookingTime: string;
  table: { tableNumber: number }[];
  createdAt: string;
}

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const accessToken = localStorage.getItem("accessToken");

  // 🟢 Load notifications from NEW BOOKINGS
  useEffect(() => {
    if (!accessToken) return;

    const loadNewBookings = async () => {
      try {
        const res = await fetch("http://localhost:8082/api/bookings", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data: BookingResponse[] = await res.json();

        if (!Array.isArray(data)) return;

        // 🔥 Chuyển từng booking thành một notification
        const generatedNoti = data.map((bk) => ({
          id: String(bk.id),
          title: "New Booking",
          message: `Booking by ${bk.customerName} at ${formatDate(bk.bookingTime)} (Table ${bk.table?.[0]?.tableNumber ?? "?"})`,
          time: timeAgo(bk.createdAt),
          read: false,
        }));

        setNotifications(generatedNoti);
      } catch (err) {
        console.error("Failed to load booking notifications:", err);
      }
    };

    loadNewBookings();
  }, [accessToken]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Định dạng thời gian hiển thị
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN");
  };

  const timeAgo = (dateStr: string) => {
    const seconds = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + " min ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + " hours ago";
    return Math.floor(seconds / 86400) + " days ago";
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markSingleAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center p-0"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>

          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

        {/* LIST */}
        <ScrollArea className="max-h-80">
          {notifications.length > 0 ? (
            <div className="p-1">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`flex items-start space-x-3 p-3 hover:bg-muted/50 cursor-pointer ${
                      !notification.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full mt-2 bg-blue-500" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{notification.title}</p>

                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-4 h-4 p-0"
                            onClick={() => markSingleAsRead(notification.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.time}
                      </p>
                    </div>
                  </div>

                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-2">
          <Button variant="ghost" className="w-full text-sm">
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;

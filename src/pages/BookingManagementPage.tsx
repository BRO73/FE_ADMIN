import { useState } from "react";
import {
  Plus,
  Edit,
  X,
  Search,
  Check,
  Phone,
  Mail,
  Utensils,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBooking } from "@/hooks/useBooking";
import BookingFormModal from "@/components/forms/BookingFormModal";
import DeleteConfirmDialog from "@/components/forms/DeleteConfirmDialog";
import {BookingResponse, BookingRequest, TableResponse, CustomerSimpleResponse} from "@/types/type.ts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


const BookingManagementPage = () => {
  const {
    bookings,
    addBooking,
    editBooking,
    removeBooking,
    loading,
  } = useBooking();

  const [searchTerm, setSearchTerm] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [detailBooking, setDetailBooking] = useState<BookingResponse | undefined>();
  const [calendarView, setCalendarView] = useState<"week" | "day">("week");

  // ✅ Tìm kiếm theo tên, sđt, email
  const filteredBookings = bookings.filter((b) =>
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customerPhone.includes(searchTerm) ||
      b.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ Hàm xử lý submit từ modal
  const handleFormSubmit = async (data: BookingRequest) => {
    console.log(data);
    console.log(formMode);
    console.log(selectedBooking);
    if (formMode === "add") {
      await addBooking(data);
    } else if (formMode === "edit" && selectedBooking) {
      await editBooking(selectedBooking.id, data);
    }
    setIsFormModalOpen(false);
  };
  const handleEditData = async (booking: BookingResponse) => {
    const bookingRequest: BookingRequest = {
      status: "confirmed",
      tableIds: booking.table.map((t) => t.id), // ✅ convert table[] -> tableIds[]
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail,
      bookingTime: booking.bookingTime,
      numGuests: booking.numGuests,
      notes: booking.notes
    };
    if (formMode === "add") {
      await addBooking(bookingRequest);
    } else if (formMode === "edit" && selectedBooking) {
      await editBooking(selectedBooking.id, bookingRequest);
    }
    setIsFormModalOpen(false);
  };

  // ✅ Xác nhận xóa/hủy đặt bàn
  const handleDeleteConfirm = async () => {
    if (!selectedBooking) return;
    await removeBooking(selectedBooking.id);
    setIsDeleteDialogOpen(false);
  };

// ✅ Accept booking (update status → confirmed)
  const handleAccept = async (booking: BookingResponse) => {
    const bookingRequest: BookingRequest = {
      status: "confirmed",
      tableIds: booking.table.map((t) => t.id), // ✅ convert table[] -> tableIds[]
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail,
      bookingTime: booking.bookingTime,
      numGuests: booking.numGuests,
      notes: booking.notes
    };

    await editBooking(booking.id, bookingRequest);
  };


  // ✅ Reject booking (open dialog xác nhận)
  const handleReject = (booking: BookingResponse) => {
    setSelectedBooking(booking);
    setIsDeleteDialogOpen(true);
  };

  // ✅ Helper màu trạng thái
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  // Get current week dates
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(today.setDate(diff));
  });

  const getWeekDates = (startDate: Date) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedWeekStart);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeekStart(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    setSelectedWeekStart(new Date(today.setDate(diff)));
  };

  // Time slots from 10:00 to 23:00
  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const hour = 10 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const getBookingsForDateAndTime = (
      bookings: BookingResponse[],
      date: Date,
      timeSlot: string // ví dụ "19:00"
  ): BookingResponse[] => {
    const dateString = date.toISOString().split('T')[0]; // yyyy-MM-dd
    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);

    return bookings.filter((b) => {
      if (!b.bookingTime) return false;

      const bookingDate = new Date(b.bookingTime);

      return (
          bookingDate.getFullYear() === date.getFullYear() &&
          bookingDate.getMonth() === date.getMonth() &&
          bookingDate.getDate() === date.getDate() &&
          bookingDate.getHours() === slotHour

    );
    });
  };



  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDay);
    newDate.setDate(selectedDay.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDay(newDate);
  };

  const goToTodayDay = () => {
    setSelectedDay(new Date());
  };
  const pad = (n: number) => n.toString().padStart(2, "0");

  const handleAddBookingFromCalendar = (date: Date, timeSlot: string) => {
    const dateString = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const bookingTime = `${dateString}T${timeSlot}:00`; // giờ local +7
    setFormMode("add");
    setSelectedBooking({
      id: 0,
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      bookingTime,
      numGuests: 2,
      status: "pending",
      notes: "",
      table: [],
      customer: { id: 0, username: "" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as BookingResponse);

    setIsFormModalOpen(true);
  };

  const handleViewBookingDetail = (booking: BookingResponse) => {
    setDetailBooking(booking);
    setIsDetailDialogOpen(true);
  };

  return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Booking Management</h1>
            <p className="text-muted-foreground mt-1">Manage restaurant reservations.</p>
          </div>
          <Button onClick={() => {
            setFormMode("add");
            setSelectedBooking(null);
            setIsFormModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" /> New Booking
          </Button>
        </div>

        {/* Search */}


        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="list">Bookings List</TabsTrigger>
            <TabsTrigger value="schedule">Booking Schedule</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="space-y-6">
            <Card className="p-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search by customer name, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
              </div>
            </Card>
        {/* Table */}
        <Card className="overflow-x-auto">
          {loading ? (
              <p className="p-4 text-center text-muted-foreground">Loading...</p>
          ) : (
              <table className="w-full">
                <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Contact</th>
                  <th className="text-left py-3 px-4">Table(s)</th>
                  <th className="text-left py-3 px-4">Guests</th>
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
                </thead>
                <tbody>
                {filteredBookings.map((b) => (
                    <tr key={b.id} className="border-b border-border hover:bg-muted/30">
                      {/* Customer */}
                      <td className="py-3 px-4 font-medium">{b.customerName}</td>

                      {/* Contact */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col text-sm">
                      <span className="flex items-center gap-2">
                        <Phone className="w-4 h-4" /> {b.customerPhone}
                      </span>
                          <span className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" /> {b.customerEmail || "—"}
                      </span>
                        </div>
                      </td>

                      {/* Tables */}
                      <td className="py-3 px-4">
                        {b.table?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {b.table.map((t: TableResponse) => (
                                  <Badge key={t.id} variant="secondary" className="flex items-center gap-1">
                                    {t.tableNumber || t.tableNumber}
                                  </Badge>
                              ))}
                            </div>
                        ) : (
                            <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Guests */}
                      <td className="py-3 px-4">{b.numGuests}</td>

                      {/* Time */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col text-sm">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> {b.bookingTime?.split("T")[0] || "—"}
                      </span>
                          <span className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" /> {b.bookingTime?.split("T")[1]?.slice(0, 5) || "—"}
                      </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(b.status || "pending")}>
                          {b.status || "pending"}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right flex justify-end gap-2">
                        {b.status.toLowerCase() === "pending" && (
                            <>
                              <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                                  onClick={() => handleAccept(b)}
                              >
                                <Check className="w-4 h-4 mr-1" /> Accept
                              </Button>
                              <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                                  onClick={() => handleReject(b)}
                              >
                                <X className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </>
                        )}
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setFormMode("edit");
                              setSelectedBooking(b);
                              setIsFormModalOpen(true);
                            }}
                        >
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </Button>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
          )}
        </Card>
          </TabsContent>
          <TabsContent value="schedule" className="space-y-6">
            {/* View Selector and Navigation */}
            <Card className="dashboard-card">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* View Toggle */}
                <div className="flex gap-2">
                  <Button
                      variant={calendarView === "week" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCalendarView("week")}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Week
                  </Button>
                  <Button
                      variant={calendarView === "day" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCalendarView("day")}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Day
                  </Button>
                </div>

                {/* Navigation based on view */}
                {calendarView === "week" ? (
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground min-w-[200px] text-center">
                        {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </h3>
                      <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="sm" onClick={() => navigateDay('prev')}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground min-w-[200px] text-center">
                        {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </h3>
                      <Button variant="outline" size="sm" onClick={() => navigateDay('next')}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                )}

                <Button variant="outline" size="sm" onClick={calendarView === "week" ? goToToday : goToTodayDay}>
                  Today
                </Button>
              </div>
            </Card>

            {/* Calendar Grid - Week or Day View */}
            {calendarView === "week" ? (
                /* Week View */
                <Card className="dashboard-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-[900px]">
                      {/* Header with days */}
                      <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border">
                        <div className="p-3 border-r border-border"></div>
                        {weekDates.map((date, idx) => (
                            <div
                                key={idx}
                                className={`p-3 text-center border-r border-border ${
                                    isToday(date) ? 'bg-primary/5' : ''
                                }`}
                            >
                              <div className="text-xs text-muted-foreground uppercase">
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                              <div className={`text-xl font-semibold mt-1 ${
                                  isToday(date) ? 'text-primary' : 'text-foreground'
                              }`}>
                                {date.getDate()}
                              </div>
                            </div>
                        ))}
                      </div>

                      {/* Time slots and bookings grid */}
                      <div className="relative">
                        {timeSlots.map((timeSlot, slotIdx) => (
                            <div
                                key={timeSlot}
                                className={`grid grid-cols-[80px_repeat(7,1fr)] ${
                                    slotIdx !== timeSlots.length - 1 ? 'border-b border-border' : ''
                                }`}
                                style={{ minHeight: '80px' }}
                            >
                              {/* Time label */}
                              <div className="p-3 text-xs text-muted-foreground font-medium border-r border-border flex items-start">
                                {timeSlot}
                              </div>

                              {/* Day columns */}
                              {weekDates.map((date, dayIdx) => {
                                const dayBookings = getBookingsForDateAndTime(bookings,date, timeSlot);

                                return (
                                    <div
                                        key={dayIdx}
                                        className={`p-1 border-r border-border relative group cursor-pointer hover:bg-accent/30 transition-colors ${
                                            isToday(date) ? 'bg-primary/5' : ''
                                        }`}
                                        onClick={() => dayBookings.length === 0 && handleAddBookingFromCalendar(date, timeSlot)}
                                    >
                                      {dayBookings.length > 0 ? (
                                          <div className="space-y-1">
                                            {dayBookings.map((booking) => (
                                                <div
                                                    key={booking.id}
                                                    className="rounded-md p-2 cursor-pointer hover:shadow-lg transition-all text-xs"
                                                    style={{
                                                      backgroundColor:
                                                          booking.status === 'confirmed' ? 'hsl(var(--success) / 0.15)' :
                                                              booking.status === 'pending' ? 'hsl(var(--warning) / 0.15)' :
                                                                  booking.status === 'cancelled' ? 'hsl(var(--destructive) / 0.15)' :
                                                                      'hsl(var(--muted))',
                                                      borderLeft: `3px solid ${
                                                          booking.status === 'confirmed' ? 'hsl(var(--success))' :
                                                              booking.status === 'pending' ? 'hsl(var(--warning))' :
                                                                  booking.status === 'cancelled' ? 'hsl(var(--destructive))' :
                                                                      'hsl(var(--muted))'
                                                      }`
                                                    }}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleViewBookingDetail(booking);
                                                    }}
                                                >
                                                  <div className="font-semibold text-foreground truncate">
                                                    {booking.customerName}
                                                  </div>
                                                  <div className="text-muted-foreground mt-0.5">
                                                    {booking.bookingTime}
                                                  </div>
                                                  <div className="text-muted-foreground">
                                                    {booking.table.length > 0
                                                        ? booking.table.map((t) => t.tableNumber).join(", ")
                                                        : "—"}

                                                    {/* Tổng sức chứa */}
                                                    • {booking.table.reduce((sum, t) => sum + (t.capacity || 0), 0)} P
                                                  </div>
                                                </div>
                                            ))}
                                          </div>
                                      ) : (
                                          <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Plus className="w-4 h-4 text-muted-foreground" />
                                          </div>
                                      )}
                                    </div>
                                );
                              })}
                            </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
            ) : (
                /* Day View */
                <Card className="dashboard-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="min-w-[400px]">
                      {/* Header with single day */}
                      <div className="grid grid-cols-[80px_1fr] border-b border-border">
                        <div className="p-3 border-r border-border"></div>
                        <div className={`p-3 text-center border-r border-border ${isToday(selectedDay) ? 'bg-primary/5' : ''}`}>
                          <div className="text-xs text-muted-foreground uppercase">
                            {selectedDay.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className={`text-xl font-semibold mt-1 ${isToday(selectedDay) ? 'text-primary' : 'text-foreground'}`}>
                            {selectedDay.getDate()}
                          </div>
                        </div>
                      </div>

                      {/* Time slots and bookings for single day */}
                      <div className="relative">
                        {timeSlots.map((timeSlot, slotIdx) => {
                          const dayBookings = getBookingsForDateAndTime(bookings, selectedDay, timeSlot);

                          return (
                              <div
                                  key={timeSlot}
                                  className={`grid grid-cols-[80px_1fr] ${slotIdx !== timeSlots.length - 1 ? 'border-b border-border' : ''}`}
                                  style={{ minHeight: '80px' }}
                              >
                                {/* Time label */}
                                <div className="p-3 text-xs text-muted-foreground font-medium border-r border-border flex items-start">
                                  {timeSlot}
                                </div>

                                {/* Booking + Empty cell wrapper */}
                                <div className="flex border-r border-border">
                                  {dayBookings.map((booking) => (
                                      <div
                                          key={booking.id}
                                          className="flex-shrink-0 w-40 p-2 border-r border-border relative cursor-pointer hover:bg-accent/30 transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewBookingDetail(booking);
                                          }}
                                      >
                                        <div
                                            className="rounded-md p-3 text-xs transition-all hover:shadow-lg h-full"
                                            style={{
                                              backgroundColor:
                                                  booking.status === 'confirmed' ? 'hsl(var(--success) / 0.15)' :
                                                      booking.status === 'pending' ? 'hsl(var(--warning) / 0.15)' :
                                                          booking.status === 'cancelled' ? 'hsl(var(--destructive) / 0.15)' :
                                                              'hsl(var(--muted))',
                                              borderLeft: `3px solid ${
                                                  booking.status === 'confirmed' ? 'hsl(var(--success))' :
                                                      booking.status === 'pending' ? 'hsl(var(--warning))' :
                                                          booking.status === 'cancelled' ? 'hsl(var(--destructive))' :
                                                              'hsl(var(--muted))'
                                              }`
                                            }}
                                        >
                                          <div className="font-semibold text-foreground truncate">{booking.customerName}</div>
                                          <div className="text-muted-foreground mt-0.5">{booking.bookingTime}</div>
                                          <div className="text-muted-foreground text-xs mt-1">
                                            {booking.table.length > 0 ? booking.table.map((t) => t.tableNumber).join(", ") : "—"} • {booking.table.reduce((sum, t) => sum + (t.capacity || 0), 0)} P
                                          </div>
                                        </div>
                                      </div>
                                  ))}

                                  {/* Empty cell */}
                                  <div
                                      className="flex-shrink-0 w-40 p-2 border-r border-border relative cursor-pointer hover:bg-accent/30 transition-colors flex items-center justify-center"
                                      onClick={() => handleAddBookingFromCalendar(selectedDay, timeSlot)}
                                  >
                                    <Plus className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                </div>
                              </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>
                </Card>
            )}
          </TabsContent>
        </Tabs>
        {/* Modals */}
        <BookingFormModal
            isOpen={isFormModalOpen}
            onClose={() => setIsFormModalOpen(false)}
            onSubmit={handleFormSubmit}
            booking={selectedBooking || undefined}
            mode={formMode}
        />

        <DeleteConfirmDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            onConfirm={handleDeleteConfirm}
            title="Reject Booking"
            description="Are you sure you want to reject (delete) this booking?"
            itemName={selectedBooking?.customerName}
            isLoading={loading}
        />
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            {detailBooking && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(detailBooking.status)}>
                      {detailBooking.status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
                        <p className="text-foreground font-medium">{detailBooking.customerName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Phone</p>
                        <p className="text-foreground">{detailBooking.customerPhone}</p>
                      </div>
                    </div>

                    {detailBooking.customerEmail && (
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <p className="text-foreground">{detailBooking.customerEmail}</p>
                          </div>
                        </div>
                    )}

                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
                        <p className="text-foreground">
                          {new Date(detailBooking.bookingTime).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })} at {detailBooking.bookingTime}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Table</p>
                          <p className="text-foreground font-medium">{detailBooking.table.length>0?detailBooking.table.map((t)=> t.tableNumber).join(",") : "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Party Size</p>
                          <p className="text-foreground font-medium">{detailBooking.table.length>0?detailBooking.table.reduce((sum,t)=> sum + (t.capacity) || 0,0) : "-"} guests</p>
                        </div>
                      </div>
                    </div>

                    {detailBooking.notes && (
                        <div className="pt-3 border-t border-border">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Special Requests</p>
                          <p className="text-foreground text-sm">{detailBooking.notes}</p>
                        </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                        className="flex-1"
                        variant="outline"
                        onClick={() => {
                          setIsDetailDialogOpen(false); // đóng detail dialog
                          setFormMode("edit");           // set modal mode là edit
                          setSelectedBooking(detailBooking); // truyền dữ liệu booking vào modal
                          setIsFormModalOpen(true);      // mở modal edit
                        }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    {detailBooking.status !== 'cancelled' && (
                        <Button
                            className="flex-1"
                            variant="destructive"
                            onClick={() => {
                              setIsDetailDialogOpen(false);
                              handleReject(detailBooking);
                            }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                    )}
                  </div>
                </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default BookingManagementPage;

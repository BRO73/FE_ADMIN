import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import TableManagementPage from "./pages/TableManagementPage";
import StaffManagementPage from "./pages/StaffManagementPage";
import MenuManagementPage from "./pages/MenuManagementPage";
import BookingManagementPage from "./pages/BookingManagementPage";
import FeedbackPage from "./pages/FeedbackPage";
import PromotionPage from "./pages/PromotionPage";
import ReportsPage from "./pages/ReportsPage";
import TransactionsPage from "./pages/TransactionsPage";
import TableMapEditor from "@/pages/TableMapEditor.tsx";
import NotFound from "@/pages/NotFound.tsx";
import Login from "@/pages/Login.tsx";
import Register from "@/pages/Register.tsx";
import CartItem from "./pages/CartItem";
import MenuPage from "./pages/MenuPage";
import FirebaseOtpLogin from "@/components/login/FirebaseOtpLogin";
import CustomerManagementPage from "./pages/CustomerManagementPage";
import Profile from "./pages/Profile";
import TableManagement from "./pages/TableManagement";

import LiveOrderPage from "./pages/LiveOrderPage";
import MenuOrderPage from "./pages/MenuOrderPage";


import MenuAvailabilityPage from "./pages/MenuAvailabilityPage";
import KitchenDashboardPage from "@/pages/KitchenDashboardPage.tsx";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      defaultTheme="system"
      storageKey="restaurant-dashboard-theme"
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/cart" element={<CartItem />} />
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/otp-login" element={<FirebaseOtpLogin />} />
            <Route path="/profile" element={<Profile />} />

              <Route path="kitchen" element={<KitchenDashboardPage />} />

            <Route path="kitchen" element={<KitchenDashboardPage />} />
            <Route path="/tables" element={<TableManagement />} />
            <Route path="/live-order" element={<LiveOrderPage />} />
            <Route path="/menu-order" element={<MenuOrderPage />} />
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="tables" element={<TableManagementPage />} />
              <Route path="customers" element={<CustomerManagementPage />} />
              <Route path="staff" element={<StaffManagementPage />} />
              <Route path="menu" element={<MenuManagementPage />} />
              <Route
                path="menu-availability"
                element={<MenuAvailabilityPage />}
              />
              <Route path="bookings" element={<BookingManagementPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="promotions" element={<PromotionPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="tablemap" element={<TableMapEditor />} />
              


            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

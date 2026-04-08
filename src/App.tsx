import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotificationProvider } from "@/components/NotificationProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import FarmerDashboard from "./pages/FarmerDashboard";
import FarmerApplication from "./pages/FarmerApplication";
import OrderHistory from "./pages/OrderHistory";
import SoilCheck from "./pages/SoilCheck";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="farmtrade-theme">
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PageBreadcrumb />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/farmer" element={<FarmerDashboard />} />
            <Route path="/farmer/apply" element={<FarmerApplication />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/soil-check" element={<SoilCheck />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;

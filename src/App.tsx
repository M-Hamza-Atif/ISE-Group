import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProductDetail from "./pages/ProductDetail";
import AddProduct from "./pages/AddProduct";
import MyProducts from "./pages/MyProducts";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import Requests from "./pages/Requests";
import Messages from "./pages/Messages";
import TransactionHistory from "./pages/TransactionHistory";
import Analytics from "./pages/Analytics";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminModeration from "./pages/AdminModeration";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import AdminAppeals from "./pages/AdminAppeals";
import AdminReports from "./pages/AdminReports";
import AdminAnalytics from "./pages/AdminAnalytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/products/new" element={<AddProduct />} />
              <Route path="/products/:id/edit" element={<AddProduct />} />
              <Route path="/my-products" element={<MyProducts />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/transactions" element={<TransactionHistory />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/moderation" element={<AdminModeration />} />
              <Route path="/admin/announcements" element={<AdminAnnouncements />} />
              <Route path="/admin/appeals" element={<AdminAppeals />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

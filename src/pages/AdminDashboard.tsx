import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminSession, clearAdminSession } from '@/lib/admin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, Users, Package, ShoppingBag, Heart, 
  TrendingUp, LogOut, Grid3x3, BarChart3 
} from 'lucide-react';
import { toast } from 'sonner';
import { signOut } from '@/lib/supabase';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminProducts from '@/components/admin/AdminProducts';
import AdminCategories from '@/components/admin/AdminCategories';

interface Stats {
  total_users: number;
  total_products: number;
  active_products: number;
  sold_products: number;
  total_categories: number;
  total_favorites: number;
}

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const verifyAdmin = async () => {
      // Check admin session first
      if (!isAdminSession()) {
        toast.error('Access denied. Please log in as admin.');
        navigate('/admin/login');
        return;
      }

      if (!authLoading && !user) {
        navigate('/admin/login');
        return;
      }

      if (user) {
        await fetchStats();
      }
      setLoading(false);
    };

    verifyAdmin();
  }, [user, authLoading, navigate]);

  const fetchStats = async () => {
    try {
      // Get stats manually since RPC function might not exist yet
      const [usersCount, productsCount, categoriesCount, favoritesCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('favorites').select('*', { count: 'exact', head: true }),
      ]);

      const { data: productsData } = await supabase
        .from('products')
        .select('status');

      const activeProducts = productsData?.filter(p => p.status === 'available').length || 0;
      const soldProducts = productsData?.filter(p => p.status === 'sold').length || 0;

      setStats({
        total_users: usersCount.count || 0,
        total_products: productsCount.count || 0,
        active_products: activeProducts,
        sold_products: soldProducts,
        total_categories: categoriesCount.count || 0,
        total_favorites: favoritesCount.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    }
  };

  const handleSignOut = async () => {
    try {
      clearAdminSession();
      await signOut();
      toast.success('Admin logged out successfully');
      navigate('/admin/login');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-xl font-semibold">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-red-100 text-sm">FAST BAZAAR Management</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-blue-500/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {stats?.total_users || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Registered accounts</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-500/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
              <Package className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {stats?.total_products || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.active_products || 0} active, {stats?.sold_products || 0} sold
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-500/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
              <Grid3x3 className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {stats?.total_categories || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Product categories</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-500/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Engagement</CardTitle>
              <Heart className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {stats?.total_favorites || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Total favorites</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Card className="shadow-xl border-2 border-primary/10">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-red-600" />
              Platform Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="products" className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Products
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center gap-2">
                  <Grid3x3 className="h-4 w-4" />
                  Categories
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="space-y-4">
                <AdminUsers onUpdate={fetchStats} />
              </TabsContent>

              <TabsContent value="products" className="space-y-4">
                <AdminProducts onUpdate={fetchStats} />
              </TabsContent>

              <TabsContent value="categories" className="space-y-4">
                <AdminCategories onUpdate={fetchStats} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminSession, checkIsAdmin } from '@/lib/admin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, TrendingUp, Users, Package, Heart, 
  ShoppingBag, ArrowLeft, Calendar, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number; // Users who posted/favorited in last 30 days
  totalProducts: number;
  activeProducts: number;
  soldProducts: number;
  totalFavorites: number;
  totalViews: number;
  categoryStats: { name: string; count: number }[];
  conditionStats: { condition: string; count: number }[];
  monthlyGrowth: { month: string; users: number; products: number }[];
  topSellers: { name: string; products: number }[];
}

const AdminAnalytics = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const verifyAdmin = async () => {
      // Check if hardcoded admin session exists
      if (isAdminSession()) {
        await fetchAnalytics();
        setLoading(false);
        return;
      }

      // Check if user is a database admin
      if (user) {
        const isUserAdmin = await checkIsAdmin(user.id);
        if (isUserAdmin) {
          await fetchAnalytics();
          setLoading(false);
          return;
        }
      }

      // Not authorized
      toast.error('Access denied. Please log in as admin.');
      navigate('/admin/login');
    };

    if (!authLoading) {
      verifyAdmin();
    }
  }, [user, authLoading, navigate]);

  const fetchAnalytics = async () => {
    try {
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch active users (created product or favorited in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentProducts } = await supabase
        .from('products')
        .select('seller_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { data: recentFavorites } = await supabase
        .from('favorites')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const activeUserIds = new Set([
        ...(recentProducts?.map(p => p.seller_id) || []),
        ...(recentFavorites?.map(f => f.user_id) || [])
      ]);

      // Fetch products data
      const { data: products } = await supabase
        .from('products')
        .select('*, categories(name), profiles(full_name)');

      const totalProducts = products?.length || 0;
      const activeProducts = products?.filter(p => p.status === 'available').length || 0;
      const soldProducts = products?.filter(p => p.status === 'sold').length || 0;
      const totalViews = products?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;

      // Fetch favorites count
      const { count: totalFavorites } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true });

      // Category statistics
      const categoryMap = new Map<string, number>();
      products?.forEach(p => {
        const categoryName = p.categories?.name || 'Uncategorized';
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
      });
      const categoryStats = Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Condition statistics
      const conditionMap = new Map<string, number>();
      products?.forEach(p => {
        conditionMap.set(p.condition, (conditionMap.get(p.condition) || 0) + 1);
      });
      const conditionStats = Array.from(conditionMap.entries())
        .map(([condition, count]) => ({ condition, count }))
        .sort((a, b) => b.count - a.count);

      // Monthly growth (last 6 months)
      const monthlyGrowth = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString();

        const { count: monthUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd);

        const { count: monthProducts } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd);

        monthlyGrowth.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          users: monthUsers || 0,
          products: monthProducts || 0
        });
      }

      // Top sellers
      const sellerMap = new Map<string, { name: string; count: number }>();
      products?.forEach(p => {
        const sellerId = p.seller_id;
        const sellerName = p.profiles?.full_name || 'Unknown';
        if (!sellerMap.has(sellerId)) {
          sellerMap.set(sellerId, { name: sellerName, count: 0 });
        }
        sellerMap.get(sellerId)!.count++;
      });
      const topSellers = Array.from(sellerMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(s => ({ name: s.name, products: s.count }));

      setAnalytics({
        totalUsers: totalUsers || 0,
        activeUsers: activeUserIds.size,
        totalProducts,
        activeProducts,
        soldProducts,
        totalFavorites: totalFavorites || 0,
        totalViews,
        categoryStats,
        conditionStats,
        monthlyGrowth,
        topSellers
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-xl font-semibold">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                Platform Analytics
              </h1>
              <p className="text-muted-foreground">Track trends and platform performance</p>
            </div>
          </div>
        </div>

        {analytics && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-2 border-blue-500/20 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{analytics.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.totalUsers} total users
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-500/20 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                  <Package className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{analytics.activeProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.totalProducts} total listings
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-500/20 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
                  <Heart className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{analytics.totalFavorites}</div>
                  <p className="text-xs text-muted-foreground">Favorites added</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-500/20 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-5 w-5 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{analytics.totalViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Product views</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="categories" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="categories">Popular Categories</TabsTrigger>
                <TabsTrigger value="growth">Growth Trends</TabsTrigger>
                <TabsTrigger value="sellers">Top Sellers</TabsTrigger>
                <TabsTrigger value="conditions">Product Conditions</TabsTrigger>
              </TabsList>

              {/* Popular Categories */}
              <TabsContent value="categories">
                <Card>
                  <CardHeader>
                    <CardTitle>Most Popular Categories</CardTitle>
                    <CardDescription>Categories with the most listings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.categoryStats.map((cat, index) => (
                        <div key={cat.name} className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{cat.name}</span>
                              <span className="text-sm text-muted-foreground">{cat.count} products</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${(cat.count / analytics.totalProducts) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Growth Trends */}
              <TabsContent value="growth">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Growth Trends</CardTitle>
                    <CardDescription>New users and listings over the last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {analytics.monthlyGrowth.map((month) => (
                        <div key={month.month}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {month.month}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">New Users</div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-secondary rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${Math.min((month.users / 10) * 100, 100)}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold">{month.users}</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">New Products</div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-secondary rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${Math.min((month.products / 20) * 100, 100)}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold">{month.products}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Top Sellers */}
              <TabsContent value="sellers">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Sellers</CardTitle>
                    <CardDescription>Users with the most active listings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.topSellers.map((seller, index) => (
                        <div key={seller.name} className="flex items-center gap-4">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-primary'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{seller.name}</div>
                            <div className="text-sm text-muted-foreground">{seller.products} products listed</div>
                          </div>
                          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Product Conditions */}
              <TabsContent value="conditions">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Conditions Distribution</CardTitle>
                    <CardDescription>Breakdown of listings by condition</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.conditionStats.map((stat) => (
                        <div key={stat.condition} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium capitalize">{stat.condition.replace('-', ' ')}</span>
                              <span className="text-sm text-muted-foreground">
                                {stat.count} ({((stat.count / analytics.totalProducts) * 100).toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-3">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all"
                                style={{ width: `${(stat.count / analytics.totalProducts) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;

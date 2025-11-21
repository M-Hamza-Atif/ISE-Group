import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, TrendingUp, Package, DollarSign, Calendar, BarChart3 } from 'lucide-react';

interface ProductStats {
  id: string;
  title: string;
  views: number;
  price: number;
  status: string;
  created_at: string;
  images: string[];
}

interface ViewHistory {
  date: string;
  count: number;
}

const Analytics = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewHistory, setViewHistory] = useState<ViewHistory[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchAnalytics();
    }
  }, [user, authLoading, navigate]);

  const fetchAnalytics = async () => {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('products')
      .select('id, title, views, price, status, created_at, images')
      .eq('seller_id', user.id)
      .order('views', { ascending: false });

    if (!error && data) {
      setProducts(data);
      
      // Aggregate view history by week
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      
      const viewsByDate: Record<string, number> = {};
      
      data.forEach(product => {
        const createdDate = new Date(product.created_at);
        if (createdDate > last30Days) {
          const dateKey = createdDate.toISOString().split('T')[0];
          viewsByDate[dateKey] = (viewsByDate[dateKey] || 0) + product.views;
        }
      });

      const historyArray = Object.entries(viewsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setViewHistory(historyArray);
    }

    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  const totalViews = products.reduce((sum, p) => sum + p.views, 0);
  const activeProducts = products.filter(p => p.status === 'available');
  const soldProducts = products.filter(p => p.status === 'sold');
  const totalRevenue = soldProducts.reduce((sum, p) => sum + p.price, 0);
  const averagePrice = products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0;
  const averageViews = products.length > 0 ? totalViews / products.length : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Seller Analytics</h1>
          <p className="text-muted-foreground">Track your performance and insights</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Avg: {averageViews.toFixed(1)} per listing
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Listings</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{activeProducts.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {soldProducts.length} sold
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-2">
                From {soldProducts.length} sales
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Price</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">${averagePrice.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Across all listings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* View History Chart */}
        {viewHistory.length > 0 && (
          <Card className="mb-8 glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                View History (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-2">
                {viewHistory.map((item, index) => {
                  const maxCount = Math.max(...viewHistory.map(v => v.count));
                  const height = (item.count / maxCount) * 100;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                        style={{ height: `${height}%`, minHeight: '4px' }}
                        title={`${item.date}: ${item.count} views`}
                      />
                      <span className="text-xs text-muted-foreground rotate-45 origin-top-left">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Performance */}
        <Tabs defaultValue="most-viewed" className="w-full">
          <TabsList>
            <TabsTrigger value="most-viewed">Most Viewed</TabsTrigger>
            <TabsTrigger value="least-viewed">Least Viewed</TabsTrigger>
            <TabsTrigger value="highest-priced">Highest Priced</TabsTrigger>
          </TabsList>

          <TabsContent value="most-viewed" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.slice(0, 6).map((product, index) => (
                <Card key={product.id} className="glass-card hover-lift">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {product.images?.[0] && (
                          <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold line-clamp-2">{product.title}</h3>
                          <span className="text-2xl font-bold text-primary">#{index + 1}</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {product.views} views
                          </p>
                          <p className="text-sm font-semibold">${product.price.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="least-viewed" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...products].reverse().slice(0, 6).map((product) => (
                <Card key={product.id} className="glass-card hover-lift">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {product.images?.[0] && (
                          <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold line-clamp-2 mb-2">{product.title}</h3>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {product.views} views
                          </p>
                          <p className="text-sm font-semibold">${product.price.toFixed(2)}</p>
                          <p className="text-xs text-orange-600">💡 Consider improving description or images</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="highest-priced" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...products].sort((a, b) => b.price - a.price).slice(0, 6).map((product) => (
                <Card key={product.id} className="glass-card hover-lift">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {product.images?.[0] && (
                          <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold line-clamp-2 mb-2">{product.title}</h3>
                        <div className="space-y-1">
                          <p className="text-xl font-bold text-purple-600">${product.price.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {product.views} views
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;

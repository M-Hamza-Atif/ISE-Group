import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { isAdminSession } from '@/lib/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Flag, User, Package, Check, X, Eye } from 'lucide-react';

interface Report {
  id: string;
  reportable_type: 'product' | 'user';
  reportable_id: string;
  reporter_id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  reporter: { full_name: string };
  product?: { title: string };
  reported_user?: { full_name: string };
}

const AdminModeration = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'dismissed'>('pending');

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchReports();
    }
  }, [filter, loading]);

  const checkAdmin = async () => {
    if (!isAdminSession()) {
      toast.error('Access denied. Please log in as admin.');
      navigate('/admin/login');
      return;
    }
    
    setLoading(false);
  };

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reporter_id(full_name),
        product:products(title),
        reported_user:profiles!reportable_id(full_name)
      `)
      .eq('status', filter)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReports(data as any);
    }
  };

  const handleResolve = async (reportId: string, action: 'resolved' | 'dismissed') => {
    const { error } = await supabase
      .from('reports')
      .update({ status: action, resolved_at: new Date().toISOString() })
      .eq('id', reportId);

    if (error) {
      toast.error('Failed to update report');
      return;
    }

    toast.success(`Report ${action}`);
    fetchReports();
  };

  const handleSuspendUser = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_suspended: true })
      .eq('id', userId);

    if (error) {
      toast.error('Failed to suspend user');
      return;
    }

    toast.success('User suspended');
  };

  const handleDeleteProduct = async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      toast.error('Failed to delete product');
      return;
    }

    toast.success('Product deleted');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  const getReasonBadge = (reason: string) => {
    const colors: Record<string, string> = {
      spam: 'bg-orange-500',
      inappropriate: 'bg-red-500',
      scam: 'bg-purple-500',
      harassment: 'bg-pink-500',
      prohibited: 'bg-yellow-500',
      fake: 'bg-blue-500',
      other: 'bg-gray-500',
    };
    return colors[reason] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Content Moderation</h1>
            <p className="text-muted-foreground">Review and manage user reports</p>
          </div>
          <Button onClick={() => navigate('/admin/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {reports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No {filter} reports</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {report.reportable_type === 'product' ? (
                              <Package className="h-5 w-5" />
                            ) : (
                              <User className="h-5 w-5" />
                            )}
                            <CardTitle className="text-lg">
                              {report.reportable_type === 'product' 
                                ? report.product?.title 
                                : report.reported_user?.full_name}
                            </CardTitle>
                            <Badge className={getReasonBadge(report.reason)}>
                              {report.reason}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Reported by {report.reporter.full_name} on{' '}
                            {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-1">Description:</p>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </div>

                      {filter === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (report.reportable_type === 'product') {
                                navigate(`/products/${report.reportable_id}`);
                              }
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View {report.reportable_type}
                          </Button>

                          {report.reportable_type === 'product' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteProduct(report.reportable_id)}
                            >
                              Delete Product
                            </Button>
                          )}

                          {report.reportable_type === 'user' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleSuspendUser(report.reportable_id)}
                            >
                              Suspend User
                            </Button>
                          )}

                          <Button
                            size="sm"
                            onClick={() => handleResolve(report.id, 'resolved')}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Mark Resolved
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolve(report.id, 'dismissed')}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminModeration;

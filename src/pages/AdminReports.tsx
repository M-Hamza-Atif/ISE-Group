import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { isAdminSession, checkIsAdmin } from '@/lib/admin';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Flag, User, Package, CheckCircle, XCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Report {
  id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  admin_notes: string | null;
  reporter_id: string;
  reporter: { id: string; full_name: string };
  reported_user: { full_name: string } | null;
  reported_product: { title: string } | null;
}

const AdminReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    const verifyAdmin = async () => {
      // Check if hardcoded admin session exists
      if (isAdminSession()) {
        return;
      }

      // Check if user is a database admin
      if (user) {
        const isUserAdmin = await checkIsAdmin(user.id);
        if (isUserAdmin) {
          return;
        }
      }

      // Not authorized
      toast.error('Access denied. Admin privileges required.');
      navigate('/admin/login');
    };

    verifyAdmin();
  }, [user, navigate]);

  useEffect(() => {
    // Fetch reports if user is logged in OR if hardcoded admin session exists
    if (user || isAdminSession()) {
      fetchReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab]);

  const fetchReports = async () => {
    console.log('Fetching reports, activeTab:', activeTab);
    setLoading(true);
    
    try {
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      const { data, error } = await query;

      console.log('Reports query result:', { data, error, count: data?.length });

      if (error) {
        console.error('Error fetching reports:', error);
        toast.error('Failed to load reports: ' + error.message);
        setReports([]);
        setLoading(false);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('No reports found');
        setReports([]);
        setLoading(false);
        return;
      }

      // Fetch related data separately
      const reportsWithDetails = await Promise.all(
        data.map(async (report) => {
          const [reporterData, reportedUserData, reportedProductData] = await Promise.all([
            supabase.from('profiles').select('id, full_name').eq('id', report.reporter_id).single(),
            report.reported_user_id 
              ? supabase.from('profiles').select('full_name').eq('id', report.reported_user_id).single()
              : Promise.resolve({ data: null }),
            report.reported_product_id
              ? supabase.from('products').select('title').eq('id', report.reported_product_id).single()
              : Promise.resolve({ data: null })
          ]);

          return {
            ...report,
            reporter: reporterData.data || { id: report.reporter_id, full_name: 'Unknown' },
            reported_user: reportedUserData.data,
            reported_product: reportedProductData.data
          };
        })
      );

      console.log('Reports with details:', reportsWithDetails.length);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setReports(reportsWithDetails as any);
    } catch (err) {
      console.error('Exception fetching reports:', err);
      toast.error('An error occurred while loading reports');
      setReports([]);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    // Allow hardcoded admin or authenticated user
    if (!user && !isAdminSession()) return;

    // First get the report to know who to notify
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    console.log('Updating report:', { reportId, status, adminNotes });

    const { data, error } = await supabase
      .from('reports')
      .update({
        status,
        admin_notes: adminNotes || null,
        resolved_at: status !== 'pending' ? new Date().toISOString() : null,
        resolved_by: user?.id || null,
      })
      .eq('id', reportId)
      .select();

    console.log('Update result:', { data, error });

    if (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report: ' + error.message);
      return;
    }

    // Create notification for the reporter
    const notificationMessage = status === 'resolved' 
      ? 'Your report has been resolved by the admin team.'
      : status === 'reviewed'
      ? 'Your report has been reviewed by the admin team.'
      : status === 'dismissed'
      ? 'Your report has been dismissed.'
      : 'Your report status has been updated.';

    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: report.reporter_id,
        type: 'system',
        title: `Report ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: notificationMessage,
      });

    if (notifError) {
      console.error('Error creating notification:', notifError);
    }

    toast.success(`Report marked as ${status}`);
    setSelectedReport(null);
    setAdminNotes('');
    
    // Wait a bit then refresh to ensure database has updated
    setTimeout(() => {
      fetchReports();
    }, 500);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-600',
      reviewed: 'bg-blue-600',
      resolved: 'bg-green-600',
      dismissed: 'bg-gray-600',
    };
    return <Badge className={colors[status as keyof typeof colors] || 'bg-gray-600'}>{status}</Badge>;
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Reports Management</h1>
              <p className="text-muted-foreground">Review and manage user reports</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
              ← Back to Dashboard
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5 mb-8">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="glass-card">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {report.reported_product ? (
                                <Package className="h-4 w-4 text-primary" />
                              ) : (
                                <User className="h-4 w-4 text-primary" />
                              )}
                              <CardTitle className="text-lg">
                                {report.reported_product ? 'Product Report' : 'User Report'}
                              </CardTitle>
                              {getStatusBadge(report.status)}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p><strong>Reporter:</strong> {report.reporter.full_name}</p>
                              <p><strong>Target:</strong> {report.reported_product?.title || report.reported_user?.full_name}</p>
                              <p><strong>Reason:</strong> {report.reason}</p>
                              <p><strong>Date:</strong> {new Date(report.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium mb-1">Description:</p>
                            <p className="text-sm text-muted-foreground">{report.description}</p>
                          </div>
                          
                          {report.admin_notes && (
                            <div>
                              <p className="text-sm font-medium mb-1">Admin Notes:</p>
                              <p className="text-sm text-muted-foreground">{report.admin_notes}</p>
                            </div>
                          )}

                          {selectedReport?.id === report.id ? (
                            <div className="space-y-3 pt-3 border-t">
                              <Textarea
                                placeholder="Add admin notes (optional)"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="min-h-[80px]"
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => updateReportStatus(report.id, 'reviewed')}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Mark Reviewed
                                </Button>
                                <Button
                                  onClick={() => updateReportStatus(report.id, 'resolved')}
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Resolve
                                </Button>
                                <Button
                                  onClick={() => updateReportStatus(report.id, 'dismissed')}
                                  variant="outline"
                                  size="sm"
                                  className="text-gray-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Dismiss
                                </Button>
                                <Button
                                  onClick={() => {
                                    setSelectedReport(null);
                                    setAdminNotes('');
                                  }}
                                  variant="ghost"
                                  size="sm"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            report.status === 'pending' && (
                              <Button
                                onClick={() => {
                                  setSelectedReport(report);
                                  setAdminNotes(report.admin_notes || '');
                                }}
                                variant="outline"
                                size="sm"
                              >
                                <Flag className="mr-2 h-4 w-4" />
                                Take Action
                              </Button>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Flag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-xl font-semibold mb-2">No {activeTab} reports</p>
                  <p className="text-muted-foreground">There are no reports in this category</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AdminReports;

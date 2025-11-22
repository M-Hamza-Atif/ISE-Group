import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { isAdminSession } from '@/lib/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { AlertCircle, Check, X, Eye } from 'lucide-react';

interface Appeal {
  id: string;
  user_id: string;
  reason: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_response: string | null;
  created_at: string;
  resolved_at: string | null;
  profiles: { full_name: string; email: string };
}

const AdminAppeals = () => {
  const navigate = useNavigate();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchAppeals();
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

  const fetchAppeals = async () => {
    const { data, error } = await supabase
      .from('appeals')
      .select(`
        *,
        profiles!user_id(full_name, email)
      `)
      .eq('status', filter)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAppeals(data as any);
    }
  };

  const handleDecision = async (appealId: string, decision: 'approved' | 'rejected') => {
    if (!adminResponse.trim()) {
      toast.error('Please provide a response');
      return;
    }

    setProcessing(true);

    const { error } = await supabase
      .from('appeals')
      .update({
        status: decision,
        admin_response: adminResponse.trim(),
        resolved_at: new Date().toISOString(),
      })
      .eq('id', appealId);

    if (error) {
      toast.error('Failed to process appeal');
      setProcessing(false);
      return;
    }

    // If approved, unsuspend the user
    if (decision === 'approved' && selectedAppeal) {
      await supabase
        .from('profiles')
        .update({
          is_suspended: false,
          suspension_reason: null,
          suspended_until: null,
        })
        .eq('id', selectedAppeal.user_id);
    }

    toast.success(`Appeal ${decision}`);
    setSelectedAppeal(null);
    setAdminResponse('');
    setProcessing(false);
    fetchAppeals();
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-xl font-semibold">Loading appeals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Appeals Management</h1>
              <p className="text-white/80">Review and manage user appeals</p>
            </div>
            <Button onClick={() => navigate('/admin/dashboard')} variant="outline" className="text-white border-white hover:bg-white/10">
              ← Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'pending' | 'approved' | 'rejected')} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="pending">
              Pending ({appeals.filter(a => a.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {appeals.length > 0 ? (
              <div className="grid gap-4">
                {appeals.map((appeal) => (
                  <Card key={appeal.id} className="glass-card">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{appeal.profiles.full_name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{appeal.profiles.email}</p>
                        </div>
                        <Badge
                          variant={
                            appeal.status === 'approved'
                              ? 'default'
                              : appeal.status === 'rejected'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {appeal.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Reason</p>
                          <p className="text-sm">{appeal.reason}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Description</p>
                          <p className="text-sm">{appeal.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Submitted: {new Date(appeal.created_at).toLocaleString()}</span>
                          {appeal.resolved_at && (
                            <span>• Resolved: {new Date(appeal.resolved_at).toLocaleString()}</span>
                          )}
                        </div>

                        {appeal.admin_response && (
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Admin Response</p>
                            <p className="text-sm">{appeal.admin_response}</p>
                          </div>
                        )}

                        {appeal.status === 'pending' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => setSelectedAppeal(appeal)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Review Appeal
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Review Appeal</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="response">Admin Response</Label>
                                  <Textarea
                                    id="response"
                                    placeholder="Explain your decision..."
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                    rows={4}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleDecision(appeal.id, 'approved')}
                                    disabled={processing}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    Approve & Unsuspend
                                  </Button>
                                  <Button
                                    onClick={() => handleDecision(appeal.id, 'rejected')}
                                    disabled={processing}
                                    variant="destructive"
                                    className="flex-1"
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-xl font-semibold mb-2">No {filter} appeals</p>
                <p className="text-muted-foreground">Appeals will appear here when users submit them</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminAppeals;

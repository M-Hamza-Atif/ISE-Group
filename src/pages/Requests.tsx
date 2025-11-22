import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Search, DollarSign, Calendar, MessageSquare, Inbox } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Category {
  id: string;
  name: string;
}

interface RequestPost {
  id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  created_at: string;
  categories: Category | null;
  profiles: { full_name: string } | null;
}

interface RequestResponse {
  id: string;
  message: string;
  created_at: string;
  responder: { full_name: string };
}

interface MyRequest extends RequestPost {
  responses?: RequestResponse[];
}

const Requests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RequestPost[]>([]);
  const [myRequests, setMyRequests] = useState<MyRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestPost | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget_min: '',
    budget_max: '',
    category_id: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchRequests();
    if (user) {
      fetchMyRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    if (data) setCategories(data);
  };

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('request_posts')
      .select(`
        *,
        categories(id, name),
        profiles(full_name)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  };

  const fetchMyRequests = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('request_posts')
      .select(`
        *,
        categories(id, name),
        profiles(full_name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch responses for each request
      const requestsWithResponses = await Promise.all(
        data.map(async (req) => {
          const { data: responses } = await supabase
            .from('request_responses')
            .select(`
              *,
              responder:profiles!responder_id(full_name)
            `)
            .eq('request_id', req.id)
            .order('created_at', { ascending: false });
          
          return { ...req, responses: responses || [] };
        })
      );
      setMyRequests(requestsWithResponses as MyRequest[]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to create a request');
      navigate('/auth');
      return;
    }

    try {
      const { error } = await supabase
        .from('request_posts')
        .insert([{
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
          budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
          category_id: formData.category_id || null,
        }]);

      if (error) throw error;

      toast.success('Request posted successfully!');
      setDialogOpen(false);
      setFormData({ title: '', description: '', budget_min: '', budget_max: '', category_id: '' });
      fetchRequests();
      if (user) fetchMyRequests();
      setActiveTab('my-requests');
    } catch (error: any) {
      toast.error(error.message || 'Failed to post request');
    }
  };

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedRequest) {
      toast.error('Please sign in to respond');
      return;
    }

    try {
      const { error } = await supabase
        .from('request_responses')
        .insert([{
          request_id: selectedRequest.id,
          responder_id: user.id,
          message: responseMessage,
        }]);

      if (error) throw error;

      toast.success('Response sent successfully!');
      setResponseDialogOpen(false);
      setResponseMessage('');
      setSelectedRequest(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send response');
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Item Requests</h1>
            <p className="text-muted-foreground">
              Looking for something specific? Post a request and let sellers come to you!
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Post Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Post an Item Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">What are you looking for? *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Calculus Textbook 3rd Edition"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide details about what you're looking for..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget_min">Min Budget ($)</Label>
                    <Input
                      id="budget_min"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.budget_min}
                      onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget_max">Max Budget ($)</Label>
                    <Input
                      id="budget_max"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.budget_max}
                      onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Post Request</Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="all">
              <Search className="mr-2 h-4 w-4" />
              Browse Requests
            </TabsTrigger>
            <TabsTrigger value="my-requests">
              <Inbox className="mr-2 h-4 w-4" />
              My Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-muted/50 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : requests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((request) => (
              <Card key={request.id} className="glass-card hover-lift">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{request.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        by {request.profiles?.full_name}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-600">Open</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {request.description}
                  </p>
                  
                  <div className="space-y-2">
                    {(request.budget_min || request.budget_max) && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span>
                          Budget: ${request.budget_min || 0} - ${request.budget_max || '∞'}
                        </span>
                      </div>
                    )}
                    {request.categories && (
                      <Badge variant="outline">{request.categories.name}</Badge>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <Calendar className="h-3 w-3" />
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {user && (
                    <Dialog open={responseDialogOpen && selectedRequest?.id === request.id} onOpenChange={(open) => {
                      setResponseDialogOpen(open);
                      if (!open) {
                        setSelectedRequest(null);
                        setResponseMessage('');
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full mt-4" 
                          variant="outline"
                          onClick={() => setSelectedRequest(request)}
                        >
                          Respond to Request
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Respond to: {request.title}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleRespond} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="response">Your Response *</Label>
                            <Textarea
                              id="response"
                              placeholder="Describe what you can offer..."
                              value={responseMessage}
                              onChange={(e) => setResponseMessage(e.target.value)}
                              rows={4}
                              required
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" className="flex-1">Send Response</Button>
                            <Button type="button" variant="outline" onClick={() => setResponseDialogOpen(false)}>
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-xl font-semibold mb-2">No active requests</p>
            <p className="text-muted-foreground mb-4">Be the first to post what you're looking for!</p>
            <Button onClick={() => setDialogOpen(true)} className="gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Post a Request
            </Button>
          </div>
        )}
          </TabsContent>

          <TabsContent value="my-requests">
            {!user ? (
              <div className="text-center py-20">
                <p className="text-xl font-semibold mb-2">Sign in to view your requests</p>
                <Button onClick={() => navigate('/auth')} className="gradient-primary">
                  Sign In
                </Button>
              </div>
            ) : myRequests.length > 0 ? (
              <div className="space-y-6">
                {myRequests.map((request) => (
                  <Card key={request.id} className="glass-card">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{request.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Posted {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge 
                          variant={request.status === 'open' ? 'default' : 'secondary'}
                          className={request.status === 'open' ? 'bg-green-600' : ''}
                        >
                          {request.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{request.description}</p>
                      
                      {(request.budget_min || request.budget_max) && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <span>
                            Budget: ${request.budget_min || 0} - ${request.budget_max || '∞'}
                          </span>
                        </div>
                      )}

                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">
                            Responses ({request.responses?.length || 0})
                          </h4>
                        </div>
                        
                        {request.responses && request.responses.length > 0 ? (
                          <div className="space-y-3">
                            {request.responses.map((response) => (
                              <div key={response.id} className="bg-muted/50 rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <p className="font-medium text-sm">
                                    {response.responder?.full_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(response.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <p className="text-sm">{response.message}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No responses yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Inbox className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-xl font-semibold mb-2">No requests yet</p>
                <p className="text-muted-foreground mb-4">Create your first request!</p>
                <Button onClick={() => setDialogOpen(true)} className="gradient-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Post a Request
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Requests;

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { isAdminSession } from '@/lib/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Megaphone, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_active: boolean;
  created_at: string;
}

const AdminAnnouncements = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    if (!isAdminSession()) {
      toast.error('Access denied. Please log in as admin.');
      navigate('/admin/login');
      return;
    }

    setLoading(false);
    fetchAnnouncements();
  };

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAnnouncements(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        title: formData.title,
        content: formData.content,
        type: formData.type,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create announcement');
      return;
    }

    // Create notifications for all users
    const { data: users } = await supabase
      .from('profiles')
      .select('id');

    if (users && users.length > 0) {
      const notifications = users.map(user => ({
        user_id: user.id,
        title: formData.title,
        message: formData.content,
        type: 'announcement',
        link: null,
        is_read: false,
      }));

      await supabase.from('notifications').insert(notifications);
    }

    toast.success('Announcement created and notifications sent');
    setFormData({ title: '', content: '', type: 'info' });
    setShowForm(false);
    fetchAnnouncements();
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('announcements')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update announcement');
      return;
    }

    toast.success(isActive ? 'Announcement hidden' : 'Announcement shown');
    fetchAnnouncements();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete announcement');
      return;
    }

    toast.success('Announcement deleted');
    fetchAnnouncements();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Megaphone className="h-8 w-8 text-primary" />
              Announcements
            </h1>
            <p className="text-muted-foreground">Manage platform-wide announcements</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="mr-2 h-4 w-4" />
              New Announcement
            </Button>
            <Button onClick={() => navigate('/admin/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create Announcement</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Important update about..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    placeholder="Announcement details..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: typeof formData.type) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info (Blue)</SelectItem>
                      <SelectItem value="warning">Warning (Yellow)</SelectItem>
                      <SelectItem value="success">Success (Green)</SelectItem>
                      <SelectItem value="error">Error (Red)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Create Announcement</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {announcements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No announcements yet</p>
              </CardContent>
            </Card>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id} className={!announcement.is_active ? 'opacity-50' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{announcement.title}</h3>
                        <Badge className={getTypeBadgeColor(announcement.type)}>
                          {announcement.type}
                        </Badge>
                        {!announcement.is_active && (
                          <Badge variant="outline">Hidden</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{announcement.content}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(announcement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
                      >
                        {announcement.is_active ? (
                          <><EyeOff className="mr-2 h-4 w-4" /> Hide</>
                        ) : (
                          <><Eye className="mr-2 h-4 w-4" /> Show</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnnouncements;

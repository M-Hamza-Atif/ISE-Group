import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Megaphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAnnouncements();

    // Load dismissed announcements from localStorage
    const savedDismissed = localStorage.getItem('dismissedAnnouncements');
    if (savedDismissed) {
      setDismissed(new Set(JSON.parse(savedDismissed)));
    }
  }, []);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!error && data) {
      setAnnouncements(data);
    }
  };

  const handleDismiss = (id: string) => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(id);
    setDismissed(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(Array.from(newDismissed)));
  };

  const visibleAnnouncements = announcements.filter(a => !dismissed.has(a.id));

  if (visibleAnnouncements.length === 0) return null;

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'error': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-4">
      {visibleAnnouncements.map((announcement) => (
        <Alert key={announcement.id} variant={getAlertVariant(announcement.type)} className="relative pr-14">
          <Megaphone className="h-4 w-4" />
          <AlertTitle>{announcement.title}</AlertTitle>
          <AlertDescription>{announcement.content}</AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-3 right-2 h-8 w-8 p-0 hover:bg-background/80 rounded-full border border-border flex items-center justify-center"
            onClick={() => handleDismiss(announcement.id)}
          >
            <X className="h-4 w-4 text-foreground" />
          </Button>
        </Alert>
      ))}
    </div>
  );
};

export default AnnouncementBanner;

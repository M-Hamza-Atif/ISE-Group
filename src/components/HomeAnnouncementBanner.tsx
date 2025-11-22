import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Megaphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

const HomeAnnouncementBanner = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);

  const getDismissedKey = () => {
    return user ? `dismissedAnnouncements_${user.id}` : 'dismissedAnnouncements_guest';
  };

  useEffect(() => {
    // Load dismissed announcements from localStorage FIRST
    const savedDismissed = localStorage.getItem(getDismissedKey());
    if (savedDismissed) {
      setDismissed(new Set(JSON.parse(savedDismissed)));
    }

    fetchAnnouncements();
    
    const subscription = supabase
      .channel('announcements_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    const visibleAnnouncements = announcements.filter(a => !dismissed.has(a.id));
    if (visibleAnnouncements.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % visibleAnnouncements.length);
      }, 5000); // Rotate every 5 seconds

      return () => clearInterval(interval);
    }
  }, [announcements, dismissed]);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setAnnouncements(data as Announcement[]);
    }
  };

  const handleDismiss = (id: string) => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(id);
    setDismissed(newDismissed);
    localStorage.setItem(getDismissedKey(), JSON.stringify(Array.from(newDismissed)));
    setCurrentIndex(0);
  };

  const handleClearDismissed = () => {
    setDismissed(new Set());
    localStorage.removeItem(getDismissedKey());
  };

  const visibleAnnouncements = announcements.filter(a => !dismissed.has(a.id));

  // Always show something for debugging
  if (announcements.length === 0) {
    return (
      <div className="mb-8">
        <div className="bg-muted/50 border border-border rounded-xl p-4 text-sm text-muted-foreground">
          No announcements found in database. Create one from admin panel.
        </div>
      </div>
    );
  }

  if (visibleAnnouncements.length === 0) {
    // Show a small button to restore dismissed announcements
    return (
      <div className="mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearDismissed}
          className="text-xs"
        >
          Show dismissed announcements ({announcements.length})
        </Button>
      </div>
    );
  }

  const currentAnnouncement = visibleAnnouncements[currentIndex];

  const getGradient = (type: string) => {
    switch (type) {
      case 'error': 
        return 'from-red-500/20 to-red-600/20 border-red-500/50';
      case 'warning': 
        return 'from-yellow-500/20 to-orange-600/20 border-yellow-500/50';
      case 'success': 
        return 'from-green-500/20 to-emerald-600/20 border-green-500/50';
      default: 
        return 'from-blue-500/20 to-purple-600/20 border-blue-500/50';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'success': return 'text-green-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <div className="mb-8">
      <div className={`relative overflow-hidden rounded-2xl border-2 bg-gradient-to-r ${getGradient(currentAnnouncement.type)} backdrop-blur-sm p-6 shadow-lg transition-all duration-500`}>
        <div className="absolute inset-0 bg-grid-white/5 pointer-events-none" />
        
        <div className="relative flex items-start gap-4">
          <div className={`flex-shrink-0 ${getIconColor(currentAnnouncement.type)}`}>
            <Megaphone className="h-6 w-6 animate-pulse" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold mb-1 text-foreground">
              {currentAnnouncement.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentAnnouncement.content}
            </p>
            
            {visibleAnnouncements.length > 1 && (
              <div className="flex gap-1.5 mt-3">
                {visibleAnnouncements.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentIndex ? 'w-6 bg-primary' : 'w-1.5 bg-primary/30 hover:bg-primary/50'
                    }`}
                    aria-label={`Go to announcement ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-8 w-8 p-0 hover:bg-background/60 rounded-full border border-border/50 flex items-center justify-center"
            onClick={() => handleDismiss(currentAnnouncement.id)}
          >
            <X className="h-4 w-4 text-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomeAnnouncementBanner;

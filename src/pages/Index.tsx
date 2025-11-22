import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Products from './Products';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checkingBan, setCheckingBan] = useState(true);

  useEffect(() => {
    const checkBanStatus = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_banned')
          .eq('id', user.id)
          .single();
        
        if (data?.is_banned) {
          // Sign out the banned user
          await supabase.auth.signOut();
          toast.error('Your account has been banned. Please contact support.');
          navigate('/auth');
          return;
        }
      }
      setCheckingBan(false);
    };

    if (!loading) {
      checkBanStatus();
    }
  }, [user, loading, navigate]);

  if (loading || checkingBan) {
    return (
      <div className="flex min-h-screen items-center justify-center gradient-bg relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="text-center animate-scale-in relative z-10">
          <div className="w-20 h-20 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-6 shadow-lg" />
          <p className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent animate-shimmer mb-2">
            Loading your marketplace...
          </p>
          <p className="text-sm text-muted-foreground mt-2 animate-pulse">Finding the best deals ✨</p>
        </div>
      </div>
    );
  }

  return <Products />;
};

export default Index;

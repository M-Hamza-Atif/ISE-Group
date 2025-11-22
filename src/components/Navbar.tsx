import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShoppingBag, Plus, User, LogOut, Heart, Package, Shield, Moon, Sun, Search, DollarSign, BarChart3, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { signOut } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import NotificationsDropdown from '@/components/NotificationsDropdown';

const Navbar = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      subscribeToMessages();
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    
    // Get all messages where user is receiver and hasn't read yet
    // For simplicity, count all messages where user is receiver
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id);
    
    setUnreadCount(count || 0);
  };

  const subscribeToMessages = () => {
    if (!user) return;

    const channel = supabase
      .channel('navbar-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <nav className="border-b glass-card sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 font-bold text-xl group">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all animate-pulse-glow">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent animate-shimmer">
            FAST BAZAAR
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleTheme}
            className="rounded-full hover:scale-110 transition-transform glass shadow-md"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {user ? (
            <>
              <NotificationsDropdown />
              
              <Button asChild className="gradient-primary shadow-md hover:shadow-xl transition-all shine hover-lift">
                <Link to="/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Sell Item
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full hover:scale-110 transition-transform glass shadow-md">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-card border-2">
                  <DropdownMenuItem asChild>
                    <Link to="/my-products" className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      My Listings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/favorites" className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      Favorites
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/requests" className="cursor-pointer">
                      <Search className="mr-2 h-4 w-4" />
                      Item Requests
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/messages" className="cursor-pointer">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Messages
                      {unreadCount > 0 && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/transactions" className="cursor-pointer">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Transactions
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/analytics" className="cursor-pointer">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analytics
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/admin/login" className="cursor-pointer text-orange-600">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Portal
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/admin/login" className="text-orange-600">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin
                </Link>
              </Button>
              <Button asChild className="gradient-primary shadow-md hover:shadow-lg transition-shadow">
                <Link to="/auth">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

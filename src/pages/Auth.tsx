import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { signUp, signIn } from '@/lib/supabase';
import { ShoppingBag } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      toast.error('Password must contain at least 1 capital letter');
      return false;
    }
    if (!/[0-9]/.test(password)) {
      toast.error('Password must contain at least 1 number');
      return false;
    }
    return true;
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    // Validate password
    if (!validatePassword(password)) {
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, fullName);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signIn(email, password);
      toast.success('Signed in successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary text-primary-foreground mb-4 shadow-2xl animate-float">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent animate-float">
            FAST BAZAAR
          </h1>
          <p className="text-muted-foreground text-lg">Buy, Sell & Exchange with Students</p>
        </div>

        <Card className="shadow-2xl border-2 backdrop-blur-sm bg-card/95">
          <CardHeader>
            <CardTitle className="text-2xl">
              {activeTab === 'signin' ? 'Welcome Back!' : 'Join FAST BAZAAR'}
            </CardTitle>
            <CardDescription>
              {activeTab === 'signin' 
                ? 'Sign in to your account to continue' 
                : 'Create a new account to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 p-1">
                <TabsTrigger value="signin" className="data-[state=active]:gradient-primary data-[state=active]:text-white">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:gradient-primary data-[state=active]:text-white">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="you@university.edu"
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="h-11"
                    />
                  </div>
                  <Button type="submit" className="w-full gradient-primary h-11 text-base shadow-lg hover:shadow-xl transition-shadow" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      placeholder="John Doe"
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="you@university.edu"
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      Min 8 characters, 1 capital letter, 1 number
                    </p>
                  </div>
                  <Button type="submit" className="w-full gradient-primary h-11 text-base shadow-lg hover:shadow-xl transition-shadow" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          🔒 Secure authentication • 🎓 Student-only marketplace
        </p>
      </div>
    </div>
  );
};

export default Auth;

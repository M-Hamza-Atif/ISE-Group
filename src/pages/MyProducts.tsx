import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Product {
  id: string;
  title: string;
  price: number;
  condition: string;
  images: string[];
  transaction_type: string;
  views: number;
  status: string;
  categories: { name: string } | null;
}

const MyProducts = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchMyProducts();
    }
  }, [user, authLoading]);

  const fetchMyProducts = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(name)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const handleStatusChange = async (productId: string, newStatus: 'available' | 'sold') => {
    const { error } = await supabase
      .from('products')
      .update({ status: newStatus })
      .eq('id', productId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Listing marked as ${newStatus}`);
      fetchMyProducts();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast.error('Failed to delete listing');
    } else {
      toast.success('Listing deleted successfully');
      fetchMyProducts();
    }
    setDeleteId(null);
  };

  const activeProducts = products.filter(p => p.status === 'available');
  const soldProducts = products.filter(p => p.status === 'sold');

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Listings</h1>
            <p className="text-muted-foreground">Manage your product listings</p>
          </div>
          <Button onClick={() => navigate('/products/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Listing
          </Button>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">Active ({activeProducts.length})</TabsTrigger>
            <TabsTrigger value="sold">Sold ({soldProducts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {activeProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden glass-card hover-lift">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {product.images?.[0] && (
                        <img src={product.images[0]} alt={product.title} className="object-cover w-full h-full" />
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-success text-success-foreground">Active</Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.title}</h3>
                      <p className="text-2xl font-bold text-primary mb-3">${product.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Eye className="h-4 w-4" />
                        <span>{product.views} views</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => navigate(`/products/${product.id}`)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => navigate(`/products/${product.id}/edit`)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleStatusChange(product.id, 'sold')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Sold
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => setDeleteId(product.id)}
                          className="flex-1"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground mb-4">No active listings</p>
                <Button onClick={() => navigate('/products/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Listing
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sold" className="mt-6">
            {soldProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {soldProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden glass-card opacity-75">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {product.images?.[0] && (
                        <img src={product.images[0]} alt={product.title} className="object-cover w-full h-full grayscale" />
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary">Sold</Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.title}</h3>
                      <p className="text-2xl font-bold text-muted-foreground mb-3">${product.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Eye className="h-4 w-4" />
                        <span>{product.views} views</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => navigate(`/products/${product.id}`)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleStatusChange(product.id, 'available')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Mark Active
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => setDeleteId(product.id)}
                          className="flex-1"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground">No sold listings</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your listing.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default MyProducts;

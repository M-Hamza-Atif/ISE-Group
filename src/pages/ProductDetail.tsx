import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Heart, Eye, MapPin, Phone, Mail, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  images: string[];
  transaction_type: string;
  views: number;
  status: string;
  seller_id: string;
  created_at: string;
  categories: { name: string } | null;
  profiles: { full_name: string; phone: string | null; location: string | null } | null;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
      incrementViews();
      checkFavorite();
    }
  }, [id, user]);

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(name),
        profiles(full_name, phone, location)
      `)
      .eq('id', id)
      .single();

    if (error) {
      toast.error('Failed to load product');
      navigate('/');
    } else {
      setProduct(data);
    }
    setLoading(false);
  };

  const incrementViews = async () => {
    if (!id) return;
    await supabase.rpc('increment_views', { product_id: id });
  };

  const checkFavorite = async () => {
    if (!user || !id) return;
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .match({ user_id: user.id, product_id: id })
      .single();
    setIsFavorite(!!data);
  };

  const handleFavorite = async () => {
    if (!user) {
      toast.error('Please sign in to add favorites');
      return;
    }

    try {
      if (isFavorite) {
        await supabase.from('favorites').delete().match({ user_id: user.id, product_id: id });
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, product_id: id });
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success('Product deleted successfully');
      navigate('/my-products');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const isOwner = user && product && user.id === product.seller_id;

  const conditionColors: Record<string, string> = {
    new: 'bg-success text-success-foreground',
    'like-new': 'bg-primary text-primary-foreground',
    good: 'bg-accent text-accent-foreground',
    fair: 'bg-warning text-warning-foreground',
    poor: 'bg-muted text-muted-foreground',
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-[600px] bg-muted/50 animate-pulse rounded-xl" />
            <div className="space-y-4">
              <div className="h-12 bg-muted/50 animate-pulse rounded-lg w-3/4" />
              <div className="h-8 bg-muted/50 animate-pulse rounded-lg w-1/2" />
              <div className="h-32 bg-muted/50 animate-pulse rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6 hover:bg-primary/10" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-xl overflow-hidden bg-muted/50 shadow-2xl border-2 border-primary/10">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                  <div className="text-center">
                    <Eye className="h-20 w-20 mx-auto mb-4 opacity-20" />
                    <p>No Image Available</p>
                  </div>
                </div>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      selectedImage === idx ? 'border-primary shadow-lg' : 'border-transparent hover:border-primary/50'
                    }`}
                  >
                    <img src={img} alt={`${product.title} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {product.title}
                </h1>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleFavorite}
                  disabled={!user}
                  className="rounded-full hover:scale-110 transition-transform"
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                </Button>
              </div>

              <p className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-6">
                ${product.price.toFixed(2)}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <Badge className={`${conditionColors[product.condition]} shadow-md text-base px-3 py-1`}>
                  {product.condition.charAt(0).toUpperCase() + product.condition.slice(1).replace('-', ' ')}
                </Badge>
                {product.categories && (
                  <Badge variant="outline" className="text-base px-3 py-1 shadow-sm">{product.categories.name}</Badge>
                )}
                <Badge variant="outline" className="text-base px-3 py-1 shadow-sm">
                  {product.transaction_type === 'both' 
                    ? 'Sell/Exchange' 
                    : product.transaction_type.charAt(0).toUpperCase() + product.transaction_type.slice(1)}
                </Badge>
                <Badge variant="secondary" className="gap-1.5 text-base px-3 py-1 shadow-sm">
                  <Eye className="h-4 w-4" />
                  {product.views} views
                </Badge>
              </div>

              <Separator className="my-6" />

              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border">
                <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary rounded-full" />
                  Description
                </h2>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{product.description}</p>
              </div>
            </div>

            <Separator />

            {/* Seller Info */}
            <Card className="shadow-xl border-2 border-primary/10 bg-card/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary rounded-full" />
                  Seller Information
                </h3>
                
                <div className="flex items-center gap-4 mb-4 bg-muted/30 p-3 rounded-lg">
                  <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarFallback className="gradient-primary text-white text-lg">
                      {product.profiles?.full_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">{product.profiles?.full_name}</p>
                    <p className="text-sm text-muted-foreground">Member since {new Date(product.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>

                {product.profiles?.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 bg-muted/20 p-2 rounded">
                    <MapPin className="h-4 w-4 text-primary" />
                    {product.profiles.location}
                  </div>
                )}

                {product.profiles?.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/20 p-2 rounded">
                    <Phone className="h-4 w-4 text-primary" />
                    {product.profiles.phone}
                  </div>
                )}

                {isOwner ? (
                  <div className="mt-6 space-y-2">
                    <Button asChild className="w-full gradient-primary shadow-lg hover:shadow-xl transition-shadow h-11">
                      <Link to={`/products/${id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Listing
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full h-11 shadow-md">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Listing
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your product listing.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : (
                  <Button className="w-full mt-6 gradient-primary shadow-lg hover:shadow-xl transition-shadow h-11" disabled={!user}>
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Seller
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

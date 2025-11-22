import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Heart, Eye, MapPin, Phone, Mail, Trash2, Edit, MessageCircle, Instagram, Facebook, Star, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import ReviewDialog from '@/components/ReviewDialog';
import ReviewsList from '@/components/ReviewsList';
import ReportDialog from '@/components/ReportDialog';
import MessagingDrawer from '@/components/MessagingDrawer';
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
  is_negotiable: boolean | null;
  stock_amount: number | null;
  categories: { name: string } | null;
  profiles: { 
    full_name: string; 
    phone: string | null; 
    location: string | null;
    whatsapp: string | null;
    instagram: string | null;
    facebook: string | null;
    department: string | null;
    bio: string | null;
    is_verified: boolean | null;
  } | null;
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
        profiles(full_name, phone, location, whatsapp, instagram, facebook, department, bio, is_verified)
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

              <div className="mb-6">
                <p className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  ${product.price.toFixed(2)}
                </p>
                {product.is_negotiable && (
                  <p className="text-sm text-green-600 font-medium mt-2 flex items-center gap-1">
                    💰 Price is negotiable - Open to offers
                  </p>
                )}
                {product.stock_amount && product.stock_amount > 1 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Stock: {product.stock_amount} available
                  </p>
                )}
              </div>

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
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg">{product.profiles?.full_name}</p>
                      {product.profiles?.is_verified && (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Member since {new Date(product.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                    {product.profiles?.department && (
                      <p className="text-sm text-muted-foreground">📚 {product.profiles.department}</p>
                    )}
                  </div>
                </div>

                {product.profiles?.bio && (
                  <div className="mb-4 p-3 bg-muted/20 rounded-lg">
                    <p className="text-sm italic text-muted-foreground">"{product.profiles.bio}"</p>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {product.profiles?.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/20 p-2 rounded">
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
                </div>

                {(product.profiles?.whatsapp || product.profiles?.instagram || product.profiles?.facebook) && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Connect with seller:</p>
                    <div className="flex gap-2">
                      {product.profiles?.whatsapp && (
                        <a 
                          href={`https://wa.me/${product.profiles.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </a>
                      )}
                      {product.profiles?.instagram && (
                        <a 
                          href={`https://instagram.com/${product.profiles.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition text-sm"
                        >
                          <Instagram className="h-4 w-4" />
                          Instagram
                        </a>
                      )}
                      {product.profiles?.facebook && (
                        <a 
                          href={product.profiles.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          <Facebook className="h-4 w-4" />
                          Facebook
                        </a>
                      )}
                    </div>
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
                  <div className="mt-6 space-y-2">
                    {user && product && (
                      <MessagingDrawer
                        productId={product.id}
                        productTitle={product.title}
                        sellerId={product.seller_id}
                        sellerName={product.profiles?.full_name || 'Seller'}
                      />
                    )}
                    {user && product && (
                      <ReportDialog
                        reportableType="product"
                        reportableId={product.id}
                        reportedName={product.title}
                        userId={user.id}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Reviews Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-400" />
                Seller Reviews
              </h2>
              {user && !isOwner && product && (
                <ReviewDialog 
                  sellerId={product.seller_id}
                  sellerName={product.profiles?.full_name || 'this seller'}
                  userId={user.id}
                />
              )}
            </div>
            {product && <ReviewsList sellerId={product.seller_id} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

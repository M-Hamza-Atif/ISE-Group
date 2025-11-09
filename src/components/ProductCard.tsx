import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  condition: string;
  images: string[];
  category?: string;
  transactionType: string;
  views: number;
  isFavorite?: boolean;
  onFavoriteChange?: () => void;
}

const ProductCard = ({
  id,
  title,
  price,
  condition,
  images,
  category,
  transactionType,
  views,
  isFavorite = false,
  onFavoriteChange,
}: ProductCardProps) => {
  const { user } = useAuth();
  const [favorite, setFavorite] = useState(isFavorite);
  const [loading, setLoading] = useState(false);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to add favorites');
      return;
    }

    setLoading(true);
    try {
      if (favorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .match({ user_id: user.id, product_id: id });
        
        if (error) throw error;
        setFavorite(false);
        toast.success('Removed from favorites');
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: id });
        
        if (error) throw error;
        setFavorite(true);
        toast.success('Added to favorites');
      }
      onFavoriteChange?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update favorites');
    } finally {
      setLoading(false);
    }
  };

  const conditionColors: Record<string, string> = {
    new: 'bg-success text-success-foreground',
    'like-new': 'bg-primary text-primary-foreground',
    good: 'bg-accent text-accent-foreground',
    fair: 'bg-warning text-warning-foreground',
    poor: 'bg-muted text-muted-foreground',
  };

  return (
    <Link to={`/products/${id}`}>
      <Card className="h-full glass-card hover:shadow-2xl transition-all duration-300 overflow-hidden group border-2 hover:border-primary/50 hover-lift shine">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          {images && images.length > 0 ? (
            <img
              src={images[0]}
              alt={title}
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-muted-foreground">
              <ShoppingBag className="h-20 w-20 opacity-20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-3 right-3 rounded-full shadow-lg glass bg-background/90 hover:bg-background hover:scale-110 transition-all"
            onClick={handleFavorite}
            disabled={loading}
          >
            <Heart className={`h-4 w-4 transition-all ${favorite ? 'fill-current text-red-500 scale-110' : ''}`} />
          </Button>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-semibold line-clamp-2 flex-1 group-hover:text-primary transition-colors">{title}</h3>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {condition && (
              <Badge variant="secondary" className={`${conditionColors[condition]} shadow-md`}>
                {condition.charAt(0).toUpperCase() + condition.slice(1).replace('-', ' ')}
              </Badge>
            )}
            {category && (
              <Badge variant="outline" className="shadow-sm glass">{category}</Badge>
            )}
            {transactionType && (
              <Badge variant="outline" className="shadow-sm glass">
                {transactionType === 'both' ? 'Sell/Exchange' : transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent animate-shimmer">
              ${price.toFixed(2)}
            </p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground glass px-2.5 py-1 rounded-full">
              <Eye className="h-4 w-4" />
              {views}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductCard;

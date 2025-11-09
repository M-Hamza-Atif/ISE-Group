import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ProductCard from '@/components/ProductCard';
import Navbar from '@/components/Navbar';

interface Product {
  id: string;
  title: string;
  price: number;
  condition: string;
  images: string[];
  transaction_type: string;
  views: number;
  categories: { name: string } | null;
}

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchFavorites();
    }
  }, [user, authLoading]);

  const fetchFavorites = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        products (
          id,
          title,
          price,
          condition,
          images,
          transaction_type,
          views,
          categories(name)
        )
      `)
      .eq('user_id', user.id);

    if (!error && data) {
      setProducts(data.map((item: any) => item.products).filter(Boolean));
    }
    setLoading(false);
  };

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Favorites</h1>
          <p className="text-muted-foreground">Items you've saved for later</p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                price={product.price}
                condition={product.condition}
                images={product.images}
                category={product.categories?.name}
                transactionType={product.transaction_type}
                views={product.views}
                isFavorite={true}
                onFavoriteChange={fetchFavorites}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-2">No favorites yet</p>
            <p className="text-sm text-muted-foreground">Start adding items to your favorites!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/ProductCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  condition: string;
  images: string[];
  transaction_type: string;
  views: number;
  categories: Category | null;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useScrollAnimation();

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select(`
        *,
        categories(id, name)
      `)
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching products:', error);
    } else if (data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.categories?.id === selectedCategory;
    const matchesCondition = selectedCondition === 'all' || product.condition === selectedCondition;
    const matchesType = selectedType === 'all' || product.transaction_type === selectedType || 
                        (selectedType === 'sell' && product.transaction_type === 'both') ||
                        (selectedType === 'exchange' && product.transaction_type === 'both');
    
    return matchesSearch && matchesCategory && matchesCondition && matchesType;
  });

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedCondition('all');
    setSelectedType('all');
    setSearchTerm('');
  };

  const activeFiltersCount = [selectedCategory, selectedCondition, selectedType].filter(f => f !== 'all').length;

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center scroll-reveal">
          <h1 className="text-5xl font-bold mb-6 pb-2 relative" style={{ lineHeight: '1.5' }}>
            {"FAST BAZAAR".split("").map((char, index) => (
              char === " " ? (
                <span key={index} className="letter-space"></span>
              ) : (
                <span 
                  key={index} 
                  className="letter-balloon bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent"
                  style={{ 
                    backgroundImage: 'linear-gradient(to right, hsl(263 70% 50%), hsl(280 70% 60%), hsl(220 70% 60%))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {char}
                </span>
              )
            ))}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            🎓 Find amazing deals from fellow students on campus • Buy, Sell & Exchange with ease
          </p>
        </div>

        {/* Search and Filters */}
        <div className="glass-card rounded-xl border-2 shadow-xl p-6 mb-8 space-y-4 scroll-fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input
              placeholder="Search for books, electronics, furniture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 text-lg border-2 focus:border-primary transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like-new">Like New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sell">For Sale</SelectItem>
                  <SelectItem value="exchange">For Exchange</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={clearFilters} className="hover:bg-destructive/10 hover:text-destructive">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Clear Filters ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-lg font-semibold">
            <span className="text-primary">{filteredProducts.length}</span>{' '}
            <span className="text-muted-foreground">
              {filteredProducts.length === 1 ? 'item' : 'items'} found
            </span>
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[420px] bg-muted/50 animate-pulse rounded-xl shadow-lg" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ProductCard
                  id={product.id}
                  title={product.title}
                  price={product.price}
                  condition={product.condition}
                  images={product.images}
                  category={product.categories?.name}
                  transactionType={product.transaction_type}
                  views={product.views}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 animate-scale-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full glass flex items-center justify-center">
              <Search className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-2xl font-semibold text-foreground mb-2">No products found</p>
            <p className="text-muted-foreground">Try adjusting your search or filters to find what you're looking for</p>
            {activeFiltersCount > 0 && (
              <Button onClick={clearFilters} className="mt-6 gradient-primary shine">
                Clear All Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;

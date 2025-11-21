import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, DollarSign, Calendar, Package } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  status: string;
  created_at: string;
  products: {
    title: string;
    images: string[];
  } | null;
  seller_profile: {
    full_name: string;
  } | null;
  buyer_profile: {
    full_name: string;
  } | null;
}

const TransactionHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Transaction[]>([]);
  const [sales, setSales] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchTransactions();
    }
  }, [user, authLoading]);

  const fetchTransactions = async () => {
    if (!user) return;

    setLoading(true);

    // Fetch purchases
    const { data: purchaseData } = await supabase
      .from('transactions')
      .select(`
        *,
        products(title, images),
        seller_profile:seller_id(full_name)
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (purchaseData) setPurchases(purchaseData as any);

    // Fetch sales
    const { data: salesData } = await supabase
      .from('transactions')
      .select(`
        *,
        products(title, images),
        buyer_profile:buyer_id(full_name)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (salesData) setSales(salesData as any);

    setLoading(false);
  };

  const renderTransactionCard = (transaction: Transaction, isSale: boolean) => (
    <Card key={transaction.id} className="glass-card hover-lift">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {transaction.products?.images?.[0] ? (
              <img 
                src={transaction.products.images[0]} 
                alt={transaction.products.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">
              {transaction.products?.title || 'Product'}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {isSale ? 'Sold to' : 'Purchased from'}: {
                isSale 
                  ? transaction.buyer_profile?.full_name 
                  : transaction.seller_profile?.full_name
              }
            </p>
            
            <div className="flex flex-wrap gap-2 items-center">
              <Badge className="bg-green-600 text-white">
                <DollarSign className="h-3 w-3 mr-1" />
                ${transaction.amount.toFixed(2)}
              </Badge>
              <Badge variant="outline">
                {transaction.transaction_type === 'sale' ? 'Sale' : 'Exchange'}
              </Badge>
              <Badge 
                variant={transaction.status === 'completed' ? 'default' : 'secondary'}
              >
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                <Calendar className="h-3 w-3" />
                {new Date(transaction.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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

  const totalPurchases = purchases.reduce((sum, t) => sum + t.amount, 0);
  const totalSales = sales.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Transaction History</h1>
          <p className="text-muted-foreground">View your buying and selling activity</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Total Purchases</span>
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <p className="text-3xl font-bold">${totalPurchases.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1">{purchases.length} transactions</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Total Sales</span>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">${totalSales.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1">{sales.length} transactions</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Net Balance</span>
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <p className={`text-3xl font-bold ${totalSales - totalPurchases >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${(totalSales - totalPurchases).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {totalSales - totalPurchases >= 0 ? 'Profit' : 'Spent'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Tabs */}
        <Tabs defaultValue="purchases" className="w-full">
          <TabsList>
            <TabsTrigger value="purchases">
              Purchases ({purchases.length})
            </TabsTrigger>
            <TabsTrigger value="sales">
              Sales ({sales.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchases" className="mt-6">
            {purchases.length > 0 ? (
              <div className="space-y-4">
                {purchases.map((transaction) => renderTransactionCard(transaction, false))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-xl font-semibold mb-2">No purchases yet</p>
                <p className="text-muted-foreground">Start shopping to see your purchase history here</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sales" className="mt-6">
            {sales.length > 0 ? (
              <div className="space-y-4">
                {sales.map((transaction) => renderTransactionCard(transaction, true))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-xl font-semibold mb-2">No sales yet</p>
                <p className="text-muted-foreground">List items to start selling and see your sales here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TransactionHistory;

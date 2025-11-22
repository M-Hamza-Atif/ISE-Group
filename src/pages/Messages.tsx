import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Inbox, MessageSquare, Package, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MessagingDrawer from '@/components/MessagingDrawer';
import Navbar from '@/components/Navbar';

interface Message {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  product_id: string;
  sender: { full_name: string };
  receiver: { full_name: string };
  product: {
    id: string;
    title: string;
    image_url: string;
    price: number;
  };
}

interface Conversation {
  productId: string;
  productTitle: string;
  productImage: string | null;
  productPrice: number;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOwner: boolean;
}

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<{
    productId: string;
    sellerId: string;
    productTitle: string;
  } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    // Auto-open drawer when conversation is selected
    if (selectedConversation) {
      setDrawerOpen(true);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    if (!user) return;

    setLoading(true);

    // Fetch all messages where user is sender or receiver
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(full_name),
        receiver:profiles!receiver_id(full_name),
        product:products(id, title, images, price, seller_id)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    console.log('Messages query result:', { messages, error, userId: user.id });

    if (error || !messages) {
      console.error('Error fetching messages:', error);
      setLoading(false);
      return;
    }

    // Group messages by product and other user
    const conversationMap = new Map<string, Conversation>();

    interface MessageWithRelations {
      id: string;
      message: string;
      created_at: string;
      sender_id: string;
      receiver_id: string;
      product_id: string;
      sender: { full_name: string };
      receiver: { full_name: string };
      product: {
        id: string;
        title: string;
        images: string[];
        price: number;
        seller_id: string;
      };
    }

    (messages as unknown as MessageWithRelations[]).forEach((msg) => {
      const isOwner = msg.product.seller_id === user.id;
      const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const otherUserName = msg.sender_id === user.id ? msg.receiver.full_name : msg.sender.full_name;
      
      const key = `${msg.product_id}-${otherUserId}`;

      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          productId: msg.product_id,
          productTitle: msg.product.title,
          productImage: msg.product.images && msg.product.images.length > 0 ? msg.product.images[0] : null,
          productPrice: msg.product.price,
          otherUserId,
          otherUserName,
          lastMessage: msg.message,
          lastMessageTime: msg.created_at,
          unreadCount: 0,
          isOwner,
        });
      }
    });

    setConversations(Array.from(conversationMap.values()));
    setLoading(false);
  };

  const handleOpenConversation = (conv: Conversation) => {
    console.log('Opening conversation:', conv);
    // sellerId parameter is actually the "other person" to message with
    // It should always be the person you're talking to, not yourself
    setSelectedConversation({
      productId: conv.productId,
      sellerId: conv.otherUserId, // Always the other person
      productTitle: conv.productTitle,
    });
    setDrawerOpen(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-4xl mx-auto text-center py-20">
          <Inbox className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-xl font-semibold mb-2">Sign in to view messages</p>
          <Button onClick={() => navigate('/auth')} className="gradient-primary">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-4xl font-bold gradient-text mb-2">Messages</h1>
            <p className="text-muted-foreground">All your conversations in one place</p>
          </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : conversations.length > 0 ? (
          <div className="space-y-4">
            {conversations.map((conv) => (
              <Card 
                key={`${conv.productId}-${conv.otherUserId}`}
                className="glass-card hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleOpenConversation(conv)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      {conv.productImage ? (
                        <img 
                          src={conv.productImage} 
                          alt={conv.productTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg truncate">
                            {conv.productTitle}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {conv.isOwner ? 'Inquiry from' : 'Chat with seller'}: {conv.otherUserName}
                          </p>
                        </div>
                        <Badge variant="secondary" className="flex-shrink-0">
                          ${conv.productPrice}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-2">
                        <p className="text-sm text-muted-foreground truncate flex-1">
                          {conv.lastMessage}
                        </p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {new Date(conv.lastMessageTime).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <MessageSquare className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Inbox className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-xl font-semibold mb-2">No messages yet</p>
            <p className="text-muted-foreground mb-4">
              Start browsing products and chat with sellers!
            </p>
            <Button onClick={() => navigate('/')} className="gradient-primary">
              Browse Products
            </Button>
          </div>
        )}
      </div>

      {selectedConversation && (
        <MessagingDrawer
          productId={selectedConversation.productId}
          sellerId={selectedConversation.sellerId}
          productTitle={selectedConversation.productTitle}
          sellerName=""
          open={drawerOpen}
          onOpenChange={(open) => {
            setDrawerOpen(open);
            if (!open) {
              setSelectedConversation(null);
              fetchConversations(); // Refresh conversations when drawer closes
            }
          }}
        />
      )}
      </div>
    </>
  );
};

export default Messages;

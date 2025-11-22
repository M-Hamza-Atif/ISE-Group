import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MessageCircle, Send, User } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender: { full_name: string };
}

interface MessagingDrawerProps {
  productId: string;
  productTitle: string;
  sellerId: string;
  sellerName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const MessagingDrawer = ({ productId, productTitle, sellerId, sellerName, open: externalOpen, onOpenChange }: MessagingDrawerProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync external open state with internal
  useEffect(() => {
    if (externalOpen !== undefined) {
      setOpen(externalOpen);
    }
  }, [externalOpen]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  useEffect(() => {
    if (open && user) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [open, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(full_name)
      `)
      .eq('product_id', productId)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as any);
    }
  };

  const subscribeToMessages = () => {
    if (!user) return;

    const subscription = supabase
      .channel(`messages:${productId}:${user.id}:${sellerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `product_id=eq.${productId}`,
        },
        (payload) => {
          // Only fetch if this message involves the current user
          const newMessage = payload.new as any;
          if (newMessage.sender_id === user.id || newMessage.receiver_id === user.id || 
              newMessage.sender_id === sellerId || newMessage.receiver_id === sellerId) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!user || !newMessage.trim()) return;

    setLoading(true);

    console.log('Sending message:', {
      product_id: productId,
      sender_id: user.id,
      receiver_id: sellerId,
      content: newMessage.trim(),
    });

    const { data, error } = await supabase
      .from('messages')
      .insert({
        product_id: productId,
        sender_id: user.id,
        receiver_id: sellerId,
        content: newMessage.trim(),
      })
      .select();

    console.log('Message send result:', { data, error });

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message: ' + error.message);
    } else {
      setNewMessage('');
      fetchMessages();
    }

    setLoading(false);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {!open && (
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full">
            <MessageCircle className="mr-2 h-4 w-4" />
            Message Seller
          </Button>
        </SheetTrigger>
      )}
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {user.id === sellerId ? 'Messages' : `Message ${sellerName}`}
          </SheetTitle>
          <SheetDescription className="line-clamp-1">
            About: {productTitle}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-200px)] mt-6">
          <ScrollArea className="flex-1 pr-4" ref={scrollRef as any}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${
                      message.sender_id === user?.id ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div
                      className={`max-w-[75%] rounded-lg p-3 ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm font-medium mb-1">
                        {message.sender.full_name}
                      </p>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={loading || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MessagingDrawer;

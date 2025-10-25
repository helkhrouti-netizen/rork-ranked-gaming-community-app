import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { chatService } from '@/services/chat';
import { ChatMessageWithSender } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseChatRoomParams {
  chatId: string | null;
  enabled?: boolean;
}

interface PendingMessage {
  tempId: string;
  body: string;
  retryCount: number;
}

export function useChatRoom({ chatId, enabled = true }: UseChatRoomParams) {
  const [messages, setMessages] = useState<ChatMessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesRef = useRef<ChatMessageWithSender[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const loadMessages = useCallback(async () => {
    if (!chatId || !enabled) return;

    try {
      setIsLoading(true);
      setError(null);
      const fetchedMessages = await chatService.getChatMessages({ chatId });
      setMessages(fetchedMessages);
    } catch (err: any) {
      console.error('❌ Failed to load messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [chatId, enabled]);

  const sendMessage = useCallback(
    async (body: string): Promise<void> => {
      if (!chatId || !body.trim()) return;

      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const trimmedBody = body.trim();

      setPendingMessages((prev) => [...prev, { tempId, body: trimmedBody, retryCount: 0 }]);
      setIsSending(true);

      try {
        const newMessage = await chatService.sendMessage({
          chatId,
          body: trimmedBody,
        });

        setPendingMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
        
        console.log('✅ Message sent successfully:', newMessage.id);
      } catch (err: any) {
        console.error('❌ Failed to send message:', err);
        setError(err.message || 'Failed to send message');
      } finally {
        setIsSending(false);
      }
    },
    [chatId]
  );

  const retryPendingMessages = useCallback(async () => {
    if (pendingMessages.length === 0) return;

    console.log('🔄 Retrying pending messages...');

    for (const pending of pendingMessages) {
      if (pending.retryCount >= 3) {
        console.log('❌ Max retries reached for message:', pending.tempId);
        setPendingMessages((prev) => prev.filter((msg) => msg.tempId !== pending.tempId));
        continue;
      }

      try {
        if (!chatId) continue;

        await chatService.sendMessage({
          chatId,
          body: pending.body,
        });

        setPendingMessages((prev) => prev.filter((msg) => msg.tempId !== pending.tempId));
        console.log('✅ Retry successful for message:', pending.tempId);
      } catch (err) {
        console.error('❌ Retry failed:', err);
        setPendingMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === pending.tempId ? { ...msg, retryCount: msg.retryCount + 1 } : msg
          )
        );
      }
    }
  }, [pendingMessages, chatId]);

  useEffect(() => {
    if (pendingMessages.length > 0 && !retryTimeoutRef.current) {
      retryTimeoutRef.current = setTimeout(() => {
        retryPendingMessages();
        retryTimeoutRef.current = null;
      }, 5000);
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [pendingMessages, retryPendingMessages]);

  useEffect(() => {
    if (!chatId || !enabled) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    loadMessages();

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          console.log('📨 New message received:', payload);

          const newMessage = payload.new as any;

          const { data: currentUser } = await supabase.auth.getUser();
          
          let senderUsername = 'Unknown';
          if (newMessage.sender_id === currentUser?.user?.id) {
            senderUsername = currentUser?.user?.user_metadata?.username || 'You';
          } else {
            const existingMsg = messagesRef.current.find(m => m.sender_id === newMessage.sender_id);
            senderUsername = existingMsg?.sender_username || 'Player';
          }

          const messageWithSender: ChatMessageWithSender = {
            ...newMessage,
            sender_username: senderUsername,
          };

          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === messageWithSender.id);
            if (exists) return prev;
            return [...prev, messageWithSender];
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      console.log('🔌 Unsubscribing from chat:', chatId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [chatId, enabled, loadMessages]);

  return {
    messages,
    isLoading,
    error,
    isSending,
    pendingMessages,
    sendMessage,
    retryPendingMessages,
    refetch: loadMessages,
  };
}

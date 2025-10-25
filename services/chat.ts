import { supabase } from '@/lib/supabase';
import {
  DBChat,
  DBChatMessage,
  DBChatMember,
  ChatMessageWithSender,
  SendMessageParams,
} from '@/types';

export interface CreateGroupChatParams {
  matchId: string;
  hostUserId: string;
}

export interface CreateDMParams {
  userId1: string;
  userId2: string;
}

export interface GetChatMessagesParams {
  chatId: string;
  limit?: number;
}

export const chatService = {
  async createGroupChat(params: CreateGroupChatParams): Promise<DBChat> {
    console.log('📝 Creating group chat for match:', params.matchId);

    try {
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          match_id: params.matchId,
          is_dm: false,
        })
        .select()
        .single();

      if (chatError) {
        console.error('❌ Chat insert error:', chatError);
        throw new Error(chatError.message || 'Failed to create group chat');
      }

      if (!chat) {
        throw new Error('Chat created but no data returned');
      }

      try {
        const { error: memberError } = await supabase.from('chat_members').insert({
          chat_id: chat.id,
          user_id: params.hostUserId,
        });

        if (memberError) {
          console.error('❌ Failed to add host to chat:', memberError);
        }
      } catch (memberErr) {
        console.error('❌ Error adding host to chat:', memberErr);
      }

      console.log('✅ Group chat created:', chat.id);
      return chat;
    } catch (error: any) {
      console.error('❌ Failed to create chat:', error);
      throw error;
    }
  },

  async createOrGetDM(params: CreateDMParams): Promise<DBChat> {
    console.log('📝 Creating/getting DM between users:', params.userId1, params.userId2);

    try {
      const { data: chatId, error: funcError } = await supabase.rpc(
        'get_or_create_dm_chat',
        {
          user1_id: params.userId1,
          user2_id: params.userId2,
        }
      );

      if (funcError) {
        console.error('❌ RPC error:', funcError);
        throw new Error(funcError.message);
      }

      if (!chatId) {
        throw new Error('Failed to get chat ID from RPC');
      }

      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select()
        .eq('id', chatId)
        .single();

      if (chatError || !chat) {
        console.error('❌ Failed to fetch DM chat:', chatError);
        throw new Error(chatError?.message || 'Failed to fetch DM chat');
      }

      console.log('✅ DM chat ready:', chat.id);
      return chat;
    } catch (error: any) {
      console.error('❌ Error in createOrGetDM:', error);
      throw error;
    }
  },

  async addChatMember(chatId: string, userId: string): Promise<void> {
    console.log('➕ Adding user to chat:', { chatId, userId });

    try {
      const { data: existing } = await supabase
        .from('chat_members')
        .select('user_id')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        console.log('ℹ️ User already in chat');
        return;
      }

      const { error } = await supabase.from('chat_members').insert({
        chat_id: chatId,
        user_id: userId,
      });

      if (error) {
        console.error('❌ Failed to add chat member:', error);
        throw new Error(error.message || 'Failed to add chat member');
      }

      console.log('✅ User added to chat');
    } catch (error: any) {
      console.error('❌ Error in addChatMember:', error);
      throw error;
    }
  },

  async removeChatMember(chatId: string, userId: string): Promise<void> {
    console.log('➖ Removing user from chat:', { chatId, userId });

    const { error } = await supabase
      .from('chat_members')
      .delete()
      .eq('chat_id', chatId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Failed to remove chat member:', error);
      throw new Error(error.message || 'Failed to remove chat member');
    }

    console.log('✅ User removed from chat');
  },

  async sendMessage(params: SendMessageParams): Promise<DBChatMessage> {
    console.log('💬 Sending message to chat:', params.chatId);

    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user) {
      throw new Error('Not authenticated');
    }

    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        chat_id: params.chatId,
        sender_id: currentUser.user.id,
        body: params.body,
        is_system: params.isSystem || false,
      })
      .select()
      .single();

    if (error || !message) {
      console.error('❌ Failed to send message:', error);
      throw new Error(error?.message || 'Failed to send message');
    }

    console.log('✅ Message sent:', message.id);
    return message;
  },

  async getChatMessages(params: GetChatMessagesParams): Promise<ChatMessageWithSender[]> {
    console.log('📖 Fetching messages for chat:', params.chatId);

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(
        `
        *,
        sender:sender_id (
          id,
          raw_user_meta_data
        )
      `
      )
      .eq('chat_id', params.chatId)
      .order('created_at', { ascending: true })
      .limit(params.limit || 100);

    if (error) {
      console.error('❌ Failed to fetch messages:', error);
      throw new Error(error.message || 'Failed to fetch messages');
    }

    const formattedMessages: ChatMessageWithSender[] = (messages || []).map((msg: any) => ({
      id: msg.id,
      chat_id: msg.chat_id,
      sender_id: msg.sender_id,
      body: msg.body,
      created_at: msg.created_at,
      edited_at: msg.edited_at,
      is_system: msg.is_system,
      sender_username: msg.sender?.raw_user_meta_data?.username || 'Unknown',
      sender_avatar: msg.sender?.raw_user_meta_data?.avatar,
    }));

    console.log(`✅ Fetched ${formattedMessages.length} messages`);
    return formattedMessages;
  },

  async getChatByMatchId(matchId: string): Promise<DBChat | null> {
    console.log('🔍 Finding chat for match:', matchId);

    const { data: chat, error } = await supabase
      .from('chats')
      .select()
      .eq('match_id', matchId)
      .eq('is_dm', false)
      .maybeSingle();

    if (error) {
      console.error('❌ Failed to fetch chat:', error);
      throw new Error(error.message);
    }

    if (!chat) {
      console.log('⚠️ No chat found for match');
      return null;
    }

    console.log('✅ Chat found:', chat.id);
    return chat;
  },

  async isChatMember(chatId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('chat_members')
      .select('user_id')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Failed to check membership:', error);
      return false;
    }

    return !!data;
  },
};

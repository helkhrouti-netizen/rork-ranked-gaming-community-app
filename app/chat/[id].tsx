import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useChatRoom } from '@/hooks/useChatRoom';
import { ChatMessageWithSender } from '@/types';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const chatId = typeof id === 'string' ? id : null;

  const [messageInput, setMessageInput] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);

  const { messages, isLoading, error, isSending, sendMessage, retryPendingMessages } = useChatRoom({
    chatId,
    enabled: !!chatId,
  });

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!messageInput.trim() || isSending) return;

    const text = messageInput;
    setMessageInput('');

    await sendMessage(text);
  };

  const renderMessage = ({ item }: { item: ChatMessageWithSender }) => {
    const isSystem = item.is_system;
    const date = new Date(item.created_at);
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.body}</Text>
        </View>
      );
    }

    return (
      <View style={styles.messageContainer}>
        <View style={styles.messageHeader}>
          <View style={styles.messageAvatar}>
            <Text style={styles.messageAvatarText}>
              {item.sender_username?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.messageContent}>
            <View style={styles.messageTopRow}>
              <Text style={styles.messageSender}>{item.sender_username}</Text>
              <Text style={styles.messageTime}>{time}</Text>
            </View>
            <Text style={styles.messageBody}>{item.body}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color={Colors.colors.primary} size="large" />
          <Text style={styles.emptyText}>Loading messages...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>👋</Text>
        <Text style={styles.emptyText}>Be the first to say hi!</Text>
      </View>
    );
  };

  if (!chatId) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <AlertCircle color={Colors.colors.danger} size={48} />
        <Text style={styles.errorText}>Invalid chat ID</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
          <ArrowLeft color={Colors.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Match Chat</Text>
        <View style={styles.placeholder} />
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <AlertCircle color={Colors.colors.danger} size={16} />
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={retryPendingMessages}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={[
          styles.messagesList,
          messages.length === 0 && styles.messagesListEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
        <TextInput
          style={styles.input}
          value={messageInput}
          onChangeText={setMessageInput}
          placeholder="Type a message..."
          placeholderTextColor={Colors.colors.textMuted}
          multiline
          maxLength={500}
          editable={!isSending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!messageInput.trim() || isSending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!messageInput.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator color={Colors.colors.textPrimary} size="small" />
          ) : (
            <Send color={Colors.colors.textPrimary} size={20} strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.colors.border,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.colors.danger + '20',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.colors.danger,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: Colors.colors.danger,
    fontWeight: '600' as const,
  },
  retryText: {
    fontSize: 14,
    color: Colors.colors.primary,
    fontWeight: '700' as const,
  },
  messagesList: {
    padding: 20,
    gap: 16,
  },
  messagesListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  messageContainer: {
    marginBottom: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  messageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageAvatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  messageContent: {
    flex: 1,
  },
  messageTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
  },
  messageTime: {
    fontSize: 12,
    color: Colors.colors.textMuted,
  },
  messageBody: {
    fontSize: 15,
    color: Colors.colors.textSecondary,
    lineHeight: 20,
  },
  systemMessageContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  systemMessageText: {
    fontSize: 12,
    color: Colors.colors.textMuted,
    fontStyle: 'italic' as const,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.colors.textMuted,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.colors.danger,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.colors.primary,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
  },
});

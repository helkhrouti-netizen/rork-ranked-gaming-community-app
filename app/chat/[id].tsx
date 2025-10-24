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
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ArrowLeft, Send, AlertCircle, Loader2 } from 'lucide-react-native';

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

  const renderMessage = ({ item, index }: { item: ChatMessageWithSender; index: number }) => {
    const isSystem = item.is_system;
    const date = new Date(item.created_at);
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const prevMessage = index > 0 ? messages[index - 1] : null;
    const isFirstFromSender = !prevMessage || prevMessage.sender_id !== item.sender_id;

    if (isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={styles.systemMessageBadge}>
            <Text style={styles.systemMessageText}>{item.body}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, !isFirstFromSender && styles.messageContainerCompact]}>
        <View style={styles.messageRow}>
          {isFirstFromSender ? (
            <View style={styles.messageAvatar}>
              <Text style={styles.messageAvatarText}>
                {item.sender_username?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          ) : (
            <View style={styles.messageAvatarPlaceholder} />
          )}
          <View style={styles.messageContent}>
            {isFirstFromSender && (
              <View style={styles.messageHeader}>
                <Text style={styles.messageSender}>{item.sender_username || 'Unknown'}</Text>
                <Text style={styles.messageTime}>{time}</Text>
              </View>
            )}
            <View style={styles.messageBubble}>
              <Text style={styles.messageBody}>{item.body}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.loadingSpinner}>
            <Loader2 color={Colors.colors.primary} size={40} />
          </View>
          <Text style={styles.emptyText}>Loading messages...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Text style={styles.emptyEmoji}>💬</Text>
        </View>
        <Text style={styles.emptyTitle}>No messages yet</Text>
        <Text style={styles.emptySubtitle}>Start the conversation!</Text>
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
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
            <ArrowLeft color={Colors.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Match Chat</Text>
            {messages.length > 0 && (
              <Text style={styles.headerSubtitle}>{messages.length} messages</Text>
            )}
          </View>
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
          onContentSizeChange={() => {
            if (messages.length > 0) {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 50);
            }
          }}
          showsVerticalScrollIndicator={false}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 100,
          }}
        />

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={messageInput}
              onChangeText={setMessageInput}
              placeholder="Message..."
              placeholderTextColor={Colors.colors.textMuted}
              multiline
              maxLength={500}
              editable={!isSending}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!messageInput.trim() || isSending) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!messageInput.trim() || isSending}
              activeOpacity={0.7}
            >
              {isSending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Send color="#FFFFFF" size={18} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.colors.textMuted,
    marginTop: 2,
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
    padding: 16,
    paddingBottom: 8,
  },
  messagesListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageContainerCompact: {
    marginBottom: 4,
  },
  messageRow: {
    flexDirection: 'row',
    gap: 10,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  messageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageAvatarText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  messageAvatarPlaceholder: {
    width: 36,
    height: 36,
  },
  messageContent: {
    flex: 1,
  },
  messageBubble: {
    backgroundColor: Colors.colors.surfaceLight,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
  },
  messageTime: {
    fontSize: 11,
    color: Colors.colors.textMuted,
  },
  messageBody: {
    fontSize: 15,
    color: Colors.colors.textPrimary,
    lineHeight: 20,
  },
  systemMessageContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  systemMessageBadge: {
    backgroundColor: Colors.colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.colors.border,
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
    gap: 12,
  },
  loadingSpinner: {
    marginBottom: 8,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.colors.textMuted,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.colors.textMuted,
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.colors.surfaceLight,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 15,
    color: Colors.colors.textPrimary,
    maxHeight: 100,
    minHeight: 40,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  sendButtonDisabled: {
    opacity: 0.4,
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

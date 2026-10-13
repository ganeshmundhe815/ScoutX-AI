import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_API_URL } from '../services/apiConfig';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export default function MessagesScreen({ route, navigation }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const { userToken, currentUserId, userName = 'You', recipientUser } = route.params || {};

  const [activeRecipient, setActiveRecipient] = useState(
    recipientUser || {
      _id: 'usr_coach_01',
      name: 'Coach Ranjan Patil',
      role: 'coach',
      club: 'Mumbai City Youth Academy',
    }
  );
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (activeRecipient && activeRecipient._id) {
      fetchMessageHistory(activeRecipient._id);
    }
  }, [activeRecipient]);

  const fetchMessageHistory = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_API_URL}/messages/${userId}`, {
        headers: {
          ...(userToken && { Authorization: `Bearer ${userToken}` }),
        },
      });
      const data = await response.json();
      if (response.ok && data.data && data.data.length > 0) {
        setMessages(data.data);
      } else {
        // Default initial conversation thread
        setMessages([
          {
            _id: '1',
            sender: { _id: activeRecipient._id, name: activeRecipient.name },
            message: `Hello ${userName}! We reviewed your Football AI Assessment. Your technical execution scores and ball control proximity are impressive. We would like to invite you for youth academy trials.`,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ]);
      }
    } catch (err) {
      setMessages([
        {
          _id: '1',
          sender: { _id: activeRecipient._id, name: activeRecipient.name },
          message: `Hello ${userName}! We observed your verified 90+ overall rating on ScoutX-AI. Are you available for trials in Mumbai?`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMsgText = inputMessage.trim();
    setInputMessage('');

    const tempMsg = {
      _id: `temp_${Date.now()}`,
      sender: { _id: currentUserId || 'me', name: userName },
      message: newMsgText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      setSending(true);
      await fetch(`${BASE_API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userToken && { Authorization: `Bearer ${userToken}` }),
        },
        body: JSON.stringify({
          receiverId: activeRecipient._id,
          message: newMsgText,
        }),
      });
    } catch (err) {
      console.warn(`[Send Msg Warning]: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.recipientHeader}>
          <View style={styles.recipientAvatar}>
            <Text style={styles.recipientAvatarText}>
              {(activeRecipient.name || 'C').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <View style={styles.recipientNameRow}>
              <Text style={styles.recipientName}>{activeRecipient.name}</Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>{(activeRecipient.role || 'COACH').toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.recipientSub}>
              {activeRecipient.club || 'Youth Football Academy'}
            </Text>
          </View>
        </View>

        <View style={styles.brand}>
          <View style={styles.logoBadge}>
            <Ionicons name="football" size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.brandName}>ScoutX<Text style={styles.brandAccent}>.AI</Text></Text>
        </View>
      </View>

      <View style={styles.chatContainer}>
        {/* Messages Stream */}
        <ScrollView
          style={styles.messagesStream}
          contentContainerStyle={styles.messagesContent}
          ref={(ref) => ref && ref.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.encryptedBanner}>
            <Ionicons name="lock-closed" size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.encryptedText}>Direct communication between verified athletes and certified scouts</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender?._id !== activeRecipient._id;
              return (
                <View
                  key={msg._id || index}
                  style={[styles.messageBubbleWrapper, isMe ? styles.bubbleMeWrapper : styles.bubbleThemWrapper]}
                >
                  <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                    <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextThem]}>
                      {msg.message}
                    </Text>
                    <Text style={[styles.timestamp, isMe ? styles.timestampMe : styles.timestampThem]}>
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Composer Bar */}
        <View style={styles.composerBar}>
          <TextInput
            style={styles.composerInput}
            placeholder="Type a message to discuss trials or training..."
            placeholderTextColor={COLORS.textMuted}
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputMessage.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="send" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  recipientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recipientAvatar: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  recipientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  roleTag: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  recipientSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  brandAccent: {
    color: COLORS.primary,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  messagesStream: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.md,
    maxWidth: 780,
    width: '100%',
    marginHorizontal: 'auto',
  },
  encryptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  encryptedText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  messageBubbleWrapper: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  bubbleMeWrapper: {
    justifyContent: 'flex-end',
  },
  bubbleThemWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...SHADOWS.subtle,
  },
  bubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  bubbleThem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTextThem: {
    color: COLORS.textPrimary,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timestampMe: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  timestampThem: {
    color: COLORS.textMuted,
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    gap: 10,
    maxWidth: 820,
    width: '100%',
    marginHorizontal: 'auto',
  },
  composerInput: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

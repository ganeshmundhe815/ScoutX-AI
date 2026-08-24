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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BASE_API_URL } from '../services/apiConfig';

export default function MessagesScreen({ route, navigation }) {
  const { userToken, currentUserId, userName = 'You', recipientUser } = route.params || {};

  const [conversations, setConversations] = useState([]);
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
    fetchConversations();
    if (activeRecipient && activeRecipient._id) {
      fetchMessageHistory(activeRecipient._id);
    }
  }, [activeRecipient]);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/messages/conversations`, {
        headers: {
          ...(userToken && { Authorization: `Bearer ${userToken}` }),
        },
      });
      const data = await response.json();
      if (response.ok && data.data) {
        setConversations(data.data);
      }
    } catch (err) {
      console.warn(`[Messages]: ${err.message}`);
    }
  };

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
        // Default initial thread
        setMessages([
          {
            _id: '1',
            sender: { _id: activeRecipient._id, name: activeRecipient.name },
            message: `Hello ${userName}! We reviewed your Football AI Assessment. Your dribbling agility and ball control metrics are impressive. We would like to invite you for academy trials.`,
            createdAt: new Date(Date.now() - 3600000),
          },
        ]);
      }
    } catch (err) {
      setMessages([
        {
          _id: '1',
          sender: { _id: activeRecipient._id, name: activeRecipient.name },
          message: `Hello ${userName}! We saw your 91 Dribbling score on ScoutX AI. Are you available for a trial?`,
          createdAt: new Date(),
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

    // Optimistically add to UI
    const tempMsg = {
      _id: `temp_${Date.now()}`,
      sender: { _id: currentUserId || 'me', name: userName },
      message: newMsgText,
      createdAt: new Date(),
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>{activeRecipient.name}</Text>
          <Text style={styles.headerSub}>
            {activeRecipient.role === 'coach' ? '🛡️ Verified Football Scout' : '⚽ Football Prospect'}
          </Text>
        </View>
      </View>

      {/* Message History */}
      <ScrollView
        contentContainerStyle={styles.messagesContent}
        ref={(ref) => ref && ref.scrollToEnd({ animated: true })}
      >
        {loading ? (
          <ActivityIndicator color="#10B981" style={{ marginTop: 20 }} />
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender?._id !== activeRecipient._id;
            return (
              <View
                key={msg._id || index}
                style={[
                  styles.messageBubble,
                  isMe ? styles.myMessage : styles.theirMessage,
                ]}
              >
                <Text style={[styles.messageSender, isMe && { color: '#A7F3D0' }]}>
                  {isMe ? 'You' : activeRecipient.name}
                </Text>
                <Text style={styles.messageText}>{msg.message}</Text>
                <Text style={styles.messageTime}>
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message (e.g. trial dates, location)..."
          placeholderTextColor="#64748B"
          value={inputMessage}
          onChangeText={setInputMessage}
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={sending || !inputMessage.trim()}
        >
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
  },
  headerSub: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 14,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#065F46',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  messageSender: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const embeddedStore = require('../config/embeddedStore');

// @desc    Send a message (Player to Coach or Coach to Player)
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, message, drillReference = '' } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide receiverId and message content.',
      });
    }

    let messageDoc;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(receiverId)) {
      messageDoc = await Message.create({
        sender: req.user._id,
        receiver: receiverId,
        message: message.trim(),
        drillReference,
      });

      await messageDoc.populate([
        { path: 'sender', select: 'name role email' },
        { path: 'receiver', select: 'name role email' },
      ]);
    } else {
      // In-Memory Fallback & Demo String IDs
      messageDoc = {
        _id: `msg_${Date.now()}`,
        sender: req.user,
        receiver: { _id: receiverId, name: 'Recipient' },
        message: message.trim(),
        drillReference,
        read: false,
        createdAt: new Date(),
      };
      embeddedStore.messages.push(messageDoc);
    }

    res.status(201).json({
      status: 'success',
      message: 'Message delivered successfully! 📩',
      data: messageDoc,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get message history between logged in user and another user
// @route   GET /api/messages/:userId
// @access  Private
const getMessageHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    let history = [];

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
      history = await Message.find({
        $or: [
          { sender: currentUserId, receiver: userId },
          { sender: userId, receiver: currentUserId },
        ],
      })
        .sort({ createdAt: 1 })
        .populate('sender', 'name role')
        .populate('receiver', 'name role');
    } else {
      history = embeddedStore.messages.filter(
        (m) =>
          (m.sender._id === currentUserId && m.receiver._id === userId) ||
          (m.sender._id === userId && m.receiver._id === currentUserId)
      );
    }

    res.status(200).json({
      status: 'success',
      count: history.length,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of active conversations for logged in user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    let conversations = [];

    if (mongoose.connection.readyState === 1) {
      const messages = await Message.find({
        $or: [{ sender: currentUserId }, { receiver: currentUserId }],
      })
        .sort({ createdAt: -1 })
        .populate('sender', 'name role email')
        .populate('receiver', 'name role email');

      const seenUsers = new Set();

      for (const msg of messages) {
        if (!msg.sender || !msg.receiver) continue;
        const otherUser =
          msg.sender._id.toString() === currentUserId.toString()
            ? msg.receiver
            : msg.sender;

        if (otherUser && !seenUsers.has(otherUser._id.toString())) {
          seenUsers.add(otherUser._id.toString());
          conversations.push({
            user: otherUser,
            lastMessage: msg.message,
            lastTimestamp: msg.createdAt,
            unread: !msg.read && msg.receiver._id.toString() === currentUserId.toString(),
          });
        }
      }
    }

    if (conversations.length === 0) {
      conversations = [
        {
          user: {
            _id: 'usr_coach_patil',
            name: 'Coach Ranjan Patil (Mumbai City FC)',
            role: 'coach',
          },
          lastMessage: 'Impressive agility in your Dribbling assessment video! Let us discuss trial dates.',
          lastTimestamp: new Date(),
          unread: true,
        },
      ];
    }

    res.status(200).json({
      status: 'success',
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getMessageHistory,
  getConversations,
};

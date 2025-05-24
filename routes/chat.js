const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Get or create chat session
router.post('/session', auth, async (req, res) => {
    try {
        // Only allow employers to create chat sessions
        if (req.user.userType !== 'employer') {
            return res.status(403).json({ message: 'Only employers can initiate chat sessions.' });
        }
        const { freelancerId } = req.body;
        const employerId = req.user.userId;

        // Defensive check
        if (!employerId || !freelancerId) {
            return res.status(400).json({ message: 'Both employer and freelancer IDs are required.' });
        }
        // Prevent self-chat
        if (employerId === freelancerId) {
            return res.status(400).json({ message: 'Cannot create a chat with yourself.' });
        }

        // Always use sorted order for participants to avoid duplicate key errors
        const participants = [employerId, freelancerId].sort();

        console.log('Creating chat with participants:', participants);

        // Check for existing chat with both participants (order-insensitive)
        let chat = await Chat.findOne({
            participants: { $all: participants, $size: 2 }
        }).populate('participants', 'username');

        if (!chat) {
            // Create new chat session
            chat = new Chat({
                participants
            });
            await chat.save();
            chat = await chat.populate('participants', 'username');
        }

        res.json(chat);
    } catch (error) {
        console.error('Error in /api/chat/session:', error);
        res.status(500).json({ message: error.message });
    }
});

// Send message
router.post('/message', auth, async (req, res) => {
    try {
        const { chatId, content } = req.body;
        const senderId = req.user.userId; // FIXED: use userId from JWT

        const message = new Message({
            chatId,
            sender: senderId,
            content
        });

        await message.save();

        // Update chat's last message
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: content,
            lastMessageTime: new Date()
        });

        res.json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get messages for a chat session
router.get('/messages/:chatId', auth, async (req, res) => {
    try {
        const messages = await Message.find({ chatId: req.params.chatId })
            .populate('sender', 'username')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all chat sessions for a user
router.get('/sessions', auth, async (req, res) => {
    try {
        const chats = await Chat.find({
            participants: req.user.userId
        })
        .populate('participants', 'username')
        .sort({ lastMessageTime: -1 });

        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a single chat by ID
router.get('/:chatId', auth, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId).populate('participants', 'username');
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 
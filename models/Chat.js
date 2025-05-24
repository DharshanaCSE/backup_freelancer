const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        type: String,
        default: ''
    },
    lastMessageTime: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Create a compound index to ensure unique chat sessions between two users
chatSchema.index({ participants: 1 }, { unique: true });

module.exports = mongoose.model('Chat', chatSchema); 
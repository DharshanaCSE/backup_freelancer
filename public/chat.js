let currentChatId = null;
let currentPartnerId = null;
let currentPartnerName = 'Select a chat';
let pollingInterval = null;

// Initialize chat
document.addEventListener('DOMContentLoaded', async () => {
    await loadChatSessions();
    setupMessageHandlers();
    startPolling();
    handleChatIdFromUrl();
});

window.addEventListener('popstate', handleChatIdFromUrl);

// Load chat sessions
async function loadChatSessions() {
    try {
        const response = await fetch('/api/chat/sessions', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const chats = await response.json();
        displayChatSessions(chats);
    } catch (error) {
        console.error('Error loading chat sessions:', error);
    }
}

// Display chat sessions in sidebar
function displayChatSessions(chats) {
    const chatList = document.getElementById('chatList');
    chatList.innerHTML = '';

    chats.forEach(chat => {
        const partner = chat.participants.find(p => p._id !== getCurrentUserId());
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.dataset.chatId = chat._id;
        chatItem.dataset.partnerId = partner._id;
        chatItem.dataset.partnerName = partner.username;

        chatItem.innerHTML = `
            <div class="chat-item-name">${partner.username}</div>
            <div class="chat-item-last-message">${chat.lastMessage || 'No messages yet'}</div>
        `;

        chatItem.addEventListener('click', () => selectChat(chat._id, partner._id, partner.username));
        chatList.appendChild(chatItem);
    });
}

// Select a chat by ID (from URL)
async function selectChatById(chatId) {
    try {
        // Try to find chat in the list first
        const response = await fetch('/api/chat/sessions', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const chats = await response.json();
        let chat = chats.find(c => c._id === chatId);
        if (!chat) {
            // If not found, fetch chat directly by ID (fallback)
            chat = await fetchChatById(chatId);
        }
        if (chat) {
            const partner = chat.participants.find(p => p._id !== getCurrentUserId());
            await selectChat(chat._id, partner._id, partner.username);
        } else {
            document.getElementById('chatPartnerName').textContent = 'Chat not found';
        }
    } catch (error) {
        console.error('Error selecting chat by ID:', error);
    }
}

// Fetch a single chat by ID (direct endpoint)
async function fetchChatById(chatId) {
    try {
        const response = await fetch(`/api/chat/${chatId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        return null;
    }
}

// Select a chat
async function selectChat(chatId, partnerId, partnerName) {
    currentChatId = chatId;
    currentPartnerId = partnerId;
    currentPartnerName = partnerName;

    // Update UI
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.chatId === chatId) {
            item.classList.add('active');
        }
    });

    document.getElementById('chatPartnerName').textContent = partnerName;
    await loadMessages(chatId);
}

// Load messages for a chat
async function loadMessages(chatId) {
    try {
        const response = await fetch(`/api/chat/messages/${chatId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const messages = await response.json();
        displayMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Display messages
function displayMessages(messages) {
    const container = document.getElementById('messageContainer');
    container.innerHTML = '';

    messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender._id === getCurrentUserId() ? 'sent' : 'received'}`;
        messageElement.textContent = message.content;
        container.appendChild(messageElement);
    });

    container.scrollTop = container.scrollHeight;
}

// Setup message handlers
function setupMessageHandlers() {
    const sendButton = document.getElementById('sendButton');
    const messageInput = document.getElementById('messageInput');

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// Send message
async function sendMessage() {
    const chatId = getChatIdFromUrl();
    if (!chatId) {
        alert('No chat selected!');
        return;
    }
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    if (!content) return;
    try {
        const response = await fetch('/api/chat/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                chatId: chatId,
                content
            })
        });
        if (response.ok) {
            messageInput.value = '';
            await loadMessages(chatId);
            await loadChatSessions(); // Refresh chat list to update last message
        } else {
            const errorText = await response.text();
            alert('Failed to send message: ' + errorText);
            console.error('Send message error:', errorText);
        }
    } catch (error) {
        alert('Error sending message: ' + error.message);
        console.error('Error sending message:', error);
    }
}

// Start polling for new messages
function startPolling() {
    pollingInterval = setInterval(() => {
        const chatId = getChatIdFromUrl();
        if (chatId) {
            loadMessages(chatId);
        }
    }, 3000); // Poll every 3 seconds
}

// Get current user ID from token
function getCurrentUserId() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    // Decode JWT token to get user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId;
}

// Clean up polling on page unload
window.addEventListener('beforeunload', () => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});

// On page load and on popstate, always select chat by chatId from URL
function handleChatIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const chatIdFromUrl = urlParams.get('chatId');
    if (chatIdFromUrl) {
        selectChatById(chatIdFromUrl);
    }
}

// Always use chatId from URL for polling and sending
function getChatIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('chatId');
} 
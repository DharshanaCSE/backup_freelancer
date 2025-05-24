const express = require('express');
const mongoose = require('mongoose');
const chatRoutes = require('./routes/chat');
const cors = require('cors');
const bodyParser = require('body-parser');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Your other routes (auth, user, etc.) go here

// Chat routes
app.use('/api/chat', chatRoutes);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/yourdbname', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
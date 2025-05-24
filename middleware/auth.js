const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-secret-key'; // Use the same secret as in server.js

module.exports = function (req, res, next) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.headers['x-access-token']) {
        token = req.headers['x-access-token'];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else if (req.body && req.body.token) {
        token = req.body.token;
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
}; 
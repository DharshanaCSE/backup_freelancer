const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const chatRoutes = require('./routes/chat');
const jobsRoutes = require('./routes/jobs');
const User = require('./models/User');
const Job = require('./models/Job');
const JobApplication = require('./models/JobApplication');
const Notification = require('./models/Notification');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/freelancer_platform', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Gigs Schema
const gigSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});
const Gig = mongoose.model('Gig', gigSchema);

// Contact Schema
const contactSchema = new mongoose.Schema({
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    freelancerEmail: { type: String },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    employerEmail: { type: String },
    requestedBy: { type: String }, // employer id or email (optional)
    timestamp: { type: Date, default: Date.now }
});
const Contact = mongoose.model('Contact', contactSchema);

// JWT Secret
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/uploads/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, userType } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user object based on type
        const userData = {
            username,
            email,
            password: hashedPassword,
            userType
        };

        // Add type-specific fields
        if (userType === 'freelancer') {
            userData.domain = req.body.domain;
            userData.skills = req.body.skills;
            userData.profile = req.body.profile;
            userData.portfolio = req.body.portfolio;
            let exp = req.body.experience;
            if (exp === undefined || exp === null || exp === '' || isNaN(Number(exp)) || Number(exp) < 0) {
                exp = 0;
            } else {
                exp = Math.floor(Number(exp));
            }
            userData.experience = exp;
        } else {
            userData.companyName = req.body.companyName;
            userData.companyDescription = req.body.companyDescription;
        }

        // Create new user
        const user = new User(userData);
        await user.save();

        // Generate JWT
        const token = jwt.sign({ userId: user._id, userType }, JWT_SECRET);

        res.status(201).json({ message: 'User registered successfully', token, userType });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Generate JWT
        const token = jwt.sign({ userId: user._id, userType: user.userType }, JWT_SECRET);

        res.json({ message: 'Login successful', token, userType: user.userType });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// JWT authentication middleware
function authenticateJWT(req, res, next) {
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
}

// Get current freelancer info
app.get('/api/freelancer/me', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || user.userType !== 'freelancer') {
            return res.status(404).json({ message: 'Freelancer not found' });
        }
        const Application = require('./models/Application');
        const jobsApplied = await Application.countDocuments({ freelancerId: user._id });
        const jobsWon = await Application.countDocuments({ freelancerId: user._id, status: 'completed' });
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            domain: user.domain,
            skills: user.skills,
            profile: user.profile,
            portfolio: user.portfolio,
            jobsApplied,
            jobsWon,
            profileCompleteness: 17 // Placeholder or your own logic
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching freelancer info' });
    }
});

// Get user profile by type and id
app.get('/api/profile/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user || user.userType !== type) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (type === 'employer') {
            res.json({
                username: user.username,
                companyName: user.companyName,
                companyDescription: user.companyDescription,
                companySize: user.companySize || 'Not specified',
                industry: user.industry || 'Not specified',
                location: user.location || 'Not specified',
                activeJobs: 0,
                totalHires: user.totalHires || 0,
                totalProjects: 0,
                activeFreelancers: 0,
                averageRating: 0,
                activeJobsList: 'No active job postings',
                companyReviews: 'No reviews yet',
                profileImageUrl: user.profileImageUrl || null
            });
        } else {
            res.json({
                username: user.username,
                domain: user.domain,
                jobsCompleted: user.jobsCompleted || 0,
                rating: user.rating || 0,
                profile: user.profile,
                skills: user.skills,
                portfolio: user.portfolio,
                profileImageUrl: user.profileImageUrl || null,
                experience: user.experience
            });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error fetching user profile' });
    }
});

// Update user profile (supports both freelancer and employer fields)
app.put('/api/profile/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    const { username, profile, skills, portfolio, companyName, companyDescription, companySize, industry, location } = req.body;
    try {
        const user = await User.findById(id);
        if (!user || user.userType !== type) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Freelancer fields
        if (username !== undefined) user.username = username;
        if (profile !== undefined) user.profile = profile;
        if (skills !== undefined) user.skills = skills;
        if (portfolio !== undefined) user.portfolio = portfolio;
        if (user.userType === 'freelancer' && req.body.experience !== undefined) {
            let exp = req.body.experience;
            if (exp === '' || isNaN(Number(exp)) || Number(exp) < 0) {
                exp = 0;
            } else {
                exp = Math.floor(Number(exp));
            }
            user.experience = exp;
        }
        // Employer fields
        if (companyName !== undefined) user.companyName = companyName;
        if (companyDescription !== undefined) user.companyDescription = companyDescription;
        if (companySize !== undefined) user.companySize = companySize;
        if (industry !== undefined) user.industry = industry;
        if (location !== undefined) user.location = location;
        await user.save();
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating profile' });
    }
});

// Image upload endpoint
app.post('/api/profile/upload-image', upload.single('image'), async (req, res) => {
    const { userId, userType } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    try {
        const user = await User.findById(userId);
        if (!user || user.userType !== userType) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.profileImageUrl = '/uploads/' + req.file.filename;
        await user.save();
        res.json({ profileImageUrl: user.profileImageUrl });
    } catch (err) {
        res.status(500).json({ message: 'Error uploading image' });
    }
});

// Connect endpoint (stub)
app.post('/api/connect', async (req, res) => {
    // You can store connection requests in a new collection if needed
    // For now, just return success
    res.json({ message: 'Connection request sent!' });
});

// Get current employer info
app.get('/api/employer/me', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || user.userType !== 'employer') {
            return res.status(404).json({ message: 'Employer not found' });
        }
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            companyName: user.companyName,
            companyDescription: user.companyDescription,
            companySize: user.companySize || 'Not specified',
            industry: user.industry || 'Not specified',
            location: user.location || 'Not specified',
            activeJobs: 0,
            totalHires: user.totalHires || 0,
            totalProjects: 0,
            activeFreelancers: 0,
            averageRating: 0,
            activeJobsList: 'No active job postings',
            companyReviews: 'No reviews yet',
            profileImageUrl: user.profileImageUrl || null
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching employer info' });
    }
});

// Search and filter freelancers
app.get('/api/freelancers/search', async (req, res) => {
    try {
        const { query, domain, experience, rating, price } = req.query;
        
        // Build filter object
        const filter = { userType: 'freelancer' };
        
        if (query) {
            filter.$or = [
                { username: { $regex: query, $options: 'i' } },
                { skills: { $regex: query, $options: 'i' } },
                { domain: { $regex: query, $options: 'i' } }
            ];
        }
        
        if (domain) {
            filter.domain = { $regex: domain, $options: 'i' };
        }
        
        if (experience) {
            filter.experience = { $gte: parseInt(experience) };
        }
        
        if (rating) {
            filter.averageRating = { $gte: parseFloat(rating) };
        }

        let sort = {};
        if (rating) {
            sort = { averageRating: -1 };
        }
        const freelancers = await User.find(filter)
            .select('username domain skills averageRating jobsCompleted profileImageUrl _id')
            .sort(sort)
            .limit(20);

        // Map averageRating to rating for frontend compatibility
        const freelancersWithRating = freelancers.map(f => ({
            ...f.toObject(),
            rating: typeof f.averageRating === 'number' ? f.averageRating : 0
        }));

        res.json(freelancersWithRating);
    } catch (error) {
        console.error('Error searching freelancers:', error);
        res.status(500).json({ error: 'Failed to search freelancers' });
    }
});

// Get gigs by user
app.get('/api/gigs/user/:userId', async (req, res) => {
    try {
        const gigs = await Gig.find({ userId: req.params.userId });
        res.json(gigs);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching gigs' });
    }
});

// Add new gig
app.post('/api/gigs', async (req, res) => {
    try {
        const { title, description, price, category, userId } = req.body;
        const gig = new Gig({ title, description, price, category, userId });
        await gig.save();
        res.status(201).json(gig);
    } catch (err) {
        res.status(500).json({ message: 'Error creating gig' });
    }
});

// Edit gig
app.put('/api/gigs/:gigId', async (req, res) => {
    try {
        const { title, description, price, category } = req.body;
        const gig = await Gig.findByIdAndUpdate(
            req.params.gigId,
            { title, description, price, category },
            { new: true }
        );
        if (!gig) return res.status(404).json({ message: 'Gig not found' });
        res.json(gig);
    } catch (err) {
        res.status(500).json({ message: 'Error updating gig' });
    }
});

// Store contact request and return freelancer email
app.post('/api/contact', async (req, res) => {
    try {
        const { freelancerId, employerId, requestedBy } = req.body;
        if (freelancerId) {
            const freelancer = await User.findById(freelancerId);
            if (!freelancer) return res.status(404).json({ message: 'Freelancer not found' });
            const contact = new Contact({
                freelancerId,
                freelancerEmail: freelancer.email,
                requestedBy
            });
            await contact.save();
            return res.json({ email: freelancer.email });
        } else if (employerId) {
            const employer = await User.findById(employerId);
            if (!employer) return res.status(404).json({ message: 'Employer not found' });
            const contact = new Contact({
                employerId,
                employerEmail: employer.email,
                requestedBy
            });
            await contact.save();
            return res.json({ email: employer.email });
        } else {
            return res.status(400).json({ message: 'No valid id provided' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error processing contact request' });
    }
});
app.use('/api/chat', chatRoutes);
app.get('/api/jobs/all', authenticateJWT, async (req, res) => {
    try {
        const { domain } = req.query;
        const filter = { status: 'open' };
        if (domain) {
            filter.$or = [
                { title: { $regex: domain, $options: 'i' } },
                { description: { $regex: domain, $options: 'i' } },
                { category: { $regex: domain, $options: 'i' } }
            ];
        }
        const jobs = await require('./models/Job').find(filter)
            .sort({ timestamp: -1 })
            .populate('employer_id', 'username companyName');
        res.json(jobs);
    } catch (err) {
        console.error('Error fetching jobs:', err);
        res.status(500).json({ message: err.message || 'Error fetching jobs' });
    }
});

// Get active workers for an employer
app.get('/api/employer/:employerId/active-workers', authenticateJWT, async (req, res) => {
    try {
        const { employerId } = req.params;
        // Validate employer
        if (req.user.userId !== employerId) {
            return res.status(403).json({ message: 'Not authorized to view these workers' });
        }
        // Find all assigned jobs for this employer
        const jobs = await require('./models/Job').find({
            employer_id: employerId,
            status: 'assigned'
        }).populate('assignedFreelancer');
        // Format worker data
        const workers = jobs.map(job => ({
            _id: job.assignedFreelancer?._id,
            username: job.assignedFreelancer?.username,
            domain: job.assignedFreelancer?.domain,
            skills: job.assignedFreelancer?.skills,
            currentJob: job.title,
            jobId: job._id
        }));
        res.json(workers);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching active workers' });
    }
});

// Get active jobs details for a freelancer
app.get('/api/jobs/active-details', authenticateJWT, async (req, res) => {
    try {
        const { freelancerId } = req.query;
        if (!freelancerId) {
            return res.status(400).json({ message: 'Freelancer ID is required' });
        }

        // Find all jobs where this freelancer is assigned and status is 'assigned'
        const jobs = await Job.find({
            assignedFreelancer: freelancerId,
            status: 'assigned'
        }).populate('employer_id', 'username companyName');

        // Format the response
        const formattedJobs = jobs.map(job => ({
            _id: job._id,
            title: job.title,
            budget: job.budget,
            timeline: job.timeline,
            description: job.description,
            employerName: job.employer_id.companyName || job.employer_id.username
        }));

        res.json(formattedJobs);
    } catch (err) {
        console.error('Error fetching active jobs details:', err);
        res.status(500).json({ message: 'Error fetching active jobs details' });
    }
});

app.use('/api/jobs', jobsRoutes); 
// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/result', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'result.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 

// Complete work
app.post('/api/jobs/complete-work', authenticateJWT, async (req, res) => {
    try {
        const { workerId, jobId } = req.body;
        const employerId = req.user.userId;

        const job = await Job.findById(jobId);
        // Debug log for troubleshooting
        console.log('job.employer_id:', job?.employer_id?.toString(), 'employerId:', employerId, 'assignedFreelancer:', job?.assignedFreelancer?.toString(), 'workerId:', workerId);

        if (!job || job.employer_id.toString() !== employerId || job.assignedFreelancer.toString() !== workerId) {
            return res.status(403).json({ message: 'Not authorized to complete this job' });
        }

        // Mark job as completed
        job.status = 'completed';
        await job.save();

        // Update freelancer stats
        const freelancer = await User.findById(workerId);
        if (freelancer) {
            freelancer.jobsCompleted = (freelancer.jobsCompleted || 0) + 1;
            freelancer.jobsWon = (freelancer.jobsWon || 0) + 1;
            freelancer.activeJobs = Math.max(0, (freelancer.activeJobs || 0) - 1);
            await freelancer.save();
        }

        // Optionally update Application status
        const Application = require('./models/Application');
        await Application.updateOne(
            { jobId, freelancerId: workerId },
            { $set: { status: 'completed' } }
        );

        res.json({ message: 'Work marked as completed successfully' });
    } catch (err) {
        console.error('Error completing work:', err);
        res.status(500).json({ message: 'Error completing work' });
    }
}); 

// POST /api/reviews - Save a review and update freelancer's averageRating
app.post('/api/reviews', authenticateJWT, async (req, res) => {
    try {
        const { freelancerId, employerId, jobId, rating, reviewText } = req.body;
        if (!freelancerId || !employerId || !jobId || !rating || !reviewText) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
        }
        if (reviewText.length > 500) {
            return res.status(400).json({ message: 'Review too long.' });
        }
        // Only one review per job/employer
        const freelancer = await User.findById(freelancerId);
        if (!freelancer) return res.status(404).json({ message: 'Freelancer not found.' });
        const alreadyReviewed = freelancer.reviews.some(r => r.jobId?.toString() === jobId && r.employerId?.toString() === employerId);
        if (alreadyReviewed) {
            return res.status(400).json({ message: 'You have already reviewed this job.' });
        }
        // Add review
        freelancer.reviews.push({ employerId, rating, reviewText, jobId, timestamp: new Date() });
        // Update averageRating
        const ratings = freelancer.reviews.map(r => r.rating);
        freelancer.averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        await freelancer.save();
        res.json({ message: 'Review submitted successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Error saving review.' });
    }
}); 

// GET /api/reviews/:freelancerId - Fetch all reviews for a freelancer
app.get('/api/reviews/:freelancerId', async (req, res) => {
    try {
        const freelancer = await User.findById(req.params.freelancerId).populate('reviews.employerId', 'username companyName');
        if (!freelancer) return res.status(404).json({ message: 'Freelancer not found.' });
        res.json(freelancer.reviews || []);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching reviews.' });
    }
}); 

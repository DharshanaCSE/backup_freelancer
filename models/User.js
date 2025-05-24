const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userType: { type: String, required: true, enum: ['freelancer', 'employer'] },
    // Freelancer specific fields
    domain: String,
    skills: String,
    profile: String,
    portfolio: String,
    experience: { type: Number, default: 0 }, // Freelancer experience in years
    // Employer specific fields
    companyName: String,
    companyDescription: String,
    profileImageUrl: String,
    jobsCompleted: { type: Number, default: 0 },
    activeJobs: { type: Number, default: 0 },
    companySize: String,
    industry: String,
    location: String,
    jobsWon: { type: Number, default: 0 }, // Add jobsWon if not present
    totalHires: { type: Number, default: 0 }, // Track total hires for employers
    averageRating: { type: Number, default: 0 }, // Freelancer average rating
    reviews: [{
        employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        reviewText: String,
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
        timestamp: { type: Date, default: Date.now }
    }],
});

module.exports = mongoose.model('User', userSchema); 
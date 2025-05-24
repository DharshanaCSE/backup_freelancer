const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const Application = require('../models/Application');
const User = require('../models/User');

// Get number of active jobs for a freelancer
router.get('/active', auth, async (req, res) => {
    try {
        const { freelancerId } = req.query;
        if (!freelancerId) return res.status(400).json({ message: 'Freelancer ID is required' });
        const activeJobs = await Job.countDocuments({ assignedFreelancer: freelancerId, status: 'assigned' });
        res.json({ activeJobs });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching active jobs' });
    }
});

// Get number of completed jobs for a freelancer
router.get('/completed', auth, async (req, res) => {
    try {
        const { freelancerId } = req.query;
        if (!freelancerId) return res.status(400).json({ message: 'Freelancer ID is required' });
        const jobsCompleted = await Job.countDocuments({ assignedFreelancer: freelancerId, status: 'completed' });
        res.json({ jobsCompleted });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching completed jobs' });
    }
});

// Get details of active jobs for a freelancer
router.get('/active-details', auth, async (req, res) => {
    try {
        const { freelancerId } = req.query;
        if (!freelancerId) return res.status(400).json({ message: 'Freelancer ID is required' });
        const jobs = await Job.find({ assignedFreelancer: freelancerId, status: 'assigned' }).populate('employer_id', 'username companyName');
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
        res.status(500).json({ message: 'Error fetching active jobs details' });
    }
});

// Create a new job
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, budget, timeline, additional_info, employer_id, category } = req.body;
        if (!title || !description || !budget || !timeline || !employer_id || !category) {
            return res.status(400).json({ message: 'All required fields must be filled.' });
        }
        if (req.user.userType !== 'employer' || req.user.userId !== employer_id) {
            return res.status(403).json({ message: 'Unauthorized.' });
        }
        const job = new Job({
            employer_id,
            title,
            description,
            budget,
            timeline,
            additional_info,
            category
        });
        await job.save();
        res.status(201).json(job);
    } catch (err) {
        console.error('Job POST error:', err);
        res.status(500).json({ message: err.message || 'Server error.' });
    }
});

// Get all jobs for an employer
router.get('/:employer_id', auth, async (req, res) => {
    try {
        const { employer_id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(employer_id)) {
            return res.status(400).json({ message: 'Invalid employer ID.' });
        }
        if (req.user.userType !== 'employer' || req.user.userId !== employer_id) {
            return res.status(403).json({ message: 'Unauthorized.' });
        }
        const jobs = await Job.find({ employer_id, status: 'open' }).sort({ timestamp: -1 });
        res.json(jobs);
    } catch (err) {
        console.error('Job GET error:', err);
        res.status(500).json({ message: err.message || 'Server error.' });
    }
});

// Update a job
router.put('/:job_id', auth, async (req, res) => {
    try {
        const { job_id } = req.params;
        const { title, description, budget, timeline, additional_info, employer_id, category } = req.body;
        if (!mongoose.Types.ObjectId.isValid(job_id)) {
            return res.status(400).json({ message: 'Invalid job ID.' });
        }
        const job = await Job.findById(job_id);
        if (!job) return res.status(404).json({ message: 'Job not found.' });
        if (req.user.userType !== 'employer' || req.user.userId !== String(job.employer_id)) {
            return res.status(403).json({ message: 'Unauthorized.' });
        }
        job.title = title;
        job.description = description;
        job.budget = budget;
        job.timeline = timeline;
        job.additional_info = additional_info;
        job.category = category;
        await job.save();
        res.json(job);
    } catch (err) {
        console.error('Job PUT error:', err);
        res.status(500).json({ message: err.message || 'Server error.' });
    }
});

// Delete a job
router.delete('/:job_id', auth, async (req, res) => {
    try {
        const { job_id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(job_id)) {
            return res.status(400).json({ message: 'Invalid job ID.' });
        }
        const job = await Job.findById(job_id);
        if (!job) return res.status(404).json({ message: 'Job not found.' });
        if (req.user.userType !== 'employer' || req.user.userId !== String(job.employer_id)) {
            return res.status(403).json({ message: 'Unauthorized.' });
        }
        await job.deleteOne();
        res.json({ message: 'Job deleted.' });
    } catch (err) {
        console.error('Job DELETE error:', err);
        res.status(500).json({ message: err.message || 'Server error.' });
    }
});

// Apply for a job
router.post('/apply', auth, async (req, res) => {
    try {
        const { jobId } = req.body;
        if (!jobId) {
            return res.status(400).json({ message: 'Job ID is required.' });
        }
        if (req.user.userType !== 'freelancer') {
            return res.status(403).json({ message: 'Only freelancers can apply for jobs.' });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found.' });
        }

        // Check if already applied
        const existing = await Application.findOne({ jobId, freelancerId: req.user.userId });
        if (existing) {
            return res.status(400).json({ message: 'Already applied to this job.' });
        }

        // Save application
        await Application.create({ jobId, freelancerId: req.user.userId, status: 'active' });

        res.json({ message: 'Application submitted successfully.' });
    } catch (err) {
        console.error('Job application error:', err);
        res.status(500).json({ message: err.message || 'Server error.' });
    }
});

// Get applicants for a job (for employer view)
router.get('/:job_id/applicants', auth, async (req, res) => {
    try {
        const { job_id } = req.params;
        console.log('Applicants route hit! job_id:', job_id);
        if (!mongoose.Types.ObjectId.isValid(job_id)) {
            console.log('Invalid job ID');
            return res.status(400).json({ message: 'Invalid job ID.' });
        }
        const job = await Job.findById(job_id);
        if (!job) {
            console.log('Job not found');
            return res.status(404).json({ message: 'Job not found.' });
        }
        console.log('job.employer_id:', job.employer_id, 'req.user.userId:', req.user.userId, 'userType:', req.user.userType);
        if (req.user.userType !== 'employer' || String(req.user.userId) !== String(job.employer_id)) {
            console.log('Unauthorized: userType or employer_id mismatch');
            return res.status(403).json({ message: 'Unauthorized.' });
        }
        const applications = await Application.find({ jobId: job_id }).populate('freelancerId', 'username email domain skills profile portfolio');
        console.log('Applications found:', applications.length);
        res.json(applications);
    } catch (err) {
        console.error('Error fetching applicants:', err);
        res.status(500).json({ message: err.message || 'Server error.' });
    }
});

// Mark a job as completed for a freelancer (employer only)
router.post('/mark-completed', auth, async (req, res) => {
    try {
        const { jobId, freelancerId } = req.body;
        if (!jobId || !freelancerId) return res.status(400).json({ message: 'Job ID and freelancer ID are required.' });
        if (req.user.userType !== 'employer') return res.status(403).json({ message: 'Only employers can mark jobs as completed.' });
        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ message: 'Job not found.' });
        if (String(job.employer_id) !== String(req.user.userId)) return res.status(403).json({ message: 'Unauthorized. You do not own this job.' });
        const application = await Application.findOne({ jobId, freelancerId });
        if (!application) return res.status(404).json({ message: 'Application not found.' });
        if (application.status === 'completed') return res.status(400).json({ message: 'Job already marked as completed.' });
        application.status = 'completed';
        await application.save();
        res.json({ message: 'Job marked as completed for freelancer.' });
    } catch (err) {
        res.status(500).json({ message: err.message || 'Server error.' });
    }
});

// Accept an applicant for a job (employer only)
router.post('/accept-applicant', auth, async (req, res) => {
    try {
        const { jobId, freelancerId } = req.body;
        if (!jobId || !freelancerId) return res.status(400).json({ message: 'Job ID and freelancer ID are required.' });
        if (req.user.userType !== 'employer') return res.status(403).json({ message: 'Only employers can accept applicants.' });

        // Find the job and check ownership
        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ message: 'Job not found.' });
        if (String(job.employer_id) !== String(req.user.userId)) return res.status(403).json({ message: 'Unauthorized.' });

        // Set job status and assigned freelancer
        job.status = 'assigned';
        job.assignedFreelancer = freelancerId;
        await job.save();

        // Update freelancer's active jobs count
        const freelancer = await User.findById(freelancerId);
        if (!freelancer) return res.status(404).json({ message: 'Freelancer not found.' });
        
        // Increment active jobs count
        freelancer.activeJobs = (freelancer.activeJobs || 0) + 1;
        await freelancer.save();

        // Increment employer's totalHires
        await User.findByIdAndUpdate(job.employer_id, { $inc: { totalHires: 1 } });

        // Update application status
        await Application.updateOne(
            { jobId, freelancerId },
            { $set: { status: 'active' } }
        );

        // Remove other applications for this job
        await Application.deleteMany({
            jobId,
            freelancerId: { $ne: freelancerId }
        });

        // Increment jobsWon for the freelancer
        await User.findByIdAndUpdate(freelancerId, { $inc: { jobsWon: 1 } });

        // Send notification to freelancer
        try {
            const Notification = require('../models/Notification');
            await Notification.create({
                recipient: freelancerId,
                sender: req.user.userId,
                type: 'job_accepted',
                message: `Your application for "${job.title}" has been accepted!`,
                jobId: jobId
            });
        } catch (e) {
            console.error('Error creating notification:', e);
        }

        res.json({
            message: 'Applicant accepted successfully.',
            worker: {
                _id: freelancer._id,
                username: freelancer.username,
                domain: freelancer.domain,
                skills: freelancer.skills,
                currentJob: job.title,
                jobId: job._id
            }
        });
    } catch (err) {
        console.error('Error accepting applicant:', err);
        res.status(500).json({ message: err.message || 'Server error.' });
    }
});

module.exports = router; 
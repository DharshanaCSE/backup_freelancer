const mongoose = require('mongoose');

const JobApplicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'active' },
  appliedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JobApplication', JobApplicationSchema); 
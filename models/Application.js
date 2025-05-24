const mongoose = require('mongoose');
const { Schema } = mongoose;

const ApplicationSchema = new Schema({
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    appliedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'completed'], default: 'active' }
});

module.exports = mongoose.model('Application', ApplicationSchema); 
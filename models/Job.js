const mongoose = require('mongoose');
const { Schema } = mongoose;

const JobSchema = new Schema({
    employer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    budget: { type: Number, required: true, min: 0 },
    timeline: { type: Number, required: true, min: 1 }, // in days
    additional_info: { type: String },
    category: { type: String },
    timestamp: { type: Date, default: Date.now },
    assignedFreelancer: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, default: 'open' }
});

module.exports = mongoose.model('Job', JobSchema); 
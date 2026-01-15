const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  candidateName: {
    type: String,
    required: [true, 'Please add a candidate name']
  },
  jobDescription: {
    type: String
  },
  originalText: {
    type: String
  },
  htmlContent: {
    type: String,
    required: [true, 'Please add HTML content']
  },
  templateId: {
    type: String,
    default: 'sourabh'
  },
  feedback: {
    score: Number,
    improvements: [String],
    suggestedKeywords: [String],
    redFlags: [String],
    jdMatchAnalysis: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resume', ResumeSchema);

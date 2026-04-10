const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.ObjectId, ref: 'Assignment', required: true },
    student: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    fileUrl: String,
    originalName: String,
    status: { type: String, enum: ['turned_in', 'graded'], default: 'turned_in' },
    grade: Number,
  },
  { timestamps: true }
);

// Match student and assignment unique combination
submissionSchema.index({ student: 1, assignment: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);

const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    class: {
      type: mongoose.Schema.ObjectId,
      ref: 'Class',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Ensure a student can only enroll in a class once
enrollmentSchema.index({ student: 1, class: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);

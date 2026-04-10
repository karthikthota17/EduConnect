const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.ObjectId, ref: 'Class', required: true },
    title: { type: String, required: [true, 'Please add a title'] },
    description: String,
    points: { type: Number, default: 100 },
    dueDate: Date,
    fileUrl: String, 
    originalName: String, 
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);

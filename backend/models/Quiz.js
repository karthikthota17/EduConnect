const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true }
});

const quizSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.ObjectId, ref: 'Class', required: true },
    title: { type: String, required: [true, 'Please add a title'] },
    description: String,
    duration: { type: Number, default: 30 },
    questions: [questionSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);

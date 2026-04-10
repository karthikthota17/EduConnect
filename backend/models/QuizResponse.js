const mongoose = require('mongoose');

const quizResponseSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.ObjectId, ref: 'Quiz', required: true },
    student: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    answers: [{ type: Number }], // Parallel array matching quiz.questions indices
    score: Number,
  },
  { timestamps: true }
);

quizResponseSchema.index({ student: 1, quiz: 1 }, { unique: true });

module.exports = mongoose.model('QuizResponse', quizResponseSchema);

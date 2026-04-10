const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.ObjectId, ref: 'Class', required: true },
    date: { type: Date, required: true },
    token: { type: String, required: true, unique: true }, // For QR validation
    isActive: { type: Boolean, default: true },
    presentStudents: [{ type: mongoose.Schema.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);

const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.ObjectId, ref: 'Class', required: true },
    author: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);

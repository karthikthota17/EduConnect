const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);

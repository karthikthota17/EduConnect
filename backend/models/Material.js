const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.ObjectId, ref: 'Class', required: true },
    title: { type: String, required: [true, 'Please add a title'] },
    description: String,
    type: { type: String, enum: ['document', 'video', 'link'], default: 'document' },
    url: String, // Can be local path if uploaded, or external link
    originalName: String, // Store original filename for display
  },
  { timestamps: true }
);

module.exports = mongoose.model('Material', materialSchema);

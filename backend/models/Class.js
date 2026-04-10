const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a class name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    teacher: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    code: {
      type: String,
      unique: true,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Class', classSchema);

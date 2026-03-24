const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    service: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      trim: true
    },
    slots: {
      type: [String],
      default: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']
    },
    isOpen: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

availabilitySchema.index({ service: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Availability', availabilitySchema);
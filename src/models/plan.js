const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  planCode: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  uploadsPerServer: {
    type: Number,
    required: true,
  },
  autoscale: {
    type: Boolean,
    required: true,
  },
});

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;

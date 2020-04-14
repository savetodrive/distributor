const mongoose = require('mongoose');
const timestamps = require('mongoose-timestamp');

const { Schema } = mongoose;

const serverSchema = new Schema({
  hostname: {
    type: String,
    required: true,
    unique: true,
  },
  runningUploadsCount: {
    type: Number,
    default: 0,
  },
  plan: {
    type: Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
  },
  state: {
    type: String,
    enum: ['running', 'building', 'terminating', 'archived', 'sleeping'],
  },
  cloudServerId: {
    type: String,
    required: true,
  },
  // the version of the image that was used to create the uploader server
  image: {
    type: Schema.Types.ObjectId,
    ref: 'ServerImage',
    required: true,
  },
  // the version of the uploader server that is running
  // currentVersion >= initial image's version
  currentVersion: {
    type: Number,
    required: true,
  },
});

serverSchema.plugin(timestamps);

const Server = mongoose.model('Server', serverSchema);

module.exports = Server;

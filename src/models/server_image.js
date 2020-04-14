const mongoose = require('mongoose');
const timestamps = require('mongoose-timestamp');

const Counter = require('./counter');

const { Schema } = mongoose;

const serverImageSchema = new Schema({
  imageId: {
    type: Number,
    required: true,
  },
  state: {
    type: String,
    required: true,
    enum: ['stable', 'beta', 'archived'],
  },
  version: {
    type: Number,
    required: true,
  },
});

// TODO: Checkout this for upsert:
// https://docs.mongodb.com/manual/reference/method/db.collection.findAndModify/#upsert-and-unique-index
serverImageSchema.pre('save', (next) => {
  Counter.findByIdAndUpdate('ServerImage', { $inc: { seq: 1 } }, { upsert: true, new: true }, (error, counter) => {
    if (error) {
      return next(error);
    }

    this.version = counter.seq;
    return next();
  });
});


serverImageSchema.plugin(timestamps);

const Server = mongoose.model('ServerImage', serverImageSchema, 'server_images');

module.exports = Server;

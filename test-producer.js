process.chdir(__dirname);
require('dotenv').config();

const kue = require('kue');
const constants = require('./src/constants');

const { env } = process;

const queue = kue.createQueue({
  prefix: 'std_q',
  jobEvents: false,
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    auth: env.REDIS_PASSWORD,
  },
});

queue
  .create(constants.MAIN_UPLOAD_QUEUE, {
    hello: 'hello',
  })
  .save();

const kue = require('kue-scheduler');
const config = require('../config');

module.exports = () => kue.createQueue({
  jobEvents: false,
  prefix: process.env.QUEUE_PREFIX,
  redis: {
    ...config.database.redis,
    options: {
      // see https://github.com/mranney/node_redis#rediscreateclient
    },
  },
});

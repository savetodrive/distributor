require('dotenv').config();
require('should');

const redis = require('redis');
const { promisify } = require('util');
const mongoose = require('mongoose');

const container = require('../../src/container');

global.setTimeoutPromise = promisify(setTimeout);

let redisClient;

before(async () => {
  process.env.MONGO_DB = 'test_std_distributor';
  process.env.NODE_ENV = 'test';
  process.env.REDIS_DB = 1;
  require('../../src/index'); // eslint-disable-line
  const config = require('../../src/config'); // eslint-disable-line
  redisClient = redis.createClient(config.database.redis);

  // await mongoose.connection.dropDatabase();
  await promisify(redisClient.flushdb.bind(redisClient))();
});

after(async () => {
  // await mongoose.connection.dropDatabase();
  await promisify(redisClient.flushdb.bind(redisClient))();
  await promisify(container.queue.shutdown.bind(container.queue))(500);
});

module.exports = {
  database: {
    mongo: {
      host: process.env.MONGO_HOST,
      db: process.env.MONGO_DB,
      user: process.env.MONGO_USER,
      password: process.env.MONGO_PASSWORD,
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      auth: process.env.REDIS_PASSWORD,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
    },
  },
  app: {
    maxDistributionAttempt: 10,
    queue_prefix: process.env.QUEUE_PREFIX || 'q',
  },
};

const { promisify } = require('util');
const kue = require('kue');
const pLimit = require('p-limit');

const constants = require('../constants');
const container = require('../container');
const Server = require('../models/server');
const utils = require('../utils');

module.exports = (queue) => {
  queue.process(constants.SYNC_UPLOADS_COUNT, 100, async (job, done) => {
    utils.debug('Received job in sync_uploads_count queue');
    const { count, uploaderServerHostname } = job.data;
    if (count === 0) {
      const ids = await promisify(kue.redis.client().zrange.bind(kue.redis.client()))(
        kue.redis.client().getKey(`jobs:${utils.getServerQueue(uploaderServerHostname)}:active`),
        0,
        -1,
      );

      await Promise.all(Array.from(ids).map(id =>
        pLimit(20)(async () => {
          try {
            const parsedId = kue.redis.client().stripFIFO(id);
            kue.Job.removeBadJob(parsedId);
            await promisify(kue.Job.remove)(parsedId);
          } catch (e) {
            container.logger.warn(e);
          }
        })));
    }

    await Server.update(
      { hostname: job.data.uploaderServerHostname },
      { $set: { runningUploadsCount: count }, $inc: { __v: 1 } },
    );
    utils.debug('Finished handling sync_uploads_count queue');
    done();
  });
};

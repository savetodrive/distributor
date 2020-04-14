const constants = require('../constants');
const container = require('../container');
const Server = require('../models/server');
const utils = require('../utils');

module.exports = (queue) => {
  queue.process(constants.TERMINATE_UPLOADS_QUEUE, 100, async (job, done) => {
    utils.debug('Received data in uploads terminate queue');
    await Promise.all(job.data.ids.map(async (jobId) => {
      try {
        const uploadJob = await utils.getJob(jobId);
        await utils.removeJob(uploadJob);
      } catch (err) {
        container.logger.error(err);
      }
    }));

    try {
      // don't validate __v here because we want to reduce runningUploadsCount forcibly
      await Server.update(
        { hostname: job.data.uploaderServerHostname },
        { $inc: { runningUploadsCount: (-1) * job.data.uploadsCount, __v: 1 } },
      );
      utils.debug('Finished handling uploads terminate queue');
    } catch (err) {
      container.logger.error(err);
    }
    done();
  });
};

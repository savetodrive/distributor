const constants = require('../constants');
const container = require('../container');
const Server = require('../models/server');
const utils = require('../utils');

module.exports = (queue) => {
  queue.process(constants.FINISH_UPLOAD_QUEUE, 100, async (job, done) => {
    utils.debug('Received data in upload finish queue');
    const uploadJob = await utils.getJob(job.data.id);

    try {
      await utils.removeJob(uploadJob);
    } catch (err) {
      container.logger.error(err);
    }

    if (uploadJob.data.__distributor && uploadJob.data.__distributor.uploaderServerId) {
      utils.debug('Upload complete!');

      try {
        // don't validate __v here because we want to reduce runningUploadsCount forcibly
        await Server.update(
          { _id: uploadJob.data.__distributor.uploaderServerId },
          { $inc: { runningUploadsCount: -1, __v: 1 } },
        );
        utils.debug('Finished handling upload finish queue');
      } catch (err) {
        container.logger.error(err);
      }
    }
    done();
  });
};

const constants = require('../constants');

const uploaderCloudDriverFactory = require('../services/uploader_cloud_driver/factory');
const Server = require('../models/server');

const uploaderCloudDriver = uploaderCloudDriverFactory.create();

module.exports = (queue) => {
  queue.process(constants.KILL_UPLOADER, 10, async (job, done) => {
    await uploaderCloudDriver.destroy(job.data.hostname);
    await Server.deleteOne({ hostname: job.data.hostname }).exec();
    done();
  });
};

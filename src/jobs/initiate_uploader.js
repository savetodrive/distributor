const constants = require('../constants');
const Server = require('../models/server');
const utils = require('../utils');

module.exports = (queue) => {
  queue.process(constants.INITIATE_UPLOADER, 10, async (job, done) => {
    const { uploaderServerHostname } = job.data;

    utils.debug(`Initiating uploader ${uploaderServerHostname}`);

    await Server.updateOne(
      { hostname: uploaderServerHostname, state: { $in: ['sleeping', 'building'] } },
      { state: 'running', runningUploadsCount: 0 },
    );
    done();
  });
};

const constants = require('../constants');
const Server = require('../models/server');
const utils = require('../utils');

module.exports = (queue) => {
  queue.process(constants.SLEEP_UPLOADER, 10, async (job, done) => {
    const { uploaderServerHostname } = job.data;

    utils.debug(`Sleeping uploader ${uploaderServerHostname}`);

    await Server.updateOne(
      { hostname: uploaderServerHostname, state: 'running' },
      { state: 'sleeping', runningUploadsCount: 0 },
    );
    done();
  });
};

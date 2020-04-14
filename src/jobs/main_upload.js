const mongoose = require('mongoose');

const constants = require('../constants');
const container = require('../container');
const Server = require('../models/server');
const Plan = require('../models/plan');
const config = require('../config');
const utils = require('../utils');

module.exports = (queue) => {
  queue.process(constants.MAIN_UPLOAD_QUEUE, 100, async (job, done) => {
    utils.debug('Received upload request in main queue');

    const determineServer = async () => {
      const plan = await Plan.findOne({ active: true, planCode: job.data.plan_code });

      const server = await Server.findOne({ state: 'running', plan: plan._id }).sort({ runningUploadsCount: 'asc' });

      utils.debug(`Routed upload request to server host ${server.hostname}`);

      server.runningUploadsCount += 1;
      server.increment();
      await server.save();

      queue
        .create(utils.getServerQueue(server.hostname), {
          ...job.data,
          __distributor: { uploaderServerId: server._id },
        })
        .save(done);
    };

    for (let attempt = 0; attempt < config.app.maxDistributionAttempt; attempt += 1) {
      try {
        await determineServer(); // eslint-disable-line no-await-in-loop
        break;
      } catch (error) {
        if (!(error instanceof mongoose.Error.VersionError)) {
          container.logger.error(error);
          return;
        }
      }
    }
  });
};

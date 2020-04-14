const { countServersToBuild, countServersToDestroy } = require('../services/autoscale_calculator');
const constants = require('../constants');
const Plan = require('../models/plan');
const Server = require('../models/server');
const serverCreator = require('../services/server_creator');
const serverRemover = require('../services/server_remover');
const utils = require('../utils');

module.exports = (queue) => {
  const jobInstance = queue
    .createJob(constants.CHECK_SERVER_DEFICIENCY)
    .attempts(3)
    .priority('high')
    .unique('unique_every');

  if (process.env.AUTOSCALE_UPLOADER === 'true' && process.env.NODE_ENV === 'production') {
    queue.every(`${process.env.SERVER_AUTOSCALE_CHECK_INTERVAL_SECONDS || 2} seconds`, jobInstance);
  } else if (process.env.AUTOSCALE_UPLOADER === 'true' && process.env.NODE_ENV === 'development') {
    setInterval(() => {
      queue.create(constants.CHECK_SERVER_DEFICIENCY, {}).removeOnComplete(true).save();
    }, (process.env.SERVER_AUTOSCALE_CHECK_INTERVAL_SECONDS || 2) * 1000);
  }

  queue.process(constants.CHECK_SERVER_DEFICIENCY, 1, async (job, done) => {
    const plans = await Plan.find({ active: true, autoscale: true }).exec();
    await Promise.all(plans.map(async (plan) => {
      utils.debug(`Plan Code: ${plan.planCode}`);

      let actualUploadsCount = (await Server.aggregate([
        { $match: { plan: plan._id } },
        {
          $group: {
            _id: 0,
            total: { $sum: '$runningUploadsCount' },
          },
        },
      ]).exec())[0];

      if (!actualUploadsCount) {
        actualUploadsCount = 0;
      } else {
        actualUploadsCount = actualUploadsCount.total;
      }

      const activeServerCount = await Server.count({ plan: plan._id, state: 'running' });
      utils.debug(`Actual Uploads Count: ${actualUploadsCount}`);
      utils.debug(`Active Server Count: ${activeServerCount}`);

      const serversToCreateCount = await countServersToBuild(
        activeServerCount,
        actualUploadsCount,
        plan,
      );
      utils.debug(`Servers to create: ${serversToCreateCount}`);

      if (serversToCreateCount > 0) {
        const promises = [];
        for (let i = 0; i < serversToCreateCount; i += 1) {
          promises.push(serverCreator.create(plan));
        }

        return Promise.all(promises);
      }

      const serversToDestroyCount = await countServersToDestroy(
        activeServerCount + await (Server.count({ plan: plan._id, state: 'building' })),
        actualUploadsCount,
        plan,
      );
      utils.debug(`Servers to destroy: ${serversToDestroyCount}`);

      if (serversToDestroyCount === 0) {
        return Promise.resolve();
      }

      return serverRemover.remove(plan, serversToDestroyCount);
    }));
    done();
  });
};

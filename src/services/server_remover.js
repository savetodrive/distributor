const { promisify } = require('util');

const constants = require('../constants');
const container = require('../container');
const Server = require('../models/server');
const utils = require('../utils');
const uploaderCloudDriverFactory = require('../services/uploader_cloud_driver/factory');

const uploaderCloudDriver = uploaderCloudDriverFactory.create();

exports.remove = async (plan, serversToDestroyCount) => {
  const buildingServersToDestroy = await Server.find({ plan: plan._id, state: 'building' })
    .limit(serversToDestroyCount)
    .exec();

  if (buildingServersToDestroy.length) {
    await Promise.all(buildingServersToDestroy.map(async (server) => {
      await uploaderCloudDriver.destroy(server.cloudServerId);
      await Server.deleteOne({ hostname: server.hostname }).exec();
    }));
  }

  utils.debug(`Building servers destroyed: ${buildingServersToDestroy.length}`);

  const remainingServersCount = serversToDestroyCount - buildingServersToDestroy.length;
  if (remainingServersCount === 0) {
    return Promise.resolve();
  }

  utils.debug(`Active servers to destroy: ${remainingServersCount}`);

  const serversToDestroy = await Server.find({ plan: plan._id, state: 'running' })
    .sort({ runningUploadsCount: 'asc' })
    .limit(remainingServersCount)
    .exec();

  return Promise.all(serversToDestroy.map(async (server) => {
    await server.update({ state: 'terminating' }).exec();
    const terminateServerJob = container.queue.create(`${constants.TERMINATE_UPLOADER}_${server.hostname}`, {});
    await promisify(terminateServerJob.save.bind(terminateServerJob))();
  }));
};

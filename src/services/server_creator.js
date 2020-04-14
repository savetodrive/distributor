const uniqid = require('uniqid');

const Server = require('../models/server');
const ServerImage = require('../models/server_image');
const uploaderCloudDriverFactory = require('./uploader_cloud_driver/factory');

const uploaderCloudDriver = uploaderCloudDriverFactory.create();

exports.create = async (plan) => {
  const hostname = `uploader-${plan.planCode}-${uniqid()}`;

  const image = await ServerImage.findOne({ state: 'stable' }).exec();

  const cloudServerId = await uploaderCloudDriver.create(hostname, image.imageId);

  const server = new Server({
    hostname,
    plan,
    state: 'building',
    cloudServerId,
    image,
    currentVersion: image.version,
  });

  await server.save();

  return server;
};

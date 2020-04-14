const container = require('../../../src/container');
const Server = require('../../../src/models/server');
const ServerImage = require('../../../src/models/server_image');
const Plan = require('../../../src/models/plan');
const constants = require('../../../src/constants');

describe('Main upload', () => {
  let image;

  before(async () => {
    image = new ServerImage({
      imageId: 234,
      state: 'stable',
      version: 1,
    });
    await image.save();
  });

  it('should send upload job to uploader with lowest uploads when it is the first uploader ', async () => {
    const plan1 = new Plan({
      planCode: 'premium',
      active: true,
      uploadsPerServer: 5,
      autoscale: false,
    });
    await plan1.save();

    const server1 = new Server({
      hostname: 'uploader_host1',
      runningUploadsCount: 5,
      state: 'running',
      plan: plan1,
      image,
      currentVersion: image.version,
      cloudServerId: 'server1',
    });
    await server1.save();
    const server2 = new Server({
      hostname: 'uploader_host2',
      runningUploadsCount: 7,
      state: 'running',
      plan: plan1,
      image,
      currentVersion: image.version,
      cloudServerId: 'server2',
    });
    await server2.save();
    container.queue.create(constants.MAIN_UPLOAD_QUEUE, { url: 'some url', plan_code: 'premium' }).save();
    return new Promise((resolve, reject) => {
      container.queue.process(`${constants.SERVER_UPLOAD_QUEUE_PREFIX}_uploader_host1`, 1, async () => {
        const updatedServer = await Server.findOne({ hostname: 'uploader_host1' });
        updatedServer.runningUploadsCount.should.be.exactly(6);
        resolve();
      });
      setTimeout(reject, 200);
    });
  });

  it('should send upload job to uploader with lowest uploads when it is the last uploader ', async () => {
    const plan1 = new Plan({
      planCode: 'premium',
      active: true,
      uploadsPerServer: 5,
      autoscale: false,
    });
    await plan1.save();

    const server1 = new Server({
      hostname: 'uploader_host1',
      runningUploadsCount: 12,
      state: 'running',
      plan: plan1,
      image,
      currentVersion: image.version,
      cloudServerId: 'server1',
    });
    await server1.save();
    const server2 = new Server({
      hostname: 'uploader_host2',
      runningUploadsCount: 7,
      state: 'running',
      plan: plan1,
      image,
      currentVersion: image.version,
      cloudServerId: 'server2',
    });
    await server2.save();
    container.queue.create(constants.MAIN_UPLOAD_QUEUE, { url: 'some url', plan_code: 'premium' }).save();
    return new Promise((resolve, reject) => {
      container.queue.process(`${constants.SERVER_UPLOAD_QUEUE_PREFIX}_uploader_host2`, 1, resolve);
      setTimeout(reject, 200);
    });
  });

  it('should send upload job to uploader with matching plan ', async () => {
    const plan1 = new Plan({
      planCode: 'premium',
      active: true,
      uploadsPerServer: 5,
      autoscale: false,
    });
    await plan1.save();

    const plan2 = new Plan({
      planCode: 'enterprise',
      active: true,
      uploadsPerServer: 5,
      autoscale: false,
    });
    await plan2.save();

    const server1 = new Server({
      hostname: 'uploader_host1',
      runningUploadsCount: 12,
      state: 'running',
      plan: plan1,
      image,
      currentVersion: image.version,
      cloudServerId: 'server1',
    });
    await server1.save();
    const server2 = new Server({
      hostname: 'uploader_host2',
      runningUploadsCount: 7,
      state: 'running',
      plan: plan2,
      image,
      currentVersion: image.version,
      cloudServerId: 'server2',
    });
    await server2.save();
    container.queue.create(constants.MAIN_UPLOAD_QUEUE, { url: 'some url', plan_code: 'premium' }).save();
    return new Promise((resolve, reject) => {
      container.queue.process(`${constants.SERVER_UPLOAD_QUEUE_PREFIX}_uploader_host1`, 1, resolve);
      setTimeout(reject, 200);
    });
  });

  it('should send upload job to running uploader', async () => {
    const plan1 = new Plan({
      planCode: 'premium',
      active: true,
      uploadsPerServer: 5,
      autoscale: false,
    });
    await plan1.save();

    const server1 = new Server({
      hostname: 'uploader_host1',
      runningUploadsCount: 12,
      state: 'running',
      plan: plan1,
      image,
      currentVersion: image.version,
      cloudServerId: 'server1',
    });
    await server1.save();
    const server2 = new Server({
      hostname: 'uploader_host2',
      runningUploadsCount: 7,
      state: 'terminating',
      plan: plan1,
      image,
      currentVersion: image.version,
      cloudServerId: 'server2',
    });
    await server2.save();
    container.queue.create(constants.MAIN_UPLOAD_QUEUE, { url: 'some url', plan_code: 'premium' }).save();
    return new Promise((resolve, reject) => {
      container.queue.process(`${constants.SERVER_UPLOAD_QUEUE_PREFIX}_uploader_host1`, 1, resolve);
      setTimeout(reject, 200);
    });
  });

  afterEach(() => Promise.all([Server.remove({}), Plan.remove({})]));

  after(() => ServerImage.remove({}));
});

const { promisify } = require('util');

const container = require('../../../src/container');
const Server = require('../../../src/models/server');
const ServerImage = require('../../../src/models/server_image');
const Plan = require('../../../src/models/plan');
const constants = require('../../../src/constants');

const setTimeoutPromise = promisify(setTimeout);

describe('Check Server Deficiency', () => {
  let image;

  before(async () => {
    image = new ServerImage({
      imageId: 123,
      state: 'stable',
      version: 1,
    });
    await image.save();
  });

  it('should add new servers when there is server outage', async () => {
    process.env.SERVER_DEFICIENCY_PERCENT = 70;
    process.env.SERVER_EXCESS_PERCENT = 65;

    const plan1 = new Plan({
      planCode: 'premium',
      active: true,
      uploadsPerServer: 5,
      autoscale: true,
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

    container.queue.create(constants.CHECK_SERVER_DEFICIENCY, {}).save();

    // Waiting for the job to be processed
    await setTimeoutPromise(50);
    (await Server.count({ state: 'building' }).exec()).should.be.exactly(2);

    // Capable uploads count = 2 * 5 = 10
    // Actual uploads count = 5 + 7 = 12
    // 70% of x = 12
    // x = 17.17
    // so we need to add 2 servers
  });

  it('should add one just new server when there is no server', async () => {
    const plan1 = new Plan({
      planCode: 'premium',
      active: true,
      uploadsPerServer: 5,
      autoscale: true,
    });
    await plan1.save();

    container.queue.create(constants.CHECK_SERVER_DEFICIENCY, {}).save();

    await setTimeoutPromise(50);
    (await Server.count({ state: 'building' }).exec()).should.be.exactly(1);
  });

  it('should remove all building servers and no running server if the amount of excess servers matches the building servers count', async () => {
    process.env.SERVER_DEFICIENCY_PERCENT = 70;
    process.env.SERVER_EXCESS_PERCENT = 65;

    const plan1 = new Plan({
      planCode: 'premium',
      active: true,
      uploadsPerServer: 8,
      autoscale: true,
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
      runningUploadsCount: 5,
      state: 'running',
      plan: plan1,
      image,
      currentVersion: image.version,
      cloudServerId: 'server2',
    });
    await server2.save();

    const server3 = new Server({
      hostname: 'uploader_host3',
      runningUploadsCount: 4,
      state: 'running',
      plan: plan1,
      image,
      currentVersion: image.version,
      cloudServerId: 'server3',
    });
    await server3.save();

    const server4 = new Server({
      hostname: 'uploader_host4',
      runningUploadsCount: 4,
      state: 'running',
      plan: plan1,
      image,
      currentVersion: image.version,
      cloudServerId: 'server4',
    });
    await server4.save();

    const server5 = new Server({
      hostname: 'uploader_host5',
      runningUploadsCount: 0,
      state: 'building',
      plan: plan1,
      image,
      currentVersion: image.version,
      cloudServerId: 'server5',
    });
    await server5.save();

    container.queue.create(constants.CHECK_SERVER_DEFICIENCY, {}).save();

    // Waiting for the job to be processed
    await setTimeoutPromise(50);
    (await Server.count({ state: 'building' }).exec()).should.be.exactly(0);
    (await Server.count({ state: 'running' }).exec()).should.be.exactly(4);
  });

  it('should remove all building servers and remaninig running server with lowest uploads if the amount of excess servers is more the building servers count', async () => {
    process.env.SERVER_DEFICIENCY_PERCENT = 70;
    process.env.SERVER_EXCESS_PERCENT = 65;

    const plan1 = new Plan({
      planCode: 'premium',
      active: true,
      uploadsPerServer: 8,
      autoscale: true,
    });
    await plan1.save();

    const server1 = new Server({
      hostname: 'uploader_host1',
      runningUploadsCount: 3,
      state: 'running',
      plan: plan1,
      image,
      currentVersion: image.version,
      cloudServerId: 'server1',
    });
    await server1.save();

    const server2 = new Server({
      hostname: 'uploader_host2',
      runningUploadsCount: 4,
      state: 'running',
      plan: plan1,
      image,
      currentVersion: image.version,
      cloudServerId: 'server2',
    });
    await server2.save();

    const server3 = new Server({
      hostname: 'uploader_host3',
      runningUploadsCount: 2,
      state: 'running',
      plan: plan1,
      image,
      currentVersion: image.version,
      cloudServerId: 'server3',
    });
    await server3.save();

    const server4 = new Server({
      hostname: 'uploader_host4',
      runningUploadsCount: 0,
      state: 'building',
      plan: plan1,
      image,
      currentVersion: image.version,
      cloudServerId: 'server4',
    });
    await server4.save();

    container.queue.create(constants.CHECK_SERVER_DEFICIENCY, {}).save();

    await setTimeoutPromise(50);
    (await Server.count({ state: 'building' }).exec()).should.be.exactly(0);
    (await Server.count({ state: 'running' }).exec()).should.be.exactly(2);
    (await Server.findOne({ hostname: 'uploader_host3' }).exec()).state.should.be.exactly('terminating');

    return new Promise((resolve, reject) => {
      container.queue.process(`${constants.TERMINATE_UPLOADER}_uploader_host3`, 1, async () => {
        resolve();
      });
      setTimeout(reject, 200);
    });
  });

  afterEach(() => Promise.all([Server.remove({}), Plan.remove({})]));

  after(() => ServerImage.remove({}));
});

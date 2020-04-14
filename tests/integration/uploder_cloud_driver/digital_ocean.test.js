const digitalOcean = require('../../../src/services/uploader_cloud_driver/digital_ocean');

const { UPLOADER_CLOUD_DRIVER } = process.env;

describe('Digital Ocean Uploader Cloud Driver', () => {
  if (UPLOADER_CLOUD_DRIVER !== 'digital_ocean') {
    return;
  }

  it('should create and drop droplets', async function() { // eslint-disable-line
    this.timeout(70000);
    const dropletId = await digitalOcean.create('test-1');

    JSON.parse(await digitalOcean.find(dropletId)).droplet.status.should.be.exactly('new');
    await global.setTimeoutPromise(10);
    await digitalOcean.destroy(dropletId);

    // JSON.parse(await digitalOcean.find(dropletId)).droplet.status.should.be.exactly('archive');
  });
});

const sandbox = require('sinon').createSandbox();
const autoscaleCalculator = require('../../src/services/autoscale_calculator');
const Server = require('../../src/models/server');

describe('Autoscale calculator', () => {
  it('should return one when there is no server', async () => {
    sandbox.stub(Server, 'count')
      .withArgs({ plan: 'plan1', state: 'building' })
      .resolves(0);

    (await autoscaleCalculator.countServersToBuild(0, 0, { _id: 'plan1' })).should.be.exactly(1);
  });

  it('should return zero when there is no servers and 1 building server', async () => {
    sandbox.stub(Server, 'count')
      .withArgs({ plan: 'plan1', state: 'building' })
      .resolves(1);

    (await autoscaleCalculator.countServersToBuild(0, 0, { _id: 'plan1' })).should.be.exactly(0);
  });

  it('should calculate required servers when there is server deficiency and no servers are building', async () => {
    process.env.SERVER_DEFICIENCY_PERCENT = 70;
    process.env.SERVER_EXCESS_PERCENT = 65;

    sandbox.stub(Server, 'count')
      .withArgs({ plan: 'plan2', state: 'building' })
      .resolves(0);

    (await autoscaleCalculator.countServersToBuild(2, 12, { _id: 'plan2', uploadsPerServer: 5 })).should.be.exactly(2);
  });

  it('should calculate required servers when there is server deficiency and some servers and building', async () => {
    process.env.SERVER_DEFICIENCY_PERCENT = 70;
    process.env.SERVER_EXCESS_PERCENT = 65;

    sandbox.stub(Server, 'count')
      .withArgs({ plan: 'plan2', state: 'building' })
      .resolves(1);

    (await autoscaleCalculator.countServersToBuild(2, 12, { _id: 'plan2', uploadsPerServer: 5 })).should.be.exactly(1);
  });

  it('should should calculate excess servers when there is server excess and no terminating servers', async () => {
    process.env.SERVER_DEFICIENCY_PERCENT = 70;
    process.env.SERVER_EXCESS_PERCENT = 65;

    sandbox.stub(Server, 'count')
      .withArgs({ plan: 'plan2', state: 'terminating' })
      .resolves(0);

    (await autoscaleCalculator.countServersToDestroy(4, 10, { _id: 'plan2', uploadsPerServer: 5 })).should.be.exactly(0);
    (await autoscaleCalculator.countServersToDestroy(5, 18, { _id: 'plan2', uploadsPerServer: 8 })).should.be.exactly(1);
  });

  it('should should calculate excess servers when there is server excess and a few terminating servers', async () => {
    process.env.SERVER_DEFICIENCY_PERCENT = 70;
    process.env.SERVER_EXCESS_PERCENT = 65;

    sandbox.stub(Server, 'count')
      .withArgs({ plan: 'plan2', state: 'terminating' })
      .resolves(1);

    (await autoscaleCalculator.countServersToDestroy(8, 18, { _id: 'plan2', uploadsPerServer: 8 })).should.be.exactly(3);
  });

  it('should calculate excess servers to be 0 when is only one active server and zero uploads running', async () => {
    process.env.SERVER_DEFICIENCY_PERCENT = 70;
    process.env.SERVER_EXCESS_PERCENT = 65;

    sandbox.stub(Server, 'count')
      .withArgs({ plan: 'plan2', state: 'terminating' })
      .resolves(1);

    (await autoscaleCalculator.countServersToDestroy(1, 0, { _id: 'plan2', uploadsPerServer: 8 })).should.be.exactly(0);
  });

  afterEach(() => {
    sandbox.restore();
  });
});

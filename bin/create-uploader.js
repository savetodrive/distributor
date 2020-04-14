#!/usr/bin/env node
const path = require('path');
require('dotenv').config(path.dirname(__dirname));

const serverCreator = require('../src/services/server_creator');
const loggerFactory = require('../src/factories/loggerFactory');
const container = require('../src/container');
const database = require('../src/services/database');
const Plan = require('../src/models/plan');

container.logger = loggerFactory(true);

(async () => {
  try {
    if (process.argv.length !== 3) {
      container.logger.error('Invalid arguments');
      process.exit(1);
    }

    await database.connectMongo();

    const plan = await Plan.findOne({ _id: process.argv[2] }).exec();

    if (!plan.active) {
      container.logger.error('Plan is inactive');
      process.exit(1);
    }

    await serverCreator.create(plan);
    container.logger.info(`Uploader server created for plan=${plan.planCode}`);
    process.exit(0);
  } catch (e) {
    container.logger.error(e);
    process.exit(1);
  }
})();

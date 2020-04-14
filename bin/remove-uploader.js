#!/usr/bin/env node
const path = require('path');
require('dotenv').config(path.dirname(__dirname));

const container = require('../src/container');
const loggerFactory = require('../src/factories/loggerFactory');

container.logger = loggerFactory(true);

const serverRemover = require('../src/services/server_remover');
const database = require('../src/services/database');
const Plan = require('../src/models/plan');

(async () => {
  try {
    if (process.argv.length !== 4) {
      container.logger.error('Invalid arguments');
      process.exit(1);
    }

    await database.connectMongo();

    const plan = await Plan.findOne({ _id: process.argv[2] }).exec();

    if (!plan.active) {
      container.logger.error('Plan is inactive');
      process.exit(1);
    }

    await serverRemover.remove(plan, Number(process.argv[3]));
    container.logger.info(`${process.argv[3]} uploader server(s) removed for plan=${plan.planCode}`);
    process.exit(0);
  } catch (e) {
    container.logger.error(e);
    process.exit(1);
  }
})();

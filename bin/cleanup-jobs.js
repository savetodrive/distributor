#!/usr/bin/env node
const path = require('path');
require('dotenv').config(path.dirname(__dirname));
const { promisify } = require('util');
const kue = require('kue');

const queueFactory = require('../src/factories/queueFactory');
const loggerFactory = require('../src/factories/loggerFactory');

queueFactory();
const logger = loggerFactory(true);

const JOB_PER_BATCH = 1000;

(async () => {
  try {
    if (process.argv.length !== 3) {
      logger.error(new Error('Missing console arguments; jobs count is mandatory'));
      process.exit(1);
    }

    const inputCount = process.argv[2];

    logger.debug(`Attempting to clean up ${inputCount} completed jobs.`);

    const batchCount = Math.ceil(inputCount / JOB_PER_BATCH);
    let deleteCount = 0;

    for (let i = 0; i < batchCount; i += 1) {
      const remainingJobs = inputCount - deleteCount;
      const jobs = await promisify(kue.Job.rangeByState)( // eslint-disable-line no-await-in-loop
        'complete',
        0,
        (remainingJobs > JOB_PER_BATCH ? JOB_PER_BATCH : remainingJobs) - 1,
        'asc',
      );

      await Promise.all(jobs.map(job => promisify(job.remove.bind(job))())); // eslint-disable-line
      deleteCount += jobs.length;
      logger.debug(`Cleaned up ${jobs.length} completed jobs in this batch.`);
    }

    logger.info(`Cleaned up ${deleteCount} completed jobs in total.`);

    process.exit(0);
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
})();

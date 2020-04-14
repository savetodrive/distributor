const { promisify } = require('util');
const kue = require('kue');

const constants = require('./constants');
const container = require('./container');

exports.getServerQueue = hostname => `${constants.SERVER_UPLOAD_QUEUE_PREFIX}_${hostname}`;

exports.debug = container.logger.debug.bind(container.logger);

exports.getJob = promisify(kue.Job.get);

exports.removeJob = job => promisify(job.remove.bind(job))();

exports.delay = promisify(setTimeout);

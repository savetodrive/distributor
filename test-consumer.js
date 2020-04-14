const kue = require('kue');
const constants = require('./src/constants');

const queue = kue.createQueue({
  prefix: 'std_q',
  jobEvents: false,
});

queue.process(`${constants.SERVER_UPLOAD_QUEUE_PREFIX}_localhost`, (job, done) => {
  setTimeout(() => {
    queue.create(constants.FINISH_UPLOAD_QUEUE, {
      id: job.id,
    }).save(done);
  }, 5000);
});

queue.process(`${constants.SERVER_UPLOAD_QUEUE_PREFIX}_localhost2`, (job, done) => {
  setTimeout(() => {
    queue.create(constants.TERMINATE_UPLOADS_QUEUE, {
      ids: [job.id],
      uploaderServerHostname: 'localhost2',
      uploadsCount: 1,
    }).save(done);
  }, 5000);
});

require('dotenv').config();

const Sentry = require('@sentry/node');
const { promisify } = require('util');
const requireGlob = require('require-glob');
const os = require('os');
const kue = require('kue');

const database = require('./services/database');
const container = require('./container');
const loggerFactory = require('./factories/loggerFactory');
const queueFactory = require('./factories/queueFactory');


container.logger = loggerFactory();

(async () => {
  const queue = queueFactory();

  container.queue = queue;

  queue.setMaxListeners(1000);
  queue.watchStuckJobs(1000);

  container.mongooseConnection = await database.connectMongo();

  Object.values(requireGlob.sync('./jobs/*.js'))
    .forEach(job => job(queue));

  container.logger.info('Distributor started');

  queue.on('error', (err) => {
    // TODO: handle redis connection error if possible
    container.logger.error(err);
  });

  const shutdownProcess = async (error) => {
    let failed = false;

    if (error) {
      container.logger.error(error);
      failed = true;
    }

    const exitHandler = (promise, ignoreFailure = false) =>
      promise.catch((err) => {
        if (!ignoreFailure) {
          global.logger.error(err);
          failed = true;
        }
      });

    const shutdownQueue = promisify(queue.shutdown.bind(queue));

    const finalizeLogging = () => {
      const loggingPromise = new Promise((resolve, reject) => {
        const loggingTimeout = setTimeout(reject, 1500);
        container.logger.on('finish', () => {
          clearTimeout(loggingTimeout);
          resolve();
        });
      });

      container.logger.end();

      return loggingPromise;
    };

    try {
      // try to exit immediately in case of failure
      // otherwise wait for some time to stop the currently active jobs
      await exitHandler(shutdownQueue(failed ? 0 : 1000));

      await Promise.all([
        exitHandler(database.disconnect()),
        exitHandler(kue.redis.reset()), // Quits all the redis connection used internally by kue
      ]);

      await finalizeLogging();
    } catch (e) {
      failed = true;
      container.logger.error(error);
      await exitHandler(finalizeLogging(), true);
    } finally {
      process.exit(failed ? 1 : 0);
    }
  };

  // For handling application stop and non-graceful reload
  process.on('SIGINT', () => {
    container.logger.info('Received SIGINT signal.');
    return shutdownProcess();
  });

  // For handling Graceful reload
  process.on('message', async (message) => {
    if (message === 'shutdown') {
      container.logger.info('Received shutdown event.');
      await shutdownProcess();
    }
  });

  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_NODE_RAVEN_DSN,
      release: process.env.CURRENT_REVISION,
      environment: process.env.APP_ENVIRONMENT,
      serverName: os.hostname(),
      integrations:
        defaultIntegrations =>
          [
            ...(defaultIntegrations.filter(integration => integration.name !== 'OnUncaughtException' && integration.name !== 'OnUnhandledRejection')),
            new Sentry.Integrations.OnUncaughtException({ onFatalError: shutdownProcess }),
          ],
    });
    Sentry.configureScope((scope) => {
      scope.setTag('app_type', 'distributor_microservice');
    });
  } else {
    process.on('uncaughtException', shutdownProcess);
  }

  process.on('unhandledRejection', (error) => {
    // being strict on unhandledRejection and throwing exception
    // in order to trigger uncaughtException
    // TODO: log the fact that this is an unhandled rejection and logging context like promise
    throw error;
  });
})();

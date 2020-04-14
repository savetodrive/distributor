const mongoose = require('mongoose');
const config = require('../config');
const container = require('../container');

exports.connectMongo = function connectMongo() {
  mongoose.Promise = Promise;

  const {
    host,
    db,
    user,
    password,
  } = config.database.mongo;

  return mongoose.connect(
    `${host}/${db}`,
    {
      useNewUrlParser: true,
      useCreateIndex: true,
      promiseLibrary: Promise,
      user,
      pass: password,
    },
  ).then((connection) => {
    container.logger.info('Mongo connected');
    return connection;
  });
};

exports.disconnect = function disconnect() {
  return mongoose.disconnect();
};

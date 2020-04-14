const container = require('../../container');

exports.create = (hostname) => {
  container.logger.debug('Null Driver: Created uploader server');
  return hostname;
};

exports.destroy = () => {
  container.logger.debug('Null Driver: Destroying uploader server');
};

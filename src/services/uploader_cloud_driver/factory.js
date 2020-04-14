const { UPLOADER_CLOUD_DRIVER } = process.env;

/* eslint-disable */
exports.create = () => require(`./${UPLOADER_CLOUD_DRIVER || 'noop'}`);
/* eslint-disable */

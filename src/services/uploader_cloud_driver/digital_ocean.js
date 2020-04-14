const request = require('request-promise-native');

const {
  DO_API_TOKEN,
  DO_REGION,
  DO_SSH_KEYS,
  DO_UPLOADER_FIREWALL_ID,
} = process.env;

const baseRequest = request.defaults({
  headers: { Authorization: `Bearer ${DO_API_TOKEN}` },
  baseUrl: 'https://api.digitalocean.com/v2/',
});

exports.create = async (hostname, image) => {
  const parsedBody = await baseRequest({
    method: 'POST',
    uri: '/droplets',
    json: true,
    body: {
      name: hostname,
      region: DO_REGION,
      image,
      size: 's-1vcpu-1gb',
      private_networking: true,
      ipv6: true,
      ssh_keys: DO_SSH_KEYS.split(','),
      tags: ['production', 'app', 'uploader'],
    },
  });
  await baseRequest({
    method: 'POST',
    uri: `/firewalls/${DO_UPLOADER_FIREWALL_ID}/droplets`,
    json: true,
    body: {
      droplet_ids: [parsedBody.droplet.id],
    },
  });
  return parsedBody.droplet.id;
};

exports.find = async dropletId =>
  baseRequest({
    method: 'GET',
    uri: `/droplets/${dropletId}`,
  });

exports.destroy = async (dropletId) => {
  await baseRequest({
    method: 'DELETE',
    uri: `/droplets/${dropletId}`,
    resolveWithFullResponse: true,
  });
};

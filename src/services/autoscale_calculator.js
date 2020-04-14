const Server = require('../models/server');

const { env } = process;

exports.countServersToBuild = async (activeServerCount, actualUploadsCount, plan) => {
  let serversDefieiency;

  if (activeServerCount === 0) {
    serversDefieiency = 1;
  } else {
    const { uploadsPerServer } = plan;

    const capableUploadsCount = uploadsPerServer * activeServerCount;

    if (actualUploadsCount < 0.01 * env.SERVER_DEFICIENCY_PERCENT * capableUploadsCount) {
      return 0;
    }

    // 0.01 * SERVER_DEFICIENCY_PERCENT * targettedUploadsCount = actualUploadsCount
    let targettedUploadsCount = (actualUploadsCount * 100) / env.SERVER_DEFICIENCY_PERCENT;
    // Finding out the nearest multiple of uploadsPerServer
    // greater than or equal to uploadsPerServer
    targettedUploadsCount = Math.ceil(targettedUploadsCount / uploadsPerServer) * uploadsPerServer;

    serversDefieiency = (targettedUploadsCount - capableUploadsCount) / uploadsPerServer;
  }

  const buildingServers = await Server.count({ plan: plan._id, state: 'building' });

  return serversDefieiency - buildingServers;
};

exports.countServersToDestroy = async (candidateServerCount, actualUploadsCount, plan) => {
  const { uploadsPerServer } = plan;

  const capableUploadsCount = plan.uploadsPerServer * candidateServerCount;

  if (
    actualUploadsCount >= 0.01 * env.SERVER_EXCESS_PERCENT * capableUploadsCount
    || candidateServerCount === 0
  ) {
    return 0;
  }

  // 0.01 * SERVER_EXCESS_PERCENT * targettedUploadsCount = actualUploadsCount
  let targettedUploadsCount = (actualUploadsCount * 100) / env.SERVER_EXCESS_PERCENT;
  // Finding out the nearest multiple of uploadsPerServer greater than or equal to uploadsPerServer
  targettedUploadsCount = Math.ceil(targettedUploadsCount / uploadsPerServer) * uploadsPerServer;
  const serversExcess = (capableUploadsCount - targettedUploadsCount) / uploadsPerServer;

  const terminatingServers = await Server.count({ plan: plan._id, state: 'terminating' });

  return serversExcess - terminatingServers;
};

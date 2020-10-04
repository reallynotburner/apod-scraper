module.exports = function checkRemainingRequests (request) {
  let apiRequestsRemaining
  try {
    apiRequestsRemaining = parseInt(request.headers._headers['x-ratelimit-remaining'][0]);
  } catch {
    apiRequestsRemaining = null;
  }
  return apiRequestsRemaining;
}
module.exports = function checkRemainingRequests (request) {
  const apiRequestsRemaining = parseInt(request.headers._headers['x-ratelimit-remaining'][0]);
  console.log('requests remaining', apiRequestsRemaining);
  if (apiRequestsRemaining < 1) {
    throw 'NO MORE REQUESTS! Sorry';
  }
  return request;
}
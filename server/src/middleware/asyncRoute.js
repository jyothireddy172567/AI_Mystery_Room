export function asyncRoute(handler) {
  return function handleAsyncRoute(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

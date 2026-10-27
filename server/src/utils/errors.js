export class AppError extends Error { constructor(status, code, message) { super(message); this.status=status; this.code=code; } }
export function errorHandler(err, req, res, _next) {
  const status=err.status||500; const code=err.code||'INTERNAL_SERVER_ERROR';
  if(status>=500) console.error(JSON.stringify({level:'error',requestId:req.id,code}));
  res.status(status).json({error:{code,message:status===500?'We could not complete that request. Please try again.':err.message,requestId:req.id,details:[]}});
}

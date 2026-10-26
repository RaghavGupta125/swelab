export const errorHandler = (err, req, res, next) => {
  console.error('[HostGuard API Error]:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};

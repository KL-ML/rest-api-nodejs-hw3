import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';

const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {

  if (err.message === 'Not allowed by CORS' || err.name === 'CORSError') {
    return res.status(403).json({ message: 'Not allowed by CORS' });
  }

  if (err instanceof MulterError) {
    return res.status(400).json({ message: err.message });
  }

  if (err.status === 400 || err.code === 'LIMIT_UNEXPECTED_FILE' || err.isMulterFilterError) {
    return res.status(400).json({ message: err.message });
  }

  console.error('Unhandled Error:', err);
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    message: err.message || 'Internal Server Error',
  });
};

export default errorMiddleware;
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ApiError } from './ApiErrors';
import { isDevelopment } from '../utils/constant';

export const errorHandler: ErrorRequestHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(err);
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      data: err.data,
      stack: isDevelopment ? err.stack : undefined,
    });
    return;
  }
  if (err instanceof SyntaxError) {
    res.status(400).json({
      success: false,
      message: 'Malformed JSON',
      errors: [],
      data: null,
      stack: isDevelopment ? err.stack : undefined,
    });
    return;
  }
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    errors: [],
    data: null,
    stack: isDevelopment ? err.stack : undefined,
  });
};

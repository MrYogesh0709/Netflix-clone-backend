import winston from 'winston';
import expressWinston from 'express-winston';
import path from 'path';
import { constants, isDevelopment } from './constant';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'NETFLIX-CLONE' },
  transports: [
    ...(false //TODO CHANGE IT
      ? [
          new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.prettyPrint()),
          }),
        ]
      : []),
    new winston.transports.File({
      filename: path.resolve('logs', 'error.log'),
      level: 'error',
      maxsize: constants.MAX_LOG_FILE_SIZE_MB,
      maxFiles: constants.MAX_LOG_FILE,
    }),
    new winston.transports.File({
      filename: path.resolve('logs', 'combined.log'),
      maxsize: constants.MAX_LOG_FILE_SIZE_MB,
      maxFiles: constants.MAX_LOG_FILE,
    }),
  ],
});

// Express middleware configuration
const expressLogger = expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} - {{responseTime}}ms',
  expressFormat: true,
  colorize: false,
});

// Error logging middleware
const errorLogger = expressWinston.errorLogger({
  winstonInstance: logger,
});

interface LogMeta {
  [key: string]: any;
}

interface LoggerUtil {
  info: (message: string, meta?: LogMeta) => void;
  error: (message: string, error: Error | unknown, meta?: LogMeta) => void;
  warn: (message: string, meta?: LogMeta) => void;
  debug: (message: string, meta?: LogMeta) => void;
}

// Custom logging functions
const loggerUtil: LoggerUtil = {
  info: (message, meta = {}) => logger.info(message, meta),
  error: (message, error, meta = {}) => logger.error(message, { ...meta, error }),
  warn: (message, meta = {}) => logger.warn(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
};

export { loggerUtil as logger, expressLogger, errorLogger };

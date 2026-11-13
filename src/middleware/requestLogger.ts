import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const httpLogger = createLogger('HTTP');

export const requestLoggingMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const requestId = (req.headers['x-request-id'] as string) || Math.random().toString(36).substring(2, 15);
    req.headers['x-request-id'] = requestId;
    
    const startTime = Date.now();
    
    httpLogger.info('Incoming request', {
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
    });
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        const logData = {
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
        };
        
        if (res.statusCode >= 500) {
            httpLogger.error('Request failed', logData);
        } else if (res.statusCode >= 400) {
            httpLogger.warn('Request error', logData);
        } else {
            httpLogger.info('Request completed', logData);
        }
    });
    
    next();
};
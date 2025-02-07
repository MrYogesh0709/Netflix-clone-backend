import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { constants } from '../../utils/constant';
import { CustomJwtPayload } from '../../types/auth.types';

declare module 'express' {
  export interface Request {
    user?: CustomJwtPayload;
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.signedCookies.accessToken;

    if (!token) {
      res.status(401).json({ message: 'Unauthorized: Token missing' });
      return;
    }

    const decoded = jwt.verify(token, constants.jwt.secret) as CustomJwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

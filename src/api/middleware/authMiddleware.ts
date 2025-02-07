import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { constants } from '../../utils/constant';
import { JwtPayload } from '../../types/express';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.signedCookies.accessToken;

    if (!token) {
      res.status(401).json({ message: 'Unauthorized: Token missing' });
    }

    const decoded = jwt.verify(token, constants.jwt.secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

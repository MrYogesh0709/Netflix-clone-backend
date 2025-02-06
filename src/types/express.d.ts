import { UserType } from '../models/User.model';

declare global {
  namespace Express {
    interface Request {
      user?: UserType;
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../modules/auth/auth.service';
import { UserRole } from '../../modules/auth/roles.enum';

export function authGuard(allowedRoles: UserRole[] = []) {

  return (req: Request, res: Response, next: NextFunction) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'Missing token' });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const user = AuthService.verifyToken(token);
      req['user'] = user;

      if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(user.role)
      ) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      next();

    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}

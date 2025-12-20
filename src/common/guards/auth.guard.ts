import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../modules/auth/roles.enum';

/**
 * Temporary auth guard (scaffolding only)
 * Will be replaced with real JWT validation later
 */
export function authGuard(
  allowedRoles: UserRole[] = []
) {
  return (req: Request, res: Response, next: NextFunction) => {

    // TEMP: mock user (DEV only)
    req['user'] = {
      id: 1,
      role: UserRole.ADMIN,
    };

    // Role check (structure only)
    if (
      allowedRoles.length > 0 &&
      !allowedRoles.includes(req['user'].role)
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
}

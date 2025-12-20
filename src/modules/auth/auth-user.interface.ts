import { UserRole } from './roles.enum';

export interface AuthUser {
  id: number;
  role: UserRole;
}

import { db } from '../../db';

export class AuthService {
  static async findOrCreateUser(phone: string) {
    const existing = await db.query(
      'select id, phone, role from users where phone = $1',
      [phone]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    const created = await db.query(
      'insert into users (phone, role) values ($1, $2) returning id, phone, role',
      [phone, 'CUSTOMER']
    );

    return created.rows[0];
  }
}

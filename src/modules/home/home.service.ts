import { db } from '../../db';

export class HomeService {
  static async getHomeData(city: string) {
    // 1️⃣ Get one active store for the city
    const storeResult = await db.query(
      `
      SELECT id, name, city
      FROM stores
      WHERE city = $1 AND is_active = true
      ORDER BY id ASC
      LIMIT 1
      `,
      [city]
    );

    const store = storeResult.rows[0];

    if (!store) {
      return null;
    }

    // 2️⃣ Get menu (city-wide pricing)
    const productsResult = await db.query(
      `
      SELECT id, name, price
      FROM products
      WHERE is_active = true
      ORDER BY id ASC
      `
    );

    return {
      store,
      menu: productsResult.rows,
    };
  }
}

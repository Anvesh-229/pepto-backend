import { db } from '../../db';

export class AuthService {

  static async loginOrSignup(phone: string) {
    // 1. Check if user exists
    const userResult = await db.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );

    let user = userResult.rows[0];
    let walletBalance = 0;

    // 2. If new user → create user + wallet
    if (!user) {
      // fetch signup bonus
      const bonusResult = await db.query(
        "SELECT value FROM app_config WHERE key = 'SIGNUP_WALLET_BONUS'"
      );

      const signupBonus = bonusResult.rows[0]?.value || 0;

      // create user
      const userInsert = await db.query(
        `INSERT INTO users (phone, role)
         VALUES ($1, 'CUSTOMER')
         RETURNING *`,
        [phone]
      );

      user = userInsert.rows[0];

      // create wallet
      const walletInsert = await db.query(
        `INSERT INTO wallets (user_id, balance)
         VALUES ($1, $2)
         RETURNING balance`,
        [user.id, signupBonus]
      );

      walletBalance = walletInsert.rows[0].balance;

    } else {
      // existing user → get wallet
      const walletResult = await db.query(
        'SELECT balance FROM wallets WHERE user_id = $1',
        [user.id]
      );

      walletBalance = walletResult.rows[0]?.balance || 0;
    }

    return {
      user,
      walletBalance
    };
  }
}

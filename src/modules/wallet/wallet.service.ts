import { DbClient } from '../../db';

export class WalletService {

  static async getWallet(userId: number, client: DbClient) {
    const res = await client.query(
      `SELECT id, balance FROM wallets WHERE user_id = $1`,
      [userId]
    );

    if (res.rowCount === 0) {
      throw new Error('Wallet not found');
    }

    return res.rows[0];
  }

  static async debit(
    userId: number,
    orderId: number,
    amount: number,
    client: DbClient
  ) {
    const wallet = await this.getWallet(userId, client);

    if (Number(wallet.balance) < amount) {
      throw new Error('Insufficient wallet balance');
    }

    await client.query(
      `UPDATE wallets SET balance = balance - $1 WHERE id = $2`,
      [amount, wallet.id]
    );

    await client.query(
      `INSERT INTO wallet_transactions
       (wallet_id, order_id, amount, type, reason)
       VALUES ($1, $2, $3, 'DEBIT', 'ORDER_PAYMENT')`,
      [wallet.id, orderId, amount]
    );
  }

  static async credit(
    userId: number,
    orderId: number,
    amount: number,
    client: DbClient
  ) {
    const wallet = await this.getWallet(userId, client);

    await client.query(
      `UPDATE wallets SET balance = balance + $1 WHERE id = $2`,
      [amount, wallet.id]
    );

    await client.query(
      `INSERT INTO wallet_transactions
       (wallet_id, order_id, amount, type, reason)
       VALUES ($1, $2, $3, 'CREDIT', 'ORDER_REFUND')`,
      [wallet.id, orderId, amount]
    );
  }
  
  static async getWalletSummary(
    userId: number,
    client: DbClient
  ) {
    const walletRes = await client.query(
      `SELECT id, balance
       FROM wallets
       WHERE user_id = $1`,
      [userId]
    );

    if (walletRes.rowCount === 0) {
      throw new Error('Wallet not found');
    }

    const walletId = walletRes.rows[0].id;

    const txRes = await client.query(
      `SELECT id, amount, type, reason, created_at
       FROM wallet_transactions
       WHERE wallet_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [walletId]
    );

    return {
      balance: Number(walletRes.rows[0].balance),
      transactions: txRes.rows.map(tx => ({
        id: tx.id,
        amount: Number(tx.amount),
        type: tx.type,
        reason: tx.reason,
        createdAt: tx.created_at,
      })),
    };
  }
}

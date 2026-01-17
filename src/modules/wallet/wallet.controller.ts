import { Request, Response } from 'express';
import { WalletService } from './wallet.service';
import { db } from '../../db';

export const getWallet = async (req: Request, res: Response) => {
  try {
    // TEMP (JWT later)
    const userId = Number(req.query.userId);

    if (!userId) {
      return res.status(400).json({
        message: 'userId is required',
      });
    }

    const result = await WalletService.getWalletSummary(
      userId,
      db
    );

    return res.json(result);

  } catch (err: any) {
    console.error('Get wallet error:', err.message);
    return res.status(400).json({
      message: err.message,
    });
  }
};

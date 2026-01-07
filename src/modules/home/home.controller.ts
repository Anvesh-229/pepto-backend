import { Request, Response } from 'express';
import { HomeService } from './home.service';

export const getHome = async (req: Request, res: Response) => {
  try {
    // MVP default
    const city = (req.query.city as string) || 'Ongole';

    const data = await HomeService.getHomeData(city);

    if (!data) {
      return res.status(404).json({
        message: 'No store available for this city',
      });
    }

    return res.json({
      city,
      store: data.store,
      menu: data.menu,
    });
  } catch (error) {
    console.error('HOME API ERROR', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

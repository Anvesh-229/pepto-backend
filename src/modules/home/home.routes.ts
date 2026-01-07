import { Router } from 'express';
import { getHome } from './home.controller';

const router = Router();

// GET /home
router.get('/', getHome);

export default router;

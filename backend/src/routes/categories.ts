import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { prisma } from '../utils/prisma';

const router = Router();
router.use(authenticate);

// GET /api/v1/categories
router.get('/', async (req, res) => {
  const categories = await prisma.categories.findMany();
  res.json(categories);
});

export default router;

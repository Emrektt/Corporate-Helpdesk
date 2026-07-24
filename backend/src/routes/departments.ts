import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { prisma } from '../utils/prisma';

const router = Router();
router.use(authenticate);

// GET /api/v1/departments
router.get('/', async (req, res) => {
  const depts = await prisma.departments.findMany();
  res.json(depts);
});

export default router;

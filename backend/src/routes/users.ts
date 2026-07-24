import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { prisma } from '../utils/prisma';

const router = Router();
router.use(authenticate);

// GET /api/v1/users
router.get('/', async (req, res) => {
  const users = await prisma.users.findMany({
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true,
      department_id: true,
      is_active: true,
      created_at: true
    }
  });
  res.json(users);
});

// GET /api/v1/users/me
router.get('/me', async (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    full_name: req.user.full_name,
    role: req.user.role,
    department_id: req.user.department_id,
    is_active: req.user.is_active
  });
});

export default router;

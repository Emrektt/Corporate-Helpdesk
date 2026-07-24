import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { prisma } from '../utils/prisma';

const router = Router();
router.use(authenticate);

// GET /api/v1/tickets
router.get('/', async (req, res) => {
  const tickets = await prisma.tickets.findMany({
    include: {
      users_tickets_created_byTousers: true,
      users_tickets_assigned_toTousers: true,
      departments: true,
      categories: true
    },
    orderBy: { created_at: 'desc' }
  });
  res.json(tickets);
});

// GET /api/v1/tickets/:id
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const ticket = await prisma.tickets.findUnique({
    where: { id },
    include: {
      users_tickets_created_byTousers: true,
      users_tickets_assigned_toTousers: true,
      departments: true,
      categories: true,
      ticket_comments: {
        include: { users: true },
        orderBy: { created_at: 'asc' }
      },
      ticket_history: {
        include: { users: true },
        orderBy: { created_at: 'desc' }
      }
    }
  });
  
  if (!ticket) return res.status(404).json({ detail: 'Ticket not found' });
  res.json(ticket);
});

// POST /api/v1/tickets
router.post('/', async (req, res) => {
  const { title, description, category_id, department_id, priority } = req.body;
  const ticket = await prisma.tickets.create({
    data: {
      ticket_number: `TKT-${Math.floor(Math.random() * 10000)}`,
      title,
      description,
      status: 'OPEN',
      priority: priority || 'MEDIUM',
      category_id: parseInt(category_id),
      department_id: parseInt(department_id),
      created_by_id: req.user.id
    }
  });
  res.json(ticket);
});

// PATCH /api/v1/tickets/:id/status
router.patch('/:id/status', async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, reason } = req.body;
  
  const ticket = await prisma.tickets.update({
    where: { id },
    data: { status }
  });
  
  await prisma.ticket_history.create({
    data: {
      ticket_id: id,
      actor_user_id: req.user.id,
      action: 'STATUS_CHANGED',
      old_value: 'N/A',
      new_value: status
    }
  });
  
  res.json(ticket);
});

// POST /api/v1/tickets/:id/comments
router.post('/:id/comments', async (req, res) => {
  const id = parseInt(req.params.id);
  const { content, is_internal } = req.body;
  
  const comment = await prisma.ticket_comments.create({
    data: {
      ticket_id: id,
      user_id: req.user.id,
      message: content,
      is_internal: is_internal || false
    }
  });
  
  res.json(comment);
});

export default router;

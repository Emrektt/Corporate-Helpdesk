import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import ticketsRoutes from './routes/tickets';
import departmentsRoutes from './routes/departments';
import categoriesRoutes from './routes/categories';
import { setupWebSockets } from './chat';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/tickets', ticketsRoutes);
app.use('/api/v1/departments', departmentsRoutes);
app.use('/api/v1/categories', categoriesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 8001;
const server = http.createServer(app);

setupWebSockets(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

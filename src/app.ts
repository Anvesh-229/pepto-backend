import { login } from './modules/auth/auth.controller';
import express from 'express';
import dotenv from 'dotenv';

console.log('Pepto backend DEV starting...');

// Load env variables
dotenv.config({ path: 'config/dev.env' });

const app = express();
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'Pepto backend running' });
});

const PORT = Number(process.env.PORT) || 3000;

app.post('/auth/login', login);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

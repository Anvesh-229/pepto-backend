import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
//import './db';
import { login } from './modules/auth/auth.controller';

const app = express();
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'API running' });
});

app.post('/auth/login', login);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

setInterval(() => {
  console.log('🟢 server alive');
}, 10000);

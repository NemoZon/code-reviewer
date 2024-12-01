import express, { Express } from 'express';
import cors, { CorsOptions } from 'cors';
import { LintRouter } from './routers/lint.router'; // Новый роутер

const app: Express = express();

const corsOptions: CorsOptions = {
  origin: process.env.CLIENT_URL,
  optionsSuccessStatus: 200,
};

app.use(express.json());
app.use(cors());

// Подключение роутеров
app.use('/api', LintRouter); // Подключение роутера для ESLint

export default app;

import { HelloController } from '@controllers/hello.controller';
import { Router } from 'express';
export const HelloRouter = Router();

HelloRouter.get('/', HelloController.welcome);

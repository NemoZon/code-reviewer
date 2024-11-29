import { HelloService } from '@services/hello.service';
import { Response, Request, NextFunction } from 'express';

export class HelloController {
  public static async welcome(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const message = HelloService.getWelcomeMessage();
      res.send(message);
    } catch (error) {
      next(error);
    }
  }
}

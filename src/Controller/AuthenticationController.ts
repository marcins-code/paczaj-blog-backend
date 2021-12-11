// import UserRepository from '../Repository/UserRepository';
import { NextFunction, Request, Response } from 'express';
import Authentication from '../Repository/Authentication';
// import Validator from '../Validator/Validator';

class AuthenticationController {
  static async signUp (req: Request, res: Response, next: NextFunction) {
    try {
      const repository = new Authentication();
      const signUp = await repository.signUp(req);
      res.status(201).json({ ...signUp });
    } catch (err:any) {
      return next(res.status(err.code).json(err.message));
    }
  }

  static async login (req: Request, res: Response, next: NextFunction) {
    try {
      const repository = new Authentication();
      console.log(req.body);
      const login = await repository.login(req.body.email, req.body.password);
      res.status(200).json({ ...login });
    // console.log(login);
    } catch (err:any) {
      return next(res.status(err.code).json(err.message));
    }
  }
}

export default AuthenticationController;

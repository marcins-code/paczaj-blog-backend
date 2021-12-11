import { NextFunction, Request, Response } from 'express';
import Validator from '../Validator/Validator';
import UserRepository from '../Repository/UserRepository';

class UserController {
  static validator: Validator = new Validator();

  public static async getSingleUserById (req: Request, res: Response, next: NextFunction) {
    try {
      const lang = UserController.validator.validateLanguage(req.headers);
      const id = UserController.validator.validateIsValidObjectId(req.params.id);
      const isAdminRequest = UserController.validator.validateAdminRequest(req.headers, req.url);
      const repository = new UserRepository(lang, isAdminRequest.isAuthorized);
      const user = await repository.getSingleDocumentById(id);
      res.status(200).header({ 'Content-Language': lang }).json({ ...user });
    } catch (err:any) {
      return next(res.status(err.code).json(err.message));
    }
  }

  public static async getPaginatedUsers (req: Request, res: Response, next: NextFunction) {
    try {
      const lang = UserController.validator.validateLanguage(req.headers);
      const paginationData = UserController.validator.validatePaginationData(req.query);
      const isAdminRequest = UserController.validator.validateAdminRequest(req.headers, req.url);
      const repository = new UserRepository(lang, isAdminRequest.isAuthorized);
      const users = await repository.getPaginatedDocuments(paginationData);
      res.status(200).header({ 'Content-Language': lang }).json({ ...users });
    } catch (err:any) {
      return next(res.status(err.code).json(err.message));
    }
  }
}

export default UserController;

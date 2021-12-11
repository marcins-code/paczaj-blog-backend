import Validator from '../Validator/Validator';
import { NextFunction, Request, Response } from 'express';
import ArticleTypeRepository from '../Repository/ArticleTypeRepository';

class ArticleTypesController {
    static validator: Validator = new Validator();

    public static async getSingleArticleTypeById (req: Request, res: Response, next: NextFunction) {
      try {
        const lang = ArticleTypesController.validator.validateLanguage(req.headers);
        const id = ArticleTypesController.validator.validateIsValidObjectId(req.params.id);
        const isAdminRequest = ArticleTypesController.validator.validateAdminRequest(req.headers, req.url);
        const repository = new ArticleTypeRepository(lang, isAdminRequest.isAuthorized);
        const articleType = await repository.getSingleDocumentById(id);
        res.status(200).header({ 'Content-Language': lang }).json({ ...articleType });
      } catch (err:any) {
        return next(res.status(err.code).json(err.message));
      }
    }

    public static async getPaginatedArticleTypes (req: Request, res: Response, next: NextFunction) {
      try {
        const lang = ArticleTypesController.validator.validateLanguage(req.headers);
        const paginationData = ArticleTypesController.validator.validatePaginationData(req.query);
        const isAdminRequest = ArticleTypesController.validator.validateAdminRequest(req.headers, req.url);
        const repository = new ArticleTypeRepository(lang, isAdminRequest.isAuthorized);
        const articleTypes = await repository.getPaginatedDocuments(paginationData);
        res.status(200).header({ 'Content-Language': lang }).json({ ...articleTypes });
      } catch (err:any) {
        return next(res.status(err.code).json(err.message));
      }
    }
}

export default ArticleTypesController;

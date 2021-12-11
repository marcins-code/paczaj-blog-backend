import Validator from '../Validator/Validator';
import { NextFunction, Request, Response } from 'express';
import GlossaryRepository from '../Repository/GlossaryRepository';

class GlossaryController {
    static validator: Validator = new Validator();

    public static async getSingleGlossaryById (req: Request, res: Response, next: NextFunction) {
      try {
        const lang = GlossaryController.validator.validateLanguage(req.headers);
        const id = GlossaryController.validator.validateIsValidObjectId(req.params.id);
        const isAdminRequest = GlossaryController.validator.validateAdminRequest(req.headers, req.url);
        const repository = new GlossaryRepository(lang, isAdminRequest.isAuthorized);
        const glossary = await repository.getSingleDocumentById(id);
        res.status(200).header({ 'Content-Language': lang }).json({ ...glossary });
      } catch (err:any) {
        return next(res.status(err.code).json(err.message));
      }
    }

    public static async getPaginatedGlossary (req: Request, res: Response, next: NextFunction) {
      try {
        const lang = GlossaryController.validator.validateLanguage(req.headers);
        const paginationData = GlossaryController.validator.validatePaginationData(req.query);
        const isAdminRequest = GlossaryController.validator.validateAdminRequest(req.headers, req.url);
        const repository = new GlossaryRepository(lang, isAdminRequest.isAuthorized);
        const glossary = await repository.getPaginatedDocuments(paginationData);
        res.status(200).header({ 'Content-Language': lang }).json({ ...glossary });
      } catch (err:any) {
        return next(res.status(err.code).json(err.message));
      }
    }
}

export default GlossaryController;

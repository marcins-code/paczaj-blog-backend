import { Router } from 'express';
import ArticleTypesController from '../Controller/ArticleTypesController';

const router = Router();

router.get('/articletype/:id', ArticleTypesController.getSingleArticleTypeById);
router.get('/admin/articletype/:id', ArticleTypesController.getSingleArticleTypeById);

router.get('/articletype', ArticleTypesController.getPaginatedArticleTypes);
router.get('/admin/articletype', ArticleTypesController.getPaginatedArticleTypes);
export default router;

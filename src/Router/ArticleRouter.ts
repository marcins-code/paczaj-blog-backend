import { Router } from 'express';
import ArticleController from '../Controller/ArticleController';

const router = Router();

router.get('/article/:id', ArticleController.getSingleArticleById);
router.get('/admin/article/:id', ArticleController.getSingleArticleById);

router.get('/article', ArticleController.getPaginatedArticles);
router.get('/admin/article', ArticleController.getPaginatedArticles);
export default router;

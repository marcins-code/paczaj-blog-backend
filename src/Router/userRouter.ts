import { Router } from 'express';
import AuthenticationController from '../Controller/AuthenticationController';
import UserController from '../Controller/UserController';

const router = Router();

router.get('/user/:id', UserController.getSingleUserById);
router.get('/admin/user/:id', UserController.getSingleUserById);

router.get('/user', UserController.getPaginatedUsers);
router.get('/admin/user', UserController.getPaginatedUsers);

router.post('/user/signUp', AuthenticationController.signUp);
router.post('/user/login', AuthenticationController.login);

export default router;

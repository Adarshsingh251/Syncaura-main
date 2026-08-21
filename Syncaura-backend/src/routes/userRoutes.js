import { Router } from 'express';

import { auth } from '../middlewares/auth.js';
import { permit } from '../middlewares/role.js';
import { requireSelf } from '../middlewares/userAuth.js';
import { getUser } from '../controllers/userController.js';

const router = Router();

router.get(
  '/:userId',
  auth,
  permit('user'),
  requireSelf,
  getUser
);

export default router;
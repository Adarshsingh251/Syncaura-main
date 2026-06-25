import express from 'express';
import {auth} from '../middlewares/auth.js';
import { permit } from '../middlewares/role.js';
import ROLES from '../config/roles.js';
import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave
} from '../controllers/leaveController.js';

const router = express.Router();

router.post('/applyleave', auth, permit(ROLES.USER), applyLeave);
router.get('/myleaves', auth, getMyLeaves);
router.get('/allleaves', auth, permit(ROLES.ADMIN, ROLES.CO_ADMIN, 'coadmin'), getAllLeaves);
router.put('/:id/approve', auth, permit(ROLES.ADMIN, ROLES.CO_ADMIN, 'coadmin'), approveLeave);
router.put('/:id/reject', auth, permit(ROLES.ADMIN, ROLES.CO_ADMIN, 'coadmin'), rejectLeave);

export default router;

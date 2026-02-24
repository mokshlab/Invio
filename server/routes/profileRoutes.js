import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/profileController.js';
import {
  validateUpdateProfile,
  validateChangePassword,
} from '../validators/profileValidator.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getProfile)
  .put(validateUpdateProfile, updateProfile);

router.put('/password', validateChangePassword, changePassword);

export default router;

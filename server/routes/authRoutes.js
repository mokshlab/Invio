import express from 'express';
import {
  signup,
  login,
  refreshToken,
  logout,
  getMe,
} from '../controllers/authController.js';
import { validate, signupSchema, loginSchema } from '../validators/authValidator.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;

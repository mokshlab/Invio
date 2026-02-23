import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

/**
 * Middleware to protect routes — verifies JWT access token
 * and attaches the user object to req.user.
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Not authorized, no token provided', 401);
    }

    // Verify token and find user
    const decoded = jwt.verify(token, config.jwtAccessSecret);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new AppError('User associated with this token no longer exists', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    next(error);
  }
};

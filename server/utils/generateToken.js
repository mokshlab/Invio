import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Generate a short-lived access token (15 min).
 * Stored in memory / localStorage on the client.
 */
export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiry,
  });
};

/**
 * Generate a long-lived refresh token (7 days).
 * Stored as an httpOnly cookie — never accessible to JS.
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiry,
  });
};

/**
 * Set the refresh token as a secure, httpOnly cookie.
 */
export const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

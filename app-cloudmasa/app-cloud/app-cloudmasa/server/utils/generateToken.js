// server/utils/generateToken.js
import jwt from 'jsonwebtoken';

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'cloudmasa_jwt_secret_2026', {
    expiresIn: '7d'
  });
};

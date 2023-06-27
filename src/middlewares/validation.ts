import { body } from 'express-validator';

export const validatePassword = body('password')
  .isLength({ min: 8 })
  .trim()
  .withMessage('The password has to be at least 8 characters long.');

export const validatePasswordMatch = body('password')
  .custom((value, { req }) => {
    if (value !== req.body.confirmPassword) {
      return false;
    }
    return true;
  })
  .withMessage("Passwords don't match");

export const validateEmail = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Please enter a valid email address.');

export const validateUsername = body('username')
  .isLength({ min: 6 })
  .trim()
  .withMessage('The username has to be at least 6 characters long.');

export { validationResult } from 'express-validator';

const { body } = require('express-validator');

module.exports = {
  registerValidator: [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Email must be a valid email')
      .toLowerCase()
      .custom((value) => {
        // Use regex to validate email format
        const emailRegex = /^[.@a-zA-Z0-9]+@[.@a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(value)) {
          throw new Error('Invalid email format, Email must contain only symbols like . and @');
        }
        return true;
      }),
    body('password')
      .trim()
      .isLength({ min: 8 })
      .withMessage('Password length short, min 8 characters required')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/)
      .withMessage('Password must contain at least one uppercase letter, one digit, one special symbol, and be at least 8 characters long'),
    body('password2').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
    body('phone')
      .optional()
      .trim()
      .isLength({ min: 10, max: 10 })
      .withMessage('Phone number must be exactly 10 digits')
      .matches(/^\d{10}$/)
      .withMessage('Phone number must contain only digits')
  ],
  resetPasswordValidator: [
    body('userId')
      .trim()
      .notEmpty()
      .withMessage('User ID is required')
      .isMongoId()
      .withMessage('Invalid user ID'),
    body('newPassword')
      .trim()
      .isLength({ min: 8 })
      .withMessage('Password length short, min 8 characters required')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/)
      .withMessage('Password must contain at least one uppercase letter, one digit, one special symbol, and be at least 8 characters long'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  ],
};

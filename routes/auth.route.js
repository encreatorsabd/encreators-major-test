const router = require('express').Router();
const User = require('../models/user.model');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const { ensureLoggedOut, ensureLoggedIn } = require('connect-ensure-login');
const { registerValidator } = require('../utils/validators');
const { roles } = require('../utils/constants');
const Employee = require('../models/employee.model');
const bcrypt = require('bcrypt');

router.get(
  '/forgot-password',
  ensureLoggedOut({ redirectTo: '/' }),
  async (req, res, next) => {
    res.render('forgot-password');
  }
);

router.post(
  '/forgot-password',
  ensureLoggedOut({ redirectTo: '/' }),
  async (req, res, next) => {
    try {
      const { email, password, confirmPassword } = req.body;

      // Validate email format
      if (!isValidEmail(email)) {
        req.flash('error', 'Invalid email format');
        res.redirect('/auth/forgot-password');
        return;
      }

      // Validate password format and match
      if (!isValidPassword(password, confirmPassword)) {
        req.flash('error', 'Invalid passwords');
        res.redirect('/auth/forgot-password');
        return;
      }

      // Find the user based on the provided email address
      const user = await User.findOne({ email });
      if (!user) {
        req.flash('error', 'User with that email address not found');
        res.redirect('/auth/forgot-password');
        return;
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update the password in both User and Employee models if the user is an employee
      if (user.role === roles.employee) {
        await User.updateOne({ email }, { password: hashedPassword });
        await Employee.updateOne({ email }, { password: hashedPassword });
      } else {
        // If the user is not an employee, update only in the User model
        await User.updateOne({ email }, { password: hashedPassword });
      }

      req.flash('success', 'Password reset successfully');
      res.redirect('/auth/login'); // Redirect to login page on success
    } catch (error) {
      next(error);
    }
  }
);

// Function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Function to validate password format and match
function isValidPassword(password, confirmPassword) {
  // Password should be at least 6 characters long and match the confirm password
  return password.length >= 6 && password === confirmPassword;
}




router.get(
  '/login',
  ensureLoggedOut({ redirectTo: '/' }),
  async (req, res, next) => {
    res.render('login');
  }
);

router.post(
  '/login',
  ensureLoggedOut({ redirectTo: '/' }),
  passport.authenticate('local', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/auth/login',
    failureFlash: true,
  })
);

router.get(
  '/register',
  ensureLoggedOut({ redirectTo: '/' }),
  async (req, res, next) => {
    res.render('register');
  }
);

router.post(
  '/register',
  ensureLoggedOut({ redirectTo: '/' }),
  registerValidator,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.array().forEach((error) => {
          req.flash('error', error.msg);
        });
        res.render('register', {
          email: req.body.email,
          messages: req.flash(),
        });
        return;
      }

      const { email } = req.body;
      const doesExist = await User.findOne({ email });
      if (doesExist) {
        req.flash('warning', 'Username/email already exists');
        res.redirect('/auth/register');
        return;
      }
      const user = new User(req.body);
      await user.save();
      req.flash(
        'success',
        `${user.email} registered successfully, you can now login`
      );
      res.redirect('/auth/login');
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/logout',
  ensureLoggedIn({ redirectTo: '/' }),
  async (req, res, next) => {
    req.logout(function(err) {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });
  }
);

// Middleware to prevent logged-in users from accessing login and register pages
router.use('/', (req, res, next) => {
  if (req.isAuthenticated()) {
    res.redirect('/');
  } else {
    next();
  }
});

module.exports = router;

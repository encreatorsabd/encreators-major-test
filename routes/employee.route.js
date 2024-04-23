const router = require('express').Router();
const Project = require('../models/projects.model');
const User = require('../models/user.model');
const Employee = require('../models/employee.model');

router.get('/profile', async (req, res, next) => {
  // console.log(req.user);
  const person = req.user;
  res.render('profile', { person });
});


router.get('/employee-projects', async (req, res, next) => {
  try {
    const person = req.user;


    // Find the user document and populate the 'employee' field
    const user = await User.findOne({ _id: person }).populate('employee');
    
    // Ensure the user is found and has an employee reference
    if (!user || !user.employee) {
      throw new Error('User not found or no employee reference');
    }
    
    // Find all projects related to the employee
    const employeeProjects = await Project.find({ empId: user.employee });

    res.render('employee-projects', { employeeProjects });
  } catch (error) {
    console.log(error);
    req.flash("error", "Internal Server Error");
    return res.redirect("back");
    next(error);
  }
});


module.exports = router;

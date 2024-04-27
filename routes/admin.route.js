const router = require("express").Router();
const mongoose = require("mongoose");
const { roles } = require("../utils/constants");
const { registerValidator } = require("../utils/validators");
const { Parser } = require('json2csv');
const fs = require('fs');
const xlsx = require('xlsx');
const bcrypt = require('bcrypt');


//models
const User = require("../models/user.model");
const Department = require("../models/department.model");
const Employee = require("../models/employee.model");
const Service = require("../models/service.model");
const Request = require("../models/requests.model");
const Project = require("../models/projects.model");
const Payment = require('../models/payment.model');



//Dashboard

router.get("/dashboard", async (req, res, next) => {
  try {
    const users = await User.find();
    const employees = await Employee.find();
    const dept = await Department.find();
    const service = await Service.find();
    const isPending = await Request.find({ status: 'PENDING' });
    const onProgress = await Request.find({ status: 'ACCEPTED' });
    const projects = await Request.find();

    // Count users with the role as clients
    const clientsCount = await User.countDocuments({ role: 'CLIENT' });

    const payments = await Payment.find();
    const totalRevenue = payments.reduce((acc, payment) => acc + payment.amount, 0);

    res.render("admin-dashboard", { users, employees, dept, service, totalUsers: users.length, totalEmployees: employees.length, clientsCount, pendingProjects: isPending.length, runningProjects: onProgress.length, totalProjects: projects.length, totalRevenue });
  } catch (error) {
    console.log(error);
    req.flash("Internal Server Error");
    return res.redirect("back");
  }
});

//💻clients Management Routes

//🚀GET route to render the clients
router.get("/clients", async (req, res, next) => {
  try {
    // Fetch users and departments from the database
    const users = await User.find({ role: 'CLIENT' }).sort({ role: 1 });

    // Render the page with filtered users
    res.render("view-clients", { users });
  } catch (error) {
    next(error);
  }
});

//💻User Management Routes

// 🚀 GET route to render the manage users page
router.get("/users", async (req, res, next) => {
  try {
    // Fetch users and departments from the database
    const users = await User.find({ role: { $in: ['EMPLOYEE', 'ADMIN'] } }).sort({ role: 1 });
    const dept = await Department.find().sort({ createdAt: -1 });

    // Render the page with filtered users and departments
    res.render("manage-users", { users, dept });
  } catch (error) {
    next(error);
  }
});


//🚀POST route to update user roles
router.post("/update-role", async (req, res, next) => {
  try {
    const { id, role } = req.body;

    // Check for valid mongoose objectID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash("error", "Invalid id");
      return res.redirect("back");
    }

    // Check for Valid role
    const rolesArray = Object.values(roles);
    if (!rolesArray.includes(role)) {
      req.flash("error", "Invalid role");
      return res.redirect("back");
    }

    // Fetch the user by ID
    const userToUpdate = await User.findById(id);

    if (!userToUpdate) {
      req.flash("error", "User not found");
      return res.redirect("back");
    }

    // Check if the user being updated is the logged-in admin
    if (req.user.id === id) {
      req.flash(
        "error",
        "Admins cannot change their own role."
      );
      return res.redirect("back");
    }

    // Prevent changing the role of the admin
    if (userToUpdate.role === roles.admin) {
      req.flash(
        "error",
        "Admin role cannot be changed."
      );
      return res.redirect("back");
    }

    // If the role is being updated to 'employee'
    if (role === roles.employee) {
      // Check if user is already an employee
      if (!userToUpdate.employee) {
        // Create a new Employee Instance
        const employee = new Employee({
          name: userToUpdate.name,
          email: userToUpdate.email,
          password: userToUpdate.password,
          phone: userToUpdate.phone,
          jobTitle: "On Bench",
        });

        // Save the employee to the employees collection
        await employee.save();

        // Update the user's role and employee reference id in one operation
        await User.findByIdAndUpdate(
          id,
          { $set: { role, employee: employee._id } },
          { new: true, runValidators: true }
        );
      } else {
        // If user is already an employee, just update the role
        await User.findByIdAndUpdate(
          id,
          { role },
          { new: true, runValidators: true }
        );
      }
    } else {
      // If the role is being changed from 'employee' to another role
      if (userToUpdate.employee) {
        // Delete the corresponding Employee document
        await Employee.findByIdAndDelete(userToUpdate.employee);
      }

      // Update the user's role
      await User.findByIdAndUpdate(
        id,
        { role, $unset: { employee: "" } }, // Unset employee field
        { new: true, runValidators: true }
      );
    }

    req.flash("info", `Updated role for ${userToUpdate.email} to ${role}`);
    res.redirect("back");
  } catch (error) {
    next(error);
  }
});


//🚀POST route to delete a user
router.post("/delete-user", async (req, res, next) => {
  try {
    const { id } = req.body;
    const loggedInAdminId = req.user.id;

    // Checking if the provided ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash("error", "Invalid user ID");
      return res.redirect("back");
    }

    // Find the user by ID
    const userToDelete = await User.findById(id);


    if (userToDelete.employee) {
      // Delete the corresponding Employee document
      await Employee.findByIdAndDelete(userToDelete.employee);

    }

    // Check if the user to delete is the logged-in admin
    if (userToDelete.id === loggedInAdminId) {
      req.flash(
        "warning",
        "You cannot delete yourself. Please request another admin to delete your account."
      );
      return res.redirect("back");
    }

    // Find the user by ID and delete it
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      req.flash("error", "User not found");
      return res.redirect("back");
    }

    req.flash("success", "User deleted successfully");
    res.redirect("/admin/users");
  } catch (error) {
    next(error);
  }
});

//🚀POST route to delete a user
router.post("/delete-client", async (req, res, next) => {
  try {
    const { id } = req.body;
    const loggedInAdminId = req.user.id;

    // Checking if the provided ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash("error", "Invalid user ID");
      return res.redirect("back");
    }

    // Find the user by ID
    const userToDelete = await User.findById(id);


    if (userToDelete.employee) {
      // Delete the corresponding Employee document
      await Employee.findByIdAndDelete(userToDelete.employee);

    }

    // Check if the user to delete is the logged-in admin
    if (userToDelete.id === loggedInAdminId) {
      req.flash(
        "warning",
        "You cannot delete yourself. Please request another admin to delete your account."
      );
      return res.redirect("back");
    }

    // Find the user by ID and delete it
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      req.flash("error", "User not found");
      return res.redirect("back");
    }

    req.flash("success", "Client deleted successfully");
    res.redirect("/admin/clients");
  } catch (error) {
    next(error);
  }
});




//💻Employee Management Routes

//🚀GET route to render the manage employees page
router.get("/view-employees", async (req, res, next) => {
  try {
    const employees = await Employee.find().sort({ updatedAt: -1 });
    const departments = await Department.find();
    res.render("view-employees", { employees, departments });
  } catch (error) {
    next(error);
  }
});

//🚀POST route to add new employees
router.post("/add-employee", registerValidator, async (req, res, next) => {
  try {
    // Extract necessary fields from the request body
    const { name, email, password, phone, jobTitle, department } = req.body;

    // Validate if the email already exists in the database
    const doesExist = await User.findOne({ email });
    const doesExistInEmployee = await Employee.findOne({ email });
    if (doesExist || doesExistInEmployee) {
      req.flash("warning", "Email already exists");
      res.redirect("back");
    }

    // Using Mongoose session to ensure atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create a new Employee instance
      const employee = new Employee({
        name,
        email,
        password,
        phone,
        jobTitle,
        department
      });

      // Save the employee to the employees collection
      await employee.save({ session });

      // Create a new User instance with the same data
      const user = new User({
        name,
        email,
        password,
        phone,
        role: "EMPLOYEE", // Set the role explicitly to 'EMPLOYEE'
        employee: employee._id, // Add the reference ID
      });

      // Save the user to the users collection
      await user.save({ session });

      // Commit the transaction
      await session.commitTransaction();

      // Flash success message and redirect back to the previous page
      req.flash("info", "Employee added successfully");
      return res.redirect("back");
    } catch (error) {
      // If an error occurs, abort the transaction
      await session.abortTransaction();
      throw error; // Re-throw the error to be caught by the global error handler
    } finally {
      // End the session
      session.endSession();
    }
  } catch (error) {
    // Forward any errors to the error handling middleware
    next(error);
  }
});

//🚀POST route to update employee email
router.post("/update-email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { newEmail } = req.body;

    // Find the employee by email
    const employee = await Employee.findOne({ email });

    if (!employee) {
      req.flash("error", "Employee not found");
      return res.redirect("back");
    }

    // Update email in Employee model
    await Employee.findByIdAndUpdate(employee._id, { email: newEmail });

    // Update email in User model
    await User.findOneAndUpdate({ email }, { email: newEmail });

    req.flash("info", "Employee Email Updated Successfully");
    return res.redirect("back");
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


//🚀POST route to update employee email
router.post("/update-employee-password/:email", async (req, res, next) => {
  try {
    const { email } = req.params;
    console.log(email);
    const { newPassword } = req.body;

    // Find the employee by email
    const employee = await Employee.findOne({ email });

    if (!employee) {
      req.flash("error", "Employee not found");
      return res.redirect("back");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update email in Employee model
    await Employee.findByIdAndUpdate(employee._id, { password: hashedPassword });

    // Update email in User model
    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    req.flash("info", "Employee Password Updated Successfully");
    return res.redirect("back");
  } catch (error) {
    console.error(error);
    next(error);
    req.flash("warning", "Internal Server Error");
    return res.redirect("back")
  }
});


//🚀POST route to update employee job title
router.post("/update-jobtitle/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { newJobTitle } = req.body;

    // Find the employee by email
    const employee = await Employee.findOne({ email });

    if (!employee) {
      req.flash("error", "Employee not found");
      return res.redirect("back");
    }

    // Update job title in Employee model
    await Employee.findByIdAndUpdate(employee._id, { jobTitle: newJobTitle });

    req.flash("info", "Employee Job Title Updated Successfully");
    return res.redirect("back");
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

//🚀 Route to handle department update
router.post('/update-department/:employeeEmail', async (req, res, next) => {
  try {
    const { employeeEmail } = req.params;
    const { department } = req.body;

    // Find the employee by email
    const employee = await Employee.findOne({ email: employeeEmail });

    if (!employee) {
      req.flash("error", "Employee Not Found");
      return res.redirect('back');
    }

    // Find the department by id
    const updatedDepartment = await Department.findById(department);

    if (!updatedDepartment) {
      req.flash("error", "Department not found");
      return res.redirect('back');
    }

    await Employee.findByIdAndUpdate(employee._id, { department: updatedDepartment._id });

    req.flash("info", "Department updated successfully");
    return res.redirect('back');
  } catch (error) {
    next(error);
  }
});




//💻Service Management routes

// 🚀GET route to render the manage services page
router.get("/manage-services", async (req, res, next) => {
  try {
    // Fetch services and departments
    const services = await Service.find();
    const departments = await Department.find({}, 'department_name'); // Fetch only department names

    res.render("service", { services, departments }); // Pass both services and department names to the view
  } catch (error) {
    next(error);
  }
});


// POST /admin/update-service-name/:serviceId
router.post('/update-service-name/:serviceId', async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const newServiceName = req.body.newServiceName;
    const service = await Service.findByIdAndUpdate(serviceId, { name: newServiceName }, { new: true });
    res.redirect('back'); // Redirect to the services list page
    req.flash('info','Service Details Updated');
  } catch (error) {
    console.error(error);
    req.flash('error','Internal Server Error');
  }
});
router.post('/update-service-desc/:serviceId', async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const newServiceDescription = req.body.description; // Changed from newServiceName to description
    const service = await Service.findByIdAndUpdate(serviceId, { description: newServiceDescription }, { new: true });
    res.redirect('back'); // Redirect to the services list page
    req.flash('info','Service Details Updated');
  } catch (error) {
    console.error(error);
    req.flash('error','Internal Server Error');
  }
});

router.post('/update-service-price/:serviceId', async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const newServicePrice = req.body.newServicePrice; // Changed from newServiceName to newServicePrice
    const service = await Service.findByIdAndUpdate(serviceId, { price: newServicePrice }, { new: true });
    res.redirect('back'); // Redirect to the services list page
    req.flash('info','Service Details Updated');
  } catch (error) {
    console.error(error);
    req.flash('error','Internal Server Error');
  }
});


// 🚀 POST route to add a service
router.post('/add-service', async (req, res, next) => {
  try {
    // Extract service details from the request body
    const { name, description, price, department } = req.body;

    // Check if a service with the same name already exists
    const existingService = await Service.findOne({ name });

    if (existingService) {
      // Service with the same name already exists
      req.flash("error", "Service already exists");
      return res.redirect("back");
    }

    // Create a new service object
    const newService = new Service({
      name,
      description,
      price, // Include the price field
      department
    });

    // Save the new service to the database
    await newService.save();

    // Send a success response
    req.flash("info", "Service Added Successfully");
    return res.redirect("back");
  } catch (error) {
    // Handle any errors that occur during service creation
    console.error('Error adding service:', error);
    req.flash("error", "Internal Server Error");
    return res.redirect("back");
  }
});





// Route for deleting a service with name verification
router.post('/delete-service/:id', async (req, res) => {
  const serviceId = req.params.id;

  try {
    // Find the service by its ID
    const service = await Service.findById(serviceId);

    if (!service) {
      // return res.status(404).json({ error: 'Service not found' });
      req.flash("error", "Service Not Found");
      return res.redirect("back");
    }

    // Delete the service
    await service.remove();

    // Return a success response
    // res.status(200).json({ message: 'Service deleted successfully' });
    req.flash("info", "Service deleted Successfully");
    return res.redirect("back");

  } catch (error) {
    // Return an error response if something goes wrong
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



//💻Department Management routes


//🚀GET route to render the manage departments page
router.get("/manage-department", async (req, res, next) => {
  try {
    const dept = await Department.find();
    const employees = await Employee.find().populate('department'); // Populate department field
    res.render("manage-dept", { dept, employees });
  } catch (error) {
    next(error);
  }
});


//🚀POST route to add a department
router.post('/add-departments', async (req, res, next) => {
  try {
    const { department_name } = req.body;

    const department = new Department({ department_name });

    await department.save();


    req.flash("info", "Department created");
    return res.redirect("back");
  } catch (error) {
    console.log(error);
    req.flash("error", "Internal Server Error");
    return res.redirect("back");
  }
})


//💻Request Management Routes

//🚀Requests
router.get("/manage-requests", async (req, res, next) => {
  try {
    const employees = await User.find({ role: 'EMPLOYEE' });
    const requests = await Request.find();
    res.render("admin-requests", { requests, employees });
  } catch (error) {
    next(error);
  }
});

router.post('/updateRequest/:requestId', async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const { status } = req.body;

    // Find the request by ID and update its status
    const updatedRequest = await Request.findByIdAndUpdate(requestId, { status }, { new: true });

    if (!updatedRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Respond with updated request data
    // res.status(200).json(updatedRequest);
    req.flash("info", "Request Status Updated");
    return res.redirect("back");
  } catch (error) {
    console.error("Error updating request status:", error);
    // res.status(500).json({ message: "Internal server error" });
    req.flash("error", "Internal Server Error");
  }
});





router.get('/employee-tickets', async (req, res, next) => {
  try {
    // Retrieve all departments
    const departments = await Department.find();

    // Retrieve requests grouped by department and include respective employees
    const requestsByDepartment = await Promise.all(departments.map(async department => {
      const requests = await Request.find({ departmentId: department._id }).populate('serviceId');
      const employees = await Employee.find({ department: department._id });
      return { department, requests, employees };
    }));

    res.render('admin-tickets', { requestsByDepartment });
  } catch (error) {
    next(error);
  }
});



router.get('/client-projects', async (req, res, next) => {
  try {
    const person = req.user;
    const userRequests = await Request.find({ requestUserId: person._id }).populate({
      path: 'assignedTo',
      select: 'employeeId name phoneNumber' // Specify the fields you want to retrieve from the Employee model
    });

    res.render('client-projects', { userRequests }); // Render the view after including layouts
  } catch (error) {
    // Handle errors appropriately
    console.error(error);
    req.flash("error", "Internal Server Error");
    res.redirect("back");
  }
});



router.post('/allot-request', async (req, res, next) => {
  try {
    const { requestId, requestUserID, departmentId, employeeId } = req.body;

    // Convert string IDs to MongoDB ObjectId
    const client = await User.findById(requestUserID); // Assuming requestUserID is already a MongoDB ObjectId
    const department = await Department.findById(departmentId); // Assuming departmentId is already a MongoDB ObjectId
    const employee = await Employee.findById(employeeId);

    // Validate required fields
    if (!requestId || !client || !department || !employeeId) {
      throw new Error('All required fields must be provided.');
    }

    // Update the request with the assigned employee ID
    await Request.findByIdAndUpdate(requestId, { assignedTo: employeeId });

    // Fetch the request details
    const request = await Request.findById(requestId);

    // Create a new project document
    const project = new Project({
      clientId: requestUserID,
      clientEmail: client.email,
      clientPhone: client.phone,
      empId: employeeId,
      comp_id: employee.employeeId,
      employeeName: employee.name,
      employeePhone: employee.phone,
      employeeEmail: employee.email,
      serviceId: request.serviceId,
      serviceName: request.serviceName,
      requestId: requestId, // Corrected the attribute name to match the schema
    });

    // Save the project document
    await project.save();

    // Redirect back to the admin-tickets page
    req.flash("info", "Ticket Alloted to Employee Successfully");
    return res.redirect('back');
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      req.flash("error", error.message);
      return res.redirect("back");
    }
    next(error);
  }
});
router.get('/payments', async (req, res, next) => {
  try {
    let query = {}; // Initialize empty query object
    const selectedDate = req.query.date; // Get selected date from query parameters

    // If a date is selected, add it to the query to filter payments
    if (selectedDate) {
      // Assuming createdAt field is of type Date in the database
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 1); // Set end date to the next day
      query.createdAt = { $gte: startDate, $lt: endDate };
    }

    // Fetch payment records from the database based on the query
    const payments = await Payment.find(query);

    // Render the page with payment records
    res.render('payments', { payments });
  } catch (error) {
    next(error);
  }
});


// Route to handle updating a service

module.exports = router;

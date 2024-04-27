const router = require('express').Router();
const mongoose = require('mongoose');

// Models
const Request = require('../models/requests.model');
const Service = require("../models/service.model");
const User = require("../models/user.model");
const Department = require("../models/department.model");
const Payment = require('../models/payment.model')
const createHttpError = require('http-errors');
const Project = require('../models/projects.model')
//Payment
router.post('/pay-amount', async (req, res, next) => {
  try {
    const { service_id, first_name, last_name, address_city, address_state, address_country, address_zip, card_number, cvv } = req.body;

    try {
      const product = await Service.findById(service_id);
      console.log(product);

      const id = req.user.id;
      //Checking if the id is a valid one or not
      if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash("error", "Invalid user ID");
        return res.redirect("back");
      }
      const user = await User.findById(id);
      console.log(user);

      const payment_data = new Payment({
        customerID: user._id,
        customerName: user.name,
        productID: product._id,
        productName: product.name,
        amount: product.price,
        cardNumber: card_number,
        cvv: cvv,
        phoneNumber: user.phone,
        email: user.email,
      });

      await payment_data.save();

      const department_id = product.department;
      const department = await Department.findById(department_id);

      const request_data = new Request({
        requestUserId: user._id,
        userEmail: user.email,
        serviceId: product._id,
        serviceName: product.name,
        departmentId: department_id,
        departmentName: department.department_name,
      });

      await request_data.save();



      req.flash("info", "Payment Successful and project request sent");
      return res.redirect("back");

    }catch(error){
      throw error;
    }

  } catch (error) {
    next(error)
  }
});

// Profile Page
router.get('/profile', async (req, res, next) => {
  const person = req.user;
  res.render('client-profile', { person });
});




router.get('/client-projects', async (req, res, next) => {
  try {
    const person = req.user;
    
    // Find all projects related to the logged-in client
    const clientProjects = await Project.find({ clientId: person._id });

    res.render('client-projects', { clientProjects });
  } catch (error) {
    req.flash("error", "Internal Server Error");
    return res.redirect("back");
    next(error);
  }
});



// GET route to render the products page
router.get("/manage-services", async (req, res, next) => {
  try {
    const person = req.user;
    // Fetch services and departments
    const services = await Service.find();
    res.render("client-services", { services, person }); // Pass both services and department names to the view
  } catch (error) {
    next(error);
  }
});

module.exports = router;

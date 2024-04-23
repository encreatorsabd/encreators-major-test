const router = require('express').Router();
const User = require('../models/user.model');
const Project = require('../models/projects.model');
const Message = require('../models/messages.model');
const Employee = require('../models/employee.model');

router.get('/profile', async (req, res, next) => {
  // console.log(req.user);
  const person = req.user;
  const user = User.findById(person);
  res.render('profile', { person, user });
});


router.get('/empChat', async (req, res, next) => {
  try {
    const person = req.user;
    const users = await User.find({ role: 'CLIENT' }); // Query for clients
    let received = await Message.find({ receiver: person }).sort({ createdAt: -1 }); // Sort received messages by createdAt timestamp in descending order
    let sent = await Message.find({ sender: person }).sort({ createdAt: -1 }); // Sort sent messages by createdAt timestamp in descending order

    res.render('emp_chat', { person, users, received, sent }); // Pass person, clients, received, and sent to the template
  } catch (error) {
    console.log(error);
    req.flash('warning', 'Internal Server Error');
    res.redirect('/user/chat'); // Redirect to the chat page if an error occurs
  }
});


router.post('/emp-send', async(req, res, next) => {
  try {
    const { fromAddress, toUserId, message } = req.body;

    const person = req.user;
    const recipient = await User.findById(toUserId);

    console.log(person);
    console.log(recipient);

    const newMessage = new Message({
      sender: person._id,
      sender_name: person.name,
      sender_email: person.email,
      receiver: recipient._id,
      receiver_name: recipient.name,
      receiver_email: recipient.email,
      message: message,
    });

    await newMessage.save();
    console.log(newMessage);

    res.redirect('/user/empChat');
  } catch (error) {
    console.log(error);
    req.flash('warning', 'Internal Server Error');
  }
})



// Add routes for chat functionality
router.get('/chat', async (req, res, next) => {
  const person = req.user;
  const users = await Employee.find(); // Don't forget to await the result
  const projects = await Project.find({ clientId: req.user });
  const received = await Message.find({ receiver: person }).sort({createdAt: -1});
  const sent = await Message.find({ sender: person }).sort({createdAt: -1});
  res.render('client_chat', { person, users, projects, sent, received });
});

router.post('/client-send', async (req, res, next) => {
  try {
    const { fromAddress, toUserId, message } = req.body;


    const sender = await User.findById(req.user.id);
    const recipient = await User.findOne({ employee: toUserId });

    console.log(sender);
    console.log(recipient);

    const newMessage = new Message({
      sender: sender._id,
      sender_name: sender.name,
      sender_email: sender.email,
      receiver: recipient._id,
      receiver_name: recipient.name,
      receiver_email: recipient.email,
      message: message,
    });

    await newMessage.save();
    console.log(newMessage);

    res.redirect('/user/chat');
  } catch (error) {
    console.log(error);
    req.flash('warning', 'Internal Server Error');
  }
})




module.exports = router;

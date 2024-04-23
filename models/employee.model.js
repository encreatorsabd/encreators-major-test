const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const createHttpError = require('http-errors');
const { roles } = require('../utils/constants');

const EmployeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: false,
    unique: true
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  jobTitle: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: roles.employee,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  }
},{
  timestamps: true
});

EmployeeSchema.pre('save', async function (next) {
  try {
    if (this.isNew) {
      const count = await this.constructor.countDocuments() + 1;
      this.employeeId = 'enc' + count.toString();

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.password, salt);
      this.password = hashedPassword;
    }
    next();
  } catch (error) {
    next(error);
  }
});

EmployeeSchema.methods.isValidPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw createHttpError.InternalServerError(error.message);
  }
};

const Employee = mongoose.model('Employee', EmployeeSchema);
module.exports = Employee;

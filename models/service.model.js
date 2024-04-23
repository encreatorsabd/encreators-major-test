const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for the services collection
const serviceSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  }
},{
    timestamps: true
});

// Create a model for the services collection using the schema
const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;

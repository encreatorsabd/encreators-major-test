const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming User model represents clients
        required: true
    },
    clientEmail: {
        type: String,
        required: true
    },
    clientPhone: {
        type: String,
        required: true,
    },
    empId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee', // Assuming Employee model exists
        required: true
    },
    comp_id: { // New attribute to store employeeId
        type: String,
        required: true,
    },
    employeeName: {
        type: String,
        required: true
    },
    employeePhone: {
        type: String,
        required: true,
    },
    employeeEmail: {
        type: String,
        required: true,
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service', // Assuming Service model exists
        required: true
    },
    serviceName: {
        type: String,
        required: true
    },
    requestId: { // New attribute to store requestId
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request', // Assuming Request model exists
        required: true
    },
}, {
    timestamps: true
});


const Project = mongoose.model('Project', ProjectSchema);
module.exports = Project;

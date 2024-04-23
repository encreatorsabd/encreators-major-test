const mongoose = require('mongoose');
const { requestStatus } = require('../utils/constants');

const RequestSchema = new mongoose.Schema({
    requestUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    serviceName: {
        type: String,
        required: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    departmentName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: requestStatus.pending
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
    }
},{
    timestamps: true
});

const Request = mongoose.model('Request', RequestSchema);
module.exports = Request;

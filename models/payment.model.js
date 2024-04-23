const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentSchema = new Schema({
    customerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    customerName: {
        type: String,
        required: true,
    },
    productID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    cardNumber: {
        type: Number,
        required: true,
    },
    cvv: {
        type: Number,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    }
},{
    timestamps: true,
});

const Payment = mongoose.model('Payment',PaymentSchema);

module.exports = Payment;
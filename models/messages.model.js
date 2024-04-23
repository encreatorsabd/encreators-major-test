const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sender_name: {
        type: String,
        required: true,
    },
    sender_email: {
        type: String,
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
    },
    receiver_name: {
        type: String,
        required: true,
    },
    receiver_email: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    }
},{
    timestamps: true,
});

const Chat = mongoose.model('Chat',chatSchema);

module.exports = Chat;

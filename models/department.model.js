const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const departmentSchema = new Schema({
  department_name: {
    type: String,
    required: true,
    unique: true,
  },
},{
    timestamps: true
});

const Department = mongoose.model("Department", departmentSchema);

module.exports = Department;

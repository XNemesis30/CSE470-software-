const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  studentId: { type: String, unique: true, sparse: true }, // Made optional with sparse index
  password: { type: String, required: true },
  customerId: { type: String, unique: true },
  wallet: { type: Number, default: 0 },
  phone: { type: String, required: true }, // Changed to String type
  address: { type: String, required: true }
});

studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('Student', studentSchema);

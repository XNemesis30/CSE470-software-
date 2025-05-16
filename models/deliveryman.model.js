const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const deliverymanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  approved: { type: Boolean, default: false },
  status: { type: String, enum: ['available', 'picking up an order', 'delivering an order'], default: 'available' }
});

deliverymanSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('Deliveryman', deliverymanSchema);

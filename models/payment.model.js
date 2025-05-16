const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  method: {
    type: String,
    enum: ['CASH', 'Bkash'],
    required: true
  },
  amount: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Unpaid'],
    default: 'Unpaid'
  },
  deliveryMethod: {
    type: String,
    enum: ['Take-away', 'Home Delivery'],
    required: true
  },
  deliveryCharge: {
    type: Number,
    default: 0
  },
  items: [
    {
      foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' }, // Optional field
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema);

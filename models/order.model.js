const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, required: true },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  items: [
    {
      foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem' }, // Optional field
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true }
    }
  ],
  totalPrice: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['CASH', 'Bkash'], required: true },
  paymentStatus: { type: String, enum: ['Paid', 'Unpaid'], required: true },
  orderStatus: { type: String, enum: ['in process', 'done', 'canceled'], default: 'in process' },
  deliveryMethod: { type: String, enum: ['Take-away', 'Home Delivery'], required: true},
  deliveryCharge: { type: Number, default: 0 },
  deliverymanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deliveryman' },
  deliverymanName: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);

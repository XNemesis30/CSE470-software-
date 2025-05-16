const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  items: [
    {
      foodItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodItem',
        required: true
      },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, default: 1 },
      image: { type: String } // added image field
    }
  ],
  totalPrice: { type: Number, default: 0 }
});

module.exports = mongoose.model('Cart', cartSchema);

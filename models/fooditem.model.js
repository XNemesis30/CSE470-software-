const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, enum: ['Breakfast', 'Lunch', 'Snacks','Dinner', 'Beverages'], required: true },
  available: { type: Boolean, default: true },
  image: { type: String }, // ✅ Added image field
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
});

const FoodItem = mongoose.model('FoodItem', foodItemSchema);
module.exports = FoodItem;

const Cart = require('../models/cart.model');
const FoodItem = require('../models/fooditem.model');

// Add item to cart
const addToCart = async (req, res) => {
  const { customerId, foodItemId, quantity } = req.body;

  try {
    const foodItem = await FoodItem.findById(foodItemId);
    if (!foodItem || !foodItem.available) {
      return res.status(400).json({ message: 'Invalid or unavailable food item' });
    }

    let cart = await Cart.findOne({ customerId });

    if (!cart) {
      cart = new Cart({ customerId, items: [], totalPrice: 0 });
    }

    const existingItem = cart.items.find(item => item.foodItem.toString() === foodItemId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        foodItem: foodItemId,
        name: foodItem.name,
        price: foodItem.price,
        image: foodItem.image,
        quantity
      });
    }

    cart.totalPrice += foodItem.price * quantity;
    await cart.save();

    res.status(200).json({ message: 'Item added to cart', cart });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add item to cart', error: err.message });
  }
};

// Get cart by customerId
const getCart = async (req, res) => {
  const { customerId } = req.params;

  try {
    const cart = await Cart.findOne({ customerId }).populate('items.foodItem');
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch cart', error: err.message });
  }
};

// Clear cart by customerId
const clearCart = async (req, res) => {
  const { customerId } = req.params;

  try {
    const cart = await Cart.findOneAndDelete({ customerId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear cart', error: err.message });
  }
};

module.exports = {
  addToCart,
  getCart,
  clearCart
};

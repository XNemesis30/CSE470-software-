const FoodItem = require('../models/fooditem.model');

// Create a new food item
const createFoodItem = async (req, res) => {
  const { name, price, category, available, adminId } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const existingItem = await FoodItem.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingItem) {
      return res.status(400).json({ message: 'Food item is already in the menu.' });
    }

    const newItem = new FoodItem({ name, price, category, available, image, createdBy: adminId });
    await newItem.save();
    res.status(201).json({ message: 'Food item added successfully', item: newItem });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add food item', error: err.message });
  }
};

// Get all food items
const getAllFoodItems = async (req, res) => {
  try {
    const items = await FoodItem.find();
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch food items', error: err.message });
  }
};

// Get food items by category (only those marked as available)
const getFoodItemsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const items = await FoodItem.find({ category, available: true });
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch items by category', error: err.message });
  }
};

// Delete a food item by ID
const deleteFoodItem = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await FoodItem.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Item not found' });
    res.status(200).json({ message: 'Food item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete item', error: err.message });
  }
};

// Update a food item by ID
const updateFoodItem = async (req, res) => {
  const { id } = req.params;
  const { name, price, category, available } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    const updatedFields = { name, price, category, available };
    if (image) updatedFields.image = image;

    const updated = await FoodItem.findByIdAndUpdate(id, updatedFields, { new: true });
    if (!updated) return res.status(404).json({ message: 'Item not found' });
    res.status(200).json({ message: 'Food item updated successfully', item: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update item', error: err.message });
  }
};

module.exports = {
  createFoodItem,
  getAllFoodItems,
  getFoodItemsByCategory,
  deleteFoodItem,
  updateFoodItem
};

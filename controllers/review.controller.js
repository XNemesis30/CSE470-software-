const Review = require('../models/review.model');
const Order = require('../models/order.model');

// Create a new review
const createReview = async (req, res) => {
  const { foodItemId, customerId, customerName, rating, comment } = req.body;

  try {
    // Check if the customer has ordered this food item and it has been delivered
    const orders = await Order.find({
      customerId,
      orderStatus: 'done'
    });

    // Check if any of the customer's completed orders contain the food item
    const hasOrderedItem = orders.some(order =>
      order.items.some(item =>
        (item.foodItemId && item.foodItemId.toString() === foodItemId) ||
        // For older orders that might not have foodItemId
        item.name.toLowerCase().includes(foodItemId.toLowerCase())
      )
    );

    if (!hasOrderedItem) {
      return res.status(400).json({
        message: 'You can only review food items that you have ordered and received'
      });
    }

    // Check if the customer has already reviewed this food item
    const existingReview = await Review.findOne({ foodItemId, customerId });
    if (existingReview) {
      return res.status(400).json({
        message: 'You have already reviewed this food item'
      });
    }

    const newReview = new Review({
      foodItemId,
      customerId,
      customerName,
      rating,
      comment
    });

    await newReview.save();
    res.status(201).json({
      message: 'Review submitted successfully',
      review: newReview
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to submit review',
      error: err.message
    });
  }
};

// Get all reviews for a food item
const getReviewsByFoodItem = async (req, res) => {
  const { foodItemId } = req.params;

  try {
    const reviews = await Review.find({ foodItemId }).sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch reviews',
      error: err.message
    });
  }
};

// Update a review
const updateReview = async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  try {
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the customer is the owner of the review
    if (review.customerId !== req.body.customerId) {
      return res.status(403).json({ message: 'You can only update your own reviews' });
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();

    res.status(200).json({
      message: 'Review updated successfully',
      review
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to update review',
      error: err.message
    });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  const { id } = req.params;
  const { customerId } = req.body;

  try {
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the customer is the owner of the review
    if (review.customerId !== customerId) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    await Review.findByIdAndDelete(id);
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to delete review',
      error: err.message
    });
  }
};

module.exports = {
  createReview,
  getReviewsByFoodItem,
  updateReview,
  deleteReview
};

const express = require('express');
const {
  createReview,
  getReviewsByFoodItem,
  updateReview,
  deleteReview
} = require('../controllers/review.controller');

const router = express.Router();

// Create a new review
router.post('/', createReview);

// Get all reviews for a food item
router.get('/food/:foodItemId', getReviewsByFoodItem);

// Update a review
router.put('/:id', updateReview);

// Delete a review
router.delete('/:id', deleteReview);

module.exports = router;

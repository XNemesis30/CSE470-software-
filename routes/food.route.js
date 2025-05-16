const express = require('express');
const {
  createFoodItem,
  getAllFoodItems,
  deleteFoodItem,
  updateFoodItem,
  getFoodItemsByCategory
} = require('../controllers/food.controller');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.post('/create', upload.single('image'), createFoodItem);
router.get('/all', getAllFoodItems);
router.get('/category/:category', getFoodItemsByCategory);
router.delete('/delete/:id', deleteFoodItem);
router.put('/update/:id', upload.single('image'), updateFoodItem); // ✅ handle image update

module.exports = router;

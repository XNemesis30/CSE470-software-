// routes/order.route.js
const express = require('express');
const {
  createOrder,
  getOrderHistory,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrderWithRefund 
} = require('../controllers/order.controller');

const router = express.Router();

// Customer: create a new order
router.post('/', createOrder);

// Admin: list every order (oldest → newest)
router.get('/all-orders', getAllOrders);

// Customer: list their own orders (newest → oldest)
router.get('/:customerId', getOrderHistory);

// Update just the orderStatus (in process → done or canceled)
router.put('/update-status/:orderId', updateOrderStatus);

// **NEW** Admin: update just the paymentStatus (Unpaid → Paid)
router.put('/update-payment/:orderId', updatePaymentStatus);

router.put('/cancel-and-refund/:orderId', cancelOrderWithRefund);
module.exports = router;

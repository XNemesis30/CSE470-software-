const Order = require('../models/order.model');
const Payment = require('../models/payment.model');
const Student = require('../models/student.model'); // ✅ Needed for refund logic

// Generate a 6-digit random order ID
const generateOrderId = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create an order from the latest payment
async function createOrder(req, res) {
  const { customerId, customerName } = req.body;
  try {
    const payment = await Payment.findOne({ customerId }).sort({ createdAt: -1 });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const order = new Order({
      orderId: generateOrderId(),
      customerId,
      customerName,
      items: payment.items,
      totalPrice: payment.amount,
      paymentMethod: payment.method,
      paymentStatus: payment.paymentStatus
    });

    await order.save();
    res.status(200).json({ message: 'Order created', orderId: order.orderId });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create order', error: err.message });
  }
}

// Automatically mark orders older than 15 minutes as "done"
async function markOrdersAsDone() {
  const cutoffTime = new Date(Date.now() - 15 * 60 * 1000);
  await Order.updateMany(
    { createdAt: { $lte: cutoffTime }, orderStatus: 'in process' },
    { $set: { orderStatus: 'done' } }
  );
}

// Customer: get their order history (newest first)
async function getOrderHistory(req, res) {
  const { customerId } = req.params;
  try {
    const orders = await Order.find({ customerId }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch order history', error: err.message });
  }
}

// Admin: get every order (oldest first)
async function getAllOrders(req, res) {
  try {
    const orders = await Order.find().sort({ createdAt: 1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
}

// Update an order's orderStatus field
async function updateOrderStatus(req, res) {
  const { orderId } = req.params;
  const { orderStatus } = req.body;
  try {
    const updated = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json({ message: 'Order status updated', updated });
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
}

// **NEW** Update an order's paymentStatus field
async function updatePaymentStatus(req, res) {
  const { orderId } = req.params;
  const { paymentStatus } = req.body;
  try {
    const updated = await Order.findByIdAndUpdate(
      orderId,
      { paymentStatus },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Order not found' });
    res.status(200).json({ message: 'Payment status updated', updated });
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
}

// ✅ Refund 40% to wallet if order paid with Bkash and gets canceled
async function cancelOrderWithRefund(req, res) {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Update order status
    order.orderStatus = 'canceled';
    await order.save();

    if (order.paymentMethod === 'Bkash' && order.paymentStatus === 'Paid') {
      const refundAmount = Math.floor(order.totalPrice * 0.4);
      const student = await Student.findOne({ customerId: order.customerId });

      if (student) {
        student.wallet += refundAmount;
        await student.save();
        return res.status(200).json({
          message: 'Order canceled and wallet refunded 40%',
          walletRefund: refundAmount,
          wallet: student.wallet
        });
      }
    }

    res.status(200).json({ message: 'Order canceled (no refund needed)' });
  } catch (err) {
    res.status(500).json({ message: 'Cancellation failed', error: err.message });
  }
}

module.exports = {
  createOrder,
  markOrdersAsDone,
  getOrderHistory,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrderWithRefund // ✅ Exported here
};

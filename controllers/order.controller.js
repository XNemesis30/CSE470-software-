const Order = require('../models/order.model');
const Payment = require('../models/payment.model');
const Student = require('../models/student.model');
const Deliveryman = require('../models/deliveryman.model');

function generateOrderId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createOrder(req, res) {
  const { customerId, customerName } = req.body;
  try {
    const payment = await Payment.findOne({ customerId }).sort({ createdAt: -1 });
    if (!payment) return res.status(404).json({ message: 'Payment not found'});

    const student = await Student.findOne({ customerId });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Ensure all required fields are present in the order items
    const orderItems = payment.items.map(item => {
      return {
        foodItemId: item.foodItemId, // This is optional
        name: item.name,
        price: item.price,
        quantity: item.quantity
      };
    });

    // Ensure we have valid phone and address values
    const phone = student.phone ? student.phone.toString() : '0000000000';
    const address = student.address || 'Default Address';

    const order = new Order({
      orderId: generateOrderId(),
      customerId,
      customerName,
      phone: phone,
      address: address,
      items: orderItems,
      totalPrice: payment.amount,
      paymentMethod: payment.method,
      paymentStatus: payment.paymentStatus,
      deliveryMethod: payment.deliveryMethod,
      deliveryCharge: payment.deliveryCharge
    });

    await order.save();

    res.status(200).json({ message: 'Order created', orderId: order.orderId });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({
      message: 'Failed to create order',
      error: err.message,
      details: err.stack
    });
  }
}

async function markOrdersAsDone() {
  const cutoffTime = new Date(Date.now() - 15 * 60 * 1000);
  await Order.updateMany(
    { createdAt: { $lte: cutoffTime }, orderStatus: 'in process' },
    { $set: { orderStatus: 'done' } }
  );
}

async function getOrderHistory(req, res) {
  const { customerId } = req.params;
  try {
    const orders = await Order.find({ customerId }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch order history', error: err.message });
  }
}

async function getAllOrders(req, res) {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
}

// Get orders assigned to a specific deliveryman
async function getDeliverymanOrders(req, res) {
  const { deliverymanId } = req.params;

  try {
    const orders = await Order.find({
      deliverymanId: deliverymanId
    }).sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch deliveryman orders',
      error: err.message
    });
  }
}

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

async function cancelOrderWithRefund(req, res) {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.orderStatus = 'canceled';
    await order.save();

    if (order.paymentMethod === 'Bkash' && order.paymentStatus === 'Paid') {
      const refundAmount = Math.floor(order.totalPrice * 0.4);
      const student = await Student.findOne({ customerId: order.customerId });

      if (student) {
        // Update wallet balance using findByIdAndUpdate to avoid validation issues
        await Student.findByIdAndUpdate(
          student._id,
          { $inc: { wallet: refundAmount } }
        );

        // Get the updated wallet balance
        const updatedStudent = await Student.findById(student._id);

        return res.status(200).json({
          message: 'Order canceled and wallet refunded 40%',
          walletRefund: refundAmount,
          wallet: updatedStudent.wallet
        });
      }
    }

    res.status(200).json({ message: 'Order canceled (no refund needed)' });
  } catch (err) {
    res.status(500).json({ message: 'Cancellation failed', error: err.message });
  }
}

// Assign deliveryman to an order
async function assignDeliveryman(req, res) {
  const { orderId } = req.params;
  const { deliverymanId } = req.body;

  try {
    // Check if the order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the order is for home delivery
    if (order.deliveryMethod !== 'Home Delivery') {
      return res.status(400).json({ message: 'This order is not for home delivery' });
    }

    // Check if the deliveryman exists and is approved
    const deliveryman = await Deliveryman.findById(deliverymanId);
    if (!deliveryman) {
      return res.status(404).json({ message: 'Deliveryman not found' });
    }

    if (!deliveryman.approved) {
      return res.status(400).json({ message: 'This deliveryman is not approved yet' });
    }

    // Check if the deliveryman is available
    if (deliveryman.status !== 'available') {
      return res.status(400).json({ message: 'This deliveryman is not available' });
    }

    // Update the order with the deliveryman information
    order.deliverymanId = deliverymanId;
    order.deliverymanName = deliveryman.name;
    await order.save();

    res.status(200).json({
      message: 'Deliveryman assigned successfully',
      order
    });
  } catch (err) {
    console.error('Error assigning deliveryman:', err);
    res.status(500).json({
      message: 'Failed to assign deliveryman',
      error: err.message
    });
  }
}

module.exports = {
  createOrder,
  markOrdersAsDone,
  getOrderHistory,
  getAllOrders,
  getDeliverymanOrders,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrderWithRefund,
  assignDeliveryman,
  generateOrderId // Export for testing
};

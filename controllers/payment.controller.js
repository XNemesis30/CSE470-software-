const Cart = require('../models/cart.model');
const Payment = require('../models/payment.model');

const processPayment = async (req, res) => {
  const { customerId, method, paymentStatus } = req.body;

  try {
    const cart = await Cart.findOne({ customerId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty or not found' });
    }

    if (method === 'Bkash' && paymentStatus !== 'Paid') {
      return res.status(400).json({ message: 'Bkash payment must be completed before confirming order' });
    }

    const paymentRecord = new Payment({
      customerId,
      method,
      amount: cart.totalPrice,
      paymentStatus: paymentStatus || (method === 'CASH' ? 'Paid' : 'Unpaid'),
      items: cart.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    });

    await paymentRecord.save();
    await Cart.findOneAndDelete({ customerId });

    res.status(200).json({ message: `Payment successful via ${method}`, payment: paymentRecord });
  } catch (err) {
    res.status(500).json({ message: 'Payment failed', error: err.message });
  }
};

module.exports = { processPayment };

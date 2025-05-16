const Cart = require('../models/cart.model');
const Payment = require('../models/payment.model');
const Student = require('../models/student.model');
const FoodItem = require('../models/fooditem.model');

const processPayment = async (req, res) => {
  const { customerId, method, paymentStatus, deliveryMethod } = req.body;

  try {
    const cart = await Cart.findOne({ customerId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty or not found' });
    }

    const student = await Student.findOne({ customerId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    let usedWalletAmount = 0;
    let finalAmount = cart.totalPrice;

    // Determine delivery charge
    let deliveryCharge = deliveryMethod === 'Home Delivery' ? 40 : 0;
    finalAmount += deliveryCharge;

    // Wallet deduction logic
    if (student.wallet > 0 && finalAmount > student.wallet) {
      usedWalletAmount = Math.min(student.wallet, finalAmount);
      finalAmount -= usedWalletAmount;

      // Update wallet balance using findByIdAndUpdate to avoid validation issues
      await Student.findByIdAndUpdate(
        student._id,
        { $inc: { wallet: -usedWalletAmount } }
      );

      // Update the student object for the response
      student.wallet -= usedWalletAmount;
    }

    if (method === 'Bkash' && paymentStatus !== 'Paid') {
      return res.status(400).json({ message: 'Bkash payment must be completed before confirming order' });
    }

    // Safely map cart items to payment items
    const paymentItems = cart.items.map(item => {
      try {
        // Create a safe item object with required fields
        const safeItem = {
          name: item.name || 'Unknown Item',
          quantity: item.quantity || 1,
          price: item.price || 0
        };

        // Try to add foodItemId if available
        if (item.foodItem) {
          if (typeof item.foodItem === 'string') {
            safeItem.foodItemId = item.foodItem;
          } else if (item.foodItem._id) {
            safeItem.foodItemId = item.foodItem._id;
          }
        }

        return safeItem;
      } catch (itemErr) {
        console.error('Error processing cart item:', itemErr);
        // Return a minimal valid item if there's an error
        return {
          name: 'Error processing item',
          quantity: 1,
          price: 0
        };
      }
    });

    const paymentRecord = new Payment({
      customerId,
      method,
      amount: finalAmount,
      paymentStatus: paymentStatus || (method === 'CASH' ? 'Paid' : 'Unpaid'),
      deliveryMethod,
      deliveryCharge,
      items: paymentItems
    });

    await paymentRecord.save();
    await Cart.findOneAndDelete({ customerId });

    res.status(200).json({
      message: `Payment successful via ${method}`,
      payment: paymentRecord,
      refundUsed: usedWalletAmount > 0,
      walletUsedAmount: usedWalletAmount,
      updatedWallet: student.wallet
    });
  } catch (err) {
    console.error('Payment processing error:', err);
    res.status(500).json({
      message: 'Payment failed',
      error: err.message,
      details: err.stack
    });
  }
};

module.exports = { processPayment };

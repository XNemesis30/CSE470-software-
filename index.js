require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3001;
const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
const studentRoute = require('./routes/student.route');
const adminRoute = require('./routes/admin.route');
const foodRoute = require('./routes/food.route');
const cartRoute = require('./routes/cart.route');
const paymentRoute = require('./routes/payment.route');
const orderRoute = require('./routes/order.route');
const cancelRoute = require('./routes/cancel.route'); // ✅ Add this if using wallet refund on cancel
const deliverymanRoutes = require('./routes/deliveryman.route');
const reviewRoute = require('./routes/review.route'); // ✅ Added review route

// Route registration
app.use('/api/students', studentRoute);
app.use('/api/admins', adminRoute);
app.use('/api/food', foodRoute);
app.use('/api/cart', cartRoute);
app.use('/api/payment', paymentRoute);
app.use('/api/orders', orderRoute);
app.use('/api/cancel', cancelRoute); // ✅ Register cancel route
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/deliveryman', deliverymanRoutes);
app.use('/api/reviews', reviewRoute); // ✅ Register review route

// MongoDB connection
mongoose
  .connect('mongodb+srv://tanzimadelowar08:gGfBiB7C1hi52PN8@cafeteria.if4gwts.mongodb.net/?retryWrites=true&w=majority&appName=cafeteria')
  .then(() => {
    console.log('✅ Connected to DB');
  })
  .catch((error) => {
    console.error('❌ Connection failed!', error);
  });

// Automatically update order status to "done" after 15 mins
const { markOrdersAsDone } = require('./controllers/order.controller');
setInterval(markOrdersAsDone, 60 * 1000); // ✅ Check every 1 minute

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

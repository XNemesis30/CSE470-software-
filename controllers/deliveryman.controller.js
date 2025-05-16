const bcrypt = require('bcryptjs');
const Deliveryman = require('../models/deliveryman.model');

// Register Deliveryman
const registerDeliveryman = async (req, res) => {
  const { name, email, phone, employeeId, password } = req.body;

  try {
    const existing = await Deliveryman.findOne({ $or: [{ email }, { employeeId }] });
    if (existing) return res.status(400).json({ message: 'Email or Employee ID already registered' });

    const newDeliveryman = new Deliveryman({ name, email, phone, employeeId, password }); // status defaults to 'available'
    await newDeliveryman.save();

    res.status(201).json({ message: "Request pending! Waiting for admin's approval" });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};




// Login Deliveryman
const loginDeliveryman = async (req, res) => {
  const { email, password } = req.body;

  try {
    const deliveryman = await Deliveryman.findOne({ email });
    if (!deliveryman) return res.status(400).json({ message: 'Invalid email or password' });

    if (!deliveryman.approved) {
      return res.status(403).json({ message: 'Your request is still pending approval' });
    }

    const isMatch = await bcrypt.compare(password, deliveryman.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    res.status(200).json({ message: 'Login successful', deliveryman });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get Pending Requests
const getPendingRequests = async (req, res) => {
  try {
    const requests = await Deliveryman.find({ approved: false });
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching requests', error: err.message });
  }
};

// Approve Request
const approveDeliveryman = async (req, res) => {
  try {
    const deliveryman = await Deliveryman.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    if (!deliveryman) return res.status(404).json({ message: 'Deliveryman not found' });
    res.status(200).json({ message: 'Deliveryman approved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Approval failed', error: err.message });
  }
};

// Deny Request
const denyDeliveryman = async (req, res) => {
  try {
    await Deliveryman.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Request denied and deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Deny failed', error: err.message });
  }
};

// Get all approved deliverymen
const getApprovedDeliverymen = async (req, res) => {
  try {
    const deliverymen = await Deliveryman.find({ approved: true });
    res.status(200).json(deliverymen);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching deliverymen', error: err.message });
  }
};

// Update deliveryman status
const updateDeliverymanStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const validStatuses = ['available', 'picking up an order', 'delivering an order'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const deliveryman = await Deliveryman.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!deliveryman) {
      return res.status(404).json({ message: 'Deliveryman not found' });
    }

    res.status(200).json({
      message: 'Status updated successfully',
      deliveryman
    });
  } catch (err) {
    res.status(500).json({ message: 'Status update failed', error: err.message });
  }
};

module.exports = {
  registerDeliveryman,
  loginDeliveryman,
  getPendingRequests,
  approveDeliveryman,
  denyDeliveryman,
  getApprovedDeliverymen,
  updateDeliverymanStatus
};

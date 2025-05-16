const bcrypt = require('bcryptjs');
const Admin = require('../models/admin.model');

const SECURITY_ID = '6485';

// Register Admin
const registerAdmin = async (req, res) => {
  const { name, email, employeeId, password, securityId } = req.body;

  if (securityId !== SECURITY_ID) {
    return res.status(403).json({ message: 'Invalid Security ID' });
  }

  try {
    // Check if email already exists
    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Check if employeeId already exists
    const existingEmployeeId = await Admin.findOne({ employeeId });
    if (existingEmployeeId) {
      return res.status(400).json({ message: 'Employee ID already exists' });
    }

    // Create new admin
    const newAdmin = new Admin({
      name,
      email,
      employeeId,
      password
    });

    await newAdmin.save();

    console.log('Admin registered successfully:', {
      id: newAdmin._id,
      name: newAdmin.name,
      email: newAdmin.email
    });

    res.status(201).json({
      message: 'Admin registered successfully',
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email
      }
    });
  } catch (err) {
    console.error('Admin registration error:', err);
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};

// Login Admin
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Login attempt for email:', email);

    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log('Admin not found with email:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.log('Password does not match for email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('Admin login successful:', {
      id: admin._id,
      name: admin.name,
      email: admin.email
    });

    res.status(200).json({
      message: 'Login successful',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        employeeId: admin.employeeId
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};

module.exports = { registerAdmin, loginAdmin };

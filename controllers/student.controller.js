const bcrypt = require('bcryptjs');
const Student = require('../models/student.model');
const crypto = require('crypto');

const generateCustomerId = (email) => {
  return 'CUST-' + crypto.createHash('sha256').update(email).digest('hex').slice(0, 10).toUpperCase();
};

// Register
const registerStudent = async (req, res) => {
  const { name, email, studentId, password, phone, address } = req.body;
  try {
    // Check if email already exists
    const existingEmail = await Student.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check if studentId exists and is already taken
    if (studentId) {
      const existingStudentId = await Student.findOne({ studentId });
      if (existingStudentId) {
        return res.status(400).json({ message: 'Student ID already registered' });
      }
    }

    const customerId = generateCustomerId(email);

    // Create student object with required fields
    const studentData = {
      name,
      email,
      password,
      customerId,
      phone,
      address
    };

    // Add studentId if provided
    if (studentId) {
      studentData.studentId = studentId;
    }

    const newStudent = new Student(studentData);
    await newStudent.save();

    // Return success response
    res.status(201).json({
      message: 'Registration successful',
      customerId,
      wallet: newStudent.wallet
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Login
const loginStudent = async (req, res) => {
  const { email, password } = req.body;
  try {
    const student = await Student.findOne({ email });
    if (!student) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    // Create student object with all available fields
    const studentData = {
      id: student._id,
      name: student.name,
      email: student.email,
      customerId: student.customerId,
      wallet: student.wallet,
      phone: student.phone,
      address: student.address
    };

    // Add studentId if it exists
    if (student.studentId) {
      studentData.studentId = student.studentId;
    }

    res.status(200).json({
      message: 'Login successful',
      student: studentData
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update Profile
const updateStudentProfile = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, phone, address } = req.body;

  try {
    const updateData = { name, email, phone, address };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedStudent = await Student.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedStudent) return res.status(404).json({ message: 'Student not found' });

    // Create student object with all available fields
    const studentData = {
      id: updatedStudent._id,
      name: updatedStudent.name,
      email: updatedStudent.email,
      customerId: updatedStudent.customerId,
      wallet: updatedStudent.wallet,
      phone: updatedStudent.phone,
      address: updatedStudent.address
    };

    // Add studentId if it exists
    if (updatedStudent.studentId) {
      studentData.studentId = updatedStudent.studentId;
    }

    return res.status(200).json({
      message: 'Student profile updated successfully',
      student: studentData
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email or Student ID already exists' });
    }
    return res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

module.exports = {
  registerStudent,
  loginStudent,
  updateStudentProfile
};

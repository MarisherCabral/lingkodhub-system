const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

// ✅ REGISTER
router.post('/register', async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const user = new User({ fullName, email, password });
    await user.save();

    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    res.json({
      message: 'Login successful',
      user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET USER PROFILE
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.log('GET PROFILE ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ UPDATE USER PROFILE
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (!fullName || !email) {
      return res.status(400).json({ message: 'Full name and email are required' });
    }

    const existingEmail = await User.findOne({
      email,
      _id: { $ne: id }
    });

    if (existingEmail) {
      return res.status(409).json({ message: 'Email is already in use' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { fullName, email },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.log('UPDATE PROFILE ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
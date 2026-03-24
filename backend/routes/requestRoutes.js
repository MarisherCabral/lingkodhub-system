const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Request = require('../models/request');

// ============================
// CREATE REQUEST
// ============================
router.post('/', async (req, res) => {
  try {
    const { userId, type, purpose, notes, date } = req.body;

    console.log('POST /api/requests BODY:', req.body);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (!type || !purpose || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newRequest = new Request({
      userId,
      type,
      purpose,
      notes,
      date
    });

    await newRequest.save();

    console.log('Request saved:', newRequest._id);

    res.status(201).json({
      message: 'Request submitted',
      request: newRequest
    });
  } catch (err) {
    console.log('CREATE ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// ============================
// GET USER REQUESTS
// ============================
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('GET /api/requests/:userId');
    console.log('userId:', userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const requests = await Request.find({ userId }).sort({ date: -1 });

    console.log('Requests found:', requests.length);

    res.status(200).json(requests);
  } catch (err) {
    console.log('GET ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
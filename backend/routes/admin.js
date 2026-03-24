const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Request = require('../models/request');
const Appointment = require('../models/appointment');
const Availability = require('../models/availability');

router.get('/test', (req, res) => {
  res.json({ message: 'admin route works' });
});

router.get('/dashboard', async (req, res) => {
  try {
    const requests = await Request.find()
      .populate('userId', 'fullName email role')
      .sort({ date: -1, createdAt: -1 });

    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;

    res.json({
      summary: { total, pending, approved, rejected },
      requests
    });
  } catch (err) {
    console.log('ADMIN DASHBOARD ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('userId', 'fullName email role')
      .sort({ date: 1, createdAt: -1 });

    res.json(appointments);
  } catch (err) {
    console.log('ADMIN APPOINTMENTS ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

router.put('/appointments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }

    if (!['pending', 'approved', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('userId', 'fullName email role');

    if (!updatedAppointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });
  } catch (err) {
    console.log('ADMIN APPOINTMENT UPDATE ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

router.put('/requests/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updatedRequest = await Request.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('userId', 'fullName email role');

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({
      message: 'Request updated successfully',
      request: updatedRequest
    });
  } catch (err) {
    console.log('ADMIN REQUEST UPDATE ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET ALL AVAILABLE SCHEDULES
router.get('/availability', async (req, res) => {
  try {
    const availability = await Availability.find()
      .sort({ date: 1 });

    res.json(availability);
  } catch (err) {
    console.log('ADMIN AVAILABILITY ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// CREATE AVAILABLE SCHEDULE
router.post('/availability', async (req, res) => {
  try {
    const { service, date, slots } = req.body;

    if (!service || !date || !slots || !slots.length) {
      return res.status(400).json({ message: 'Service, date, and slots are required' });
    }

    const existing = await Availability.findOne({
      service,
      date: new Date(date)
    });

    if (existing) {
      return res.status(409).json({ message: 'Schedule already exists for this date and service' });
    }

    const availability = new Availability({
      service,
      date,
      slots
    });

    await availability.save();

    res.status(201).json({
      message: 'Availability created successfully',
      availability
    });
  } catch (err) {
    console.log('CREATE AVAILABILITY ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE AVAILABLE SCHEDULE
router.delete('/availability/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Availability.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    res.json({ message: 'Availability deleted successfully' });
  } catch (err) {
    console.log('DELETE AVAILABILITY ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
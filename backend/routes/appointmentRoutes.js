const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const Availability = require('../models/availability');

function isValidDateString(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

function isValidTimeString(timeStr) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr);
}

function getDayRange(dateStr) {
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(`${dateStr}T23:59:59.999Z`);
  return { start, end };
}

/**
 * ADMIN AVAILABILITY
 */

// get all availability for admin
router.get('/admin/availability', async (req, res) => {
  try {
    const { service } = req.query;

    const query = {};
    if (service) query.service = service;

    const availability = await Availability.find(query).sort({ date: 1, service: 1 });
    res.json(availability);
  } catch (err) {
    console.log('GET ADMIN AVAILABILITY ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// add availability
router.post('/admin/availability', async (req, res) => {
  try {
    const { service, date, slots } = req.body;

    if (!service || !date) {
      return res.status(400).json({ message: 'Service and date are required' });
    }

    if (!isValidDateString(date)) {
      return res.status(400).json({ message: 'Date must be in YYYY-MM-DD format' });
    }

    let finalSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

    if (Array.isArray(slots) && slots.length > 0) {
      const cleanedSlots = [...new Set(slots.map((slot) => String(slot).trim()))];
      const invalidSlot = cleanedSlots.find((slot) => !isValidTimeString(slot));

      if (invalidSlot) {
        return res.status(400).json({ message: `Invalid slot format: ${invalidSlot}` });
      }

      finalSlots = cleanedSlots.sort();
    }

    const existing = await Availability.findOne({ service, date });
    if (existing) {
      return res.status(409).json({ message: 'Availability already exists for this service and date' });
    }

    const availability = new Availability({
      service,
      date,
      slots: finalSlots,
      isOpen: true
    });

    await availability.save();

    res.status(201).json({
      message: 'Availability added successfully',
      availability
    });
  } catch (err) {
    console.log('ADD AVAILABILITY ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// update availability
router.patch('/admin/availability/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isOpen, slots } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid availability ID' });
    }

    const updateData = {};

    if (typeof isOpen === 'boolean') {
      updateData.isOpen = isOpen;
    }

    if (Array.isArray(slots)) {
      const cleanedSlots = [...new Set(slots.map((slot) => String(slot).trim()))];
      const invalidSlot = cleanedSlots.find((slot) => !isValidTimeString(slot));

      if (invalidSlot) {
        return res.status(400).json({ message: `Invalid slot format: ${invalidSlot}` });
      }

      updateData.slots = cleanedSlots.sort();
    }

    const updated = await Availability.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    res.json({
      message: 'Availability updated successfully',
      availability: updated
    });
  } catch (err) {
    console.log('UPDATE AVAILABILITY ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// delete availability
router.delete('/admin/availability/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid availability ID' });
    }

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

/**
 * PUBLIC AVAILABILITY
 */

router.get('/available', async (req, res) => {
  try {
    const { service } = req.query;

    const query = { isOpen: true };
    if (service) query.service = service;

    const availability = await Availability.find(query).sort({ date: 1 });
    res.json(availability);
  } catch (err) {
    console.log('GET AVAILABLE ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/availability/:service/:date', async (req, res) => {
  try {
    const { service, date } = req.params;

    if (!isValidDateString(date)) {
      return res.status(400).json({ message: 'Date must be in YYYY-MM-DD format' });
    }

    const availabilityDoc = await Availability.findOne({
      service,
      date,
      isOpen: true
    });

    if (!availabilityDoc) {
      return res.json({
        bookedTimes: [],
        availableSlots: []
      });
    }

    const { start, end } = getDayRange(date);

    const appointments = await Appointment.find({
      service,
      date: { $gte: start, $lte: end },
      status: { $in: ['pending', 'approved'] }
    }).select('time');

    const bookedTimes = appointments.map((a) => a.time);
    const availableSlots = availabilityDoc.slots.filter((slot) => !bookedTimes.includes(slot));

    res.json({
      bookedTimes,
      availableSlots
    });
  } catch (err) {
    console.log('CHECK AVAILABILITY ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * APPOINTMENTS
 */

// create appointment
router.post('/', async (req, res) => {
  try {
    const { userId, service, date, time, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (!service || !date || !time) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!isValidDateString(date)) {
      return res.status(400).json({ message: 'Date must be in YYYY-MM-DD format' });
    }

    if (!isValidTimeString(time)) {
      return res.status(400).json({ message: 'Time must be in HH:mm format' });
    }

    const availabilityDoc = await Availability.findOne({
      service,
      date,
      isOpen: true
    });

    if (!availabilityDoc) {
      return res.status(400).json({ message: 'Selected date is not available for this service' });
    }

    if (!availabilityDoc.slots.includes(time)) {
      return res.status(400).json({ message: 'Selected time is not available for this date' });
    }

    const { start, end } = getDayRange(date);

    const existing = await Appointment.findOne({
      service,
      date: { $gte: start, $lte: end },
      time,
      status: { $in: ['pending', 'approved'] }
    });

    if (existing) {
      return res.status(409).json({ message: 'Selected time slot is no longer available' });
    }

    const appointment = new Appointment({
      userId,
      service,
      date: new Date(`${date}T00:00:00.000Z`),
      time,
      notes: notes || '',
      status: 'pending'
    });

    await appointment.save();

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment
    });
  } catch (err) {
    console.log('CREATE APPOINTMENT ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// user appointments
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const appointments = await Appointment.find({ userId }).sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (err) {
    console.log('GET USER APPOINTMENTS ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// admin list
router.get('/admin/list', async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('userId', 'fullName email role')
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (err) {
    console.log('GET ADMIN APPOINTMENTS ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

// update appointment status
router.put('/admin/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'approved', 'completed', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('userId', 'fullName email role');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({
      message: 'Appointment status updated successfully',
      appointment
    });
  } catch (err) {
    console.log('UPDATE APPOINTMENT STATUS ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
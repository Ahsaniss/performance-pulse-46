const express = require('express');
const router = express.Router();
const {
  getAttendance,
  getAttendanceRecord,
  createAttendance,
  updateAttendance,
  deleteAttendance
} = require('../controllers/attendanceController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .get(protect, getAttendance)
  .post(protect, createAttendance);

router.route('/:id')
  .get(protect, getAttendanceRecord)
  .put(protect, updateAttendance)
  .delete(protect, admin, deleteAttendance);

module.exports = router;

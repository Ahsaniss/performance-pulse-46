const express = require('express');
const router = express.Router();
const {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting
} = require('../controllers/meetingController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .get(protect, getMeetings)
  .post(protect, admin, createMeeting);

router.route('/:id')
  .get(protect, getMeeting)
  .put(protect, admin, updateMeeting)
  .delete(protect, admin, deleteMeeting);

module.exports = router;

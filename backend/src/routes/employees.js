const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .get(protect, getEmployees)
  .post(protect, admin, createEmployee);

router.route('/:id')
  .get(protect, getEmployee)
  .put(protect, admin, updateEmployee)
  .delete(protect, admin, deleteEmployee);

module.exports = router;

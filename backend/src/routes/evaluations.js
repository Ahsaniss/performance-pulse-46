const express = require('express');
const router = express.Router();
const {
  getEvaluations,
  getEvaluation,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  generateMonthlyEvaluations,
  overrideEvaluation
} = require('../controllers/evaluationController');
const { protect, admin } = require('../middleware/auth');

router.route('/generate-automated')
  .post(protect, admin, generateMonthlyEvaluations);

router.route('/:id/override')
  .put(protect, admin, overrideEvaluation);

router.route('/')
  .get(protect, getEvaluations)
  .post(protect, admin, createEvaluation);

router.route('/:id')
  .get(protect, getEvaluation)
  .put(protect, admin, updateEvaluation)
  .delete(protect, admin, deleteEvaluation);

module.exports = router;

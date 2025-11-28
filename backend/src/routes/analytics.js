const express = require('express');
const router = express.Router();
const { getEmployeeAnalytics, getAIInsight, chatWithAI } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/employee/:id', getEmployeeAnalytics);
router.post('/ai-insight', getAIInsight);
router.post('/chat', chatWithAI);

module.exports = router;

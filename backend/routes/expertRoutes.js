const express = require('express');
const { getExperts, getExpertById, getRecommendedExperts } = require('../controllers/expertController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.get('/recommended', protect, getRecommendedExperts);
router.get('/', protect, getExperts);
router.get('/:id', getExpertById);
module.exports = router;

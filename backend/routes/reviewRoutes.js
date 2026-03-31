const express = require('express');
const { createReview, getExpertReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.post('/', protect, createReview);
router.get('/expert/:expertId', getExpertReviews);
module.exports = router;

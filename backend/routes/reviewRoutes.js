const express = require('express');
const { createReview, getExpertReviews, canReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.post('/', protect, createReview);
router.get('/can-review/:bookingId', protect, canReview);
router.get('/expert/:expertId', getExpertReviews);
module.exports = router;

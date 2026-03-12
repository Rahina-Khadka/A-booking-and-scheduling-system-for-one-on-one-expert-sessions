const express = require('express');
const {
  createReview,
  getExpertReviews,
  canReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Review routes
router.post('/', protect, createReview);
router.get('/expert/:expertId', getExpertReviews);
router.get('/can-review/:bookingId', protect, canReview);

module.exports = router;

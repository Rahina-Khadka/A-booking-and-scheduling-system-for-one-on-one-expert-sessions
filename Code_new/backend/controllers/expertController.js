const User = require('../models/User');
const RecommendationService = require('../services/recommendationService');

/**
 * @desc    Get all experts
 * @route   GET /api/experts
 * @access  Public
 */
const getExperts = async (req, res) => {
  try {
    const { expertise, search } = req.query;
    
    let query = { role: 'expert' };

    // Filter by expertise if provided
    if (expertise) {
      query.expertise = { $in: [expertise] };
    }

    // Search by name if provided
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const experts = await User.find(query)
      .select('name email expertise rating totalRatings bio availability profilePicture hourlyRate isOnline');

    res.json(experts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get expert by ID
 * @route   GET /api/experts/:id
 * @access  Public
 */
const getExpertById = async (req, res) => {
  try {
    const expert = await User.findOne({ 
      _id: req.params.id, 
      role: 'expert' 
    }).select('name email expertise rating totalRatings bio availability profilePicture hourlyRate isOnline');

    if (expert) {
      res.json(expert);
    } else {
      res.status(404).json({ message: 'Expert not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get recommended experts for logged-in user
 * @route   GET /api/experts/recommended
 * @access  Private
 */
const getRecommendedExperts = async (req, res) => {
  try {
    const recommendedExperts = await RecommendationService.getRecommendedExperts(req.user._id);
    res.json(recommendedExperts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getExperts,
  getExpertById,
  getRecommendedExperts
};

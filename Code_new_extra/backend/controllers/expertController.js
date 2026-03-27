const User = require('../models/User');
const recommendationService = require('../services/recommendationService');

const getExperts = async (req, res) => {
  try {
    const experts = await User.find({ role: 'expert', verificationStatus: 'approved' }).select('-password').sort({ rating: -1 });
    res.json(experts);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getExpertById = async (req, res) => {
  try {
    const expert = await User.findOne({ _id: req.params.id, role: 'expert' }).select('-password');
    if (!expert) return res.status(404).json({ message: 'Expert not found' });
    res.json(expert);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getRecommendedExperts = async (req, res) => {
  try {
    const experts = await recommendationService.getRecommendations(req.user);
    res.json(experts);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getExperts, getExpertById, getRecommendedExperts };

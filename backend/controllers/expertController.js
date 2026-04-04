const User = require('../models/User');
const recommendationService = require('../services/recommendationService');

const getExperts = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const experts = await User.find({ role: 'expert', name: { $exists: true, $ne: null } })
      .select('_id name email expertise rating totalRatings bio availability profilePicture hourlyRate isOnline verificationStatus portfolio paymentQr')
      .sort({ rating: -1 });
    // toJSON transform on schema ensures _id is a plain string
    res.json(experts);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getExpertById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ message: 'Invalid expert ID' });
    }
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return res.status(400).json({ message: `Invalid expert ID format: "${id}"` });
    }
    const expert = await User.findOne({ _id: id, role: 'expert' })
      .select('_id name email expertise rating totalRatings bio availability profilePicture hourlyRate isOnline verificationStatus portfolio paymentQr');
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

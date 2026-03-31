const User = require('../models/User');
const recommendationService = require('../services/recommendationService');

const getExperts = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const experts = await User.find({ role: 'expert', name: { $exists: true, $ne: null } })
      .select('_id name email expertise rating totalRatings bio availability profilePicture hourlyRate isOnline verificationStatus portfolio paymentQr')
      .sort({ rating: -1 })
      .lean();
    // Ensure _id is always a plain string in the response
    const result = experts.map(e => ({ ...e, _id: e._id.toString() }));
    res.json(result);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getExpertById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ message: 'Invalid expert ID' });
    }
    // Validate ObjectId format before querying
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return res.status(400).json({ message: 'Invalid expert ID format' });
    }
    const expert = await User.findOne({ _id: id, role: 'expert' })
      .select('_id name email expertise rating totalRatings bio availability profilePicture hourlyRate isOnline verificationStatus portfolio paymentQr')
      .lean();
    if (!expert) return res.status(404).json({ message: 'Expert not found' });
    res.json({ ...expert, _id: expert._id.toString() });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getRecommendedExperts = async (req, res) => {
  try {
    const experts = await recommendationService.getRecommendations(req.user);
    res.json(experts);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getExperts, getExpertById, getRecommendedExperts };

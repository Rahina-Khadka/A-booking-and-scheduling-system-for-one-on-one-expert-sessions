const User = require('../models/User');

const getRecommendations = async (currentUser) => {
  try {
    const query = { role: 'expert', verificationStatus: 'approved' };
    // If user has interests, try to match experts with those expertise
    if (currentUser?.interests?.length > 0) {
      query.expertise = { $in: currentUser.interests };
    }
    let experts = await User.find(query).select('-password').sort({ rating: -1 }).limit(10);
    // Fallback to top-rated if no matches
    if (experts.length === 0) {
      experts = await User.find({ role: 'expert', verificationStatus: 'approved' }).select('-password').sort({ rating: -1 }).limit(10);
    }
    return experts;
  } catch (error) {
    console.error('Recommendation error:', error);
    return [];
  }
};

module.exports = { getRecommendations };

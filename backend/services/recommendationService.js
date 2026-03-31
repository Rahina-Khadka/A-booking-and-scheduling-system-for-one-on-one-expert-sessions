const User = require('../models/User');

const getRecommendations = async (currentUser) => {
  try {
    const query = { role: 'expert' };
    if (currentUser?.interests?.length > 0) {
      query.expertise = { $in: currentUser.interests };
    }
    let experts = await User.find(query).select('-password').sort({ rating: -1 }).limit(10);
    if (experts.length === 0) {
      experts = await User.find({ role: 'expert' }).select('-password').sort({ rating: -1 }).limit(10);
    }
    return experts;
  } catch (error) {
    return [];
  }
};

module.exports = { getRecommendations };

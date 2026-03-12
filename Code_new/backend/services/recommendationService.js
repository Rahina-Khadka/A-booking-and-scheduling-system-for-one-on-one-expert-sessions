const User = require('../models/User');
const Booking = require('../models/Booking');

/**
 * Recommendation Service
 * Provides expert recommendations based on user interests and booking history
 */
class RecommendationService {
  /**
   * Get recommended experts for a user
   * Algorithm considers:
   * 1. Matching expertise with user interests
   * 2. Expert ratings
   * 3. Previously booked experts
   */
  static async getRecommendedExperts(userId) {
    try {
      // Get user with interests
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's booking history
      const bookingHistory = await Booking.find({ userId })
        .select('expertId')
        .lean();
      
      const bookedExpertIds = bookingHistory.map(b => b.expertId.toString());

      // Get all experts
      const experts = await User.find({ role: 'expert' })
        .select('name email expertise rating totalRatings bio')
        .lean();

      // Calculate recommendation score for each expert
      const scoredExperts = experts.map(expert => {
        let score = 0;

        // Score based on matching interests/expertise
        if (user.interests && user.interests.length > 0) {
          const matchingFields = expert.expertise.filter(exp => 
            user.interests.some(interest => 
              interest.toLowerCase().includes(exp.toLowerCase()) ||
              exp.toLowerCase().includes(interest.toLowerCase())
            )
          );
          score += matchingFields.length * 10;
        }

        // Score based on rating
        score += expert.rating * 2;

        // Boost score for previously booked experts (familiarity bonus)
        if (bookedExpertIds.includes(expert._id.toString())) {
          score += 5;
        }

        return {
          ...expert,
          recommendationScore: score
        };
      });

      // Sort by recommendation score (highest first)
      scoredExperts.sort((a, b) => b.recommendationScore - a.recommendationScore);

      return scoredExperts;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get similar experts based on expertise
   */
  static async getSimilarExperts(expertId, limit = 5) {
    try {
      const expert = await User.findById(expertId);
      if (!expert) {
        throw new Error('Expert not found');
      }

      // Find experts with similar expertise
      const similarExperts = await User.find({
        role: 'expert',
        _id: { $ne: expertId },
        expertise: { $in: expert.expertise }
      })
      .select('name email expertise rating totalRatings bio')
      .limit(limit)
      .lean();

      return similarExperts;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = RecommendationService;

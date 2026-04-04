const User = require('../models/User');
const { decrypt } = require('../utils/encryption');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const result = user.toObject();
    if (result.phone) result.phone = decrypt(result.phone);
    res.json(result);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, interests, profilePicture, expertise, hourlyRate, isOnline, availability, portfolio } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (interests !== undefined) user.interests = interests;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (expertise !== undefined) user.expertise = expertise;
    if (hourlyRate !== undefined) user.hourlyRate = hourlyRate;
    if (isOnline !== undefined) user.isOnline = isOnline;
    if (availability !== undefined) {
      // Validate each slot is exactly 60 minutes
      for (const day of availability) {
        for (const slot of day.slots || []) {
          const [sh, sm] = slot.startTime.split(':').map(Number);
          const [eh, em] = slot.endTime.split(':').map(Number);
          const diff = (eh * 60 + em) - (sh * 60 + sm);
          if (diff !== 60) {
            return res.status(400).json({ message: `Invalid time slot for ${day.day}. Each slot must be exactly 1 hour.` });
          }
        }
      }
      user.availability = availability;
    }
    if (portfolio !== undefined) user.portfolio = portfolio;
    if (req.body.paymentQr !== undefined) user.paymentQr = req.body.paymentQr;

    const updated = await user.save();
    const result = updated.toObject();
    delete result.password;
    // Decrypt phone before sending back to client
    if (result.phone) result.phone = decrypt(result.phone);
    res.json(result);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getProfile, updateProfile };

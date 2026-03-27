const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
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
    if (availability !== undefined) user.availability = availability;
    if (portfolio !== undefined) user.portfolio = portfolio;

    const updated = await user.save();
    const result = updated.toObject();
    delete result.password;
    res.json(result);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getProfile, updateProfile };

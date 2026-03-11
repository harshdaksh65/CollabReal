const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

async function register(req, res) {
    try {
        const { username, email, password } = req.body;
    
        if (!username || !email || !password) {
          return res.status(400).json({ message: 'All fields are required' });
        }
    
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
          return res.status(400).json({ message: 'User already exists' });
        }
    
        const user = new User({ username, email, password });
        await user.save();
    
        const token = jwt.sign(
          { id: user._id, username: user.username },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
    
        res.status(201).json({
          token,
          user: { id: user._id, username: user.username, email: user.email }
        });
      } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
      }
}

async function login(req, res) {
    try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function currentUser(req, res) {
    try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user._id, username: user.username, email: user.email });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { register, login, currentUser };
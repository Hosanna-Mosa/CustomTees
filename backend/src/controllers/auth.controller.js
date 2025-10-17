import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { hashPassword, comparePassword, signToken } from '../services/auth.service.js';

export const signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation error', details: errors.array() });
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const hashed = await hashPassword(password);
    const user = await User.create({ name, email, password: hashed });
    const token = signToken({ id: user._id, role: user.role });
    const { password: _, ...profile } = user.toObject();
    res.status(201).json({ success: true, message: 'Signup successful', data: { token, user: profile } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation error', details: errors.array() });
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });
  const match = await comparePassword(password, user.password);
  if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password' });
  const token = signToken({ id: user._id, role: user.role });
  const { password: _, ...profile } = user.toObject();
  res.json({ success: true, message: 'Login successful', data: { token, user: profile } });
};



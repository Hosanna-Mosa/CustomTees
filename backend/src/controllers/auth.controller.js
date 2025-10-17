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

export const getProfile = async (req, res) => {
  res.json({ success: true, data: req.user });
};

export const updateProfile = async (req, res) => {
  const fields = ['name'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) req.user[f] = req.body[f];
  });
  await req.user.save();
  res.json({ success: true, data: req.user });
};

export const addAddress = async (req, res) => {
  const address = req.body;
  req.user.addresses.push(address);
  await req.user.save();
  res.status(201).json({ success: true, data: req.user.addresses });
};

export const updateAddress = async (req, res) => {
  const { id } = req.params;
  const addr = req.user.addresses.id(id);
  if (!addr) return res.status(404).json({ success: false, message: 'Address not found' });
  Object.assign(addr, req.body);
  await req.user.save();
  res.json({ success: true, data: req.user.addresses });
};

export const deleteAddress = async (req, res) => {
  const { id } = req.params;
  const addr = req.user.addresses.id(id);
  if (!addr) return res.status(404).json({ success: false, message: 'Address not found' });
  addr.deleteOne();
  await req.user.save();
  res.json({ success: true, data: req.user.addresses });
};



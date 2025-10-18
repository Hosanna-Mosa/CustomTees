import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { hashPassword, comparePassword, signToken } from '../services/auth.service.js';
import { generateVerificationCode, sendVerificationCode, sendPasswordResetSuccess } from '../services/email.service.js';

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

// Forgot password - send verification code
export const forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation error', details: errors.array() });
  
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }
    
    // Generate verification code
    const verificationCode = generateVerificationCode();
    
    // Set expiration time (10 minutes from now)
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000);
    
    // Save verification code to user
    user.resetPasswordCode = verificationCode;
    user.resetPasswordExpires = expirationTime;
    await user.save();
    
    // Send verification code via email
    const emailResult = await sendVerificationCode(email, verificationCode);
    
    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send verification code' });
    }
    
    res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Verify code and reset password
export const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation error', details: errors.array() });
  
  try {
    const { email, code, newPassword } = req.body;
    
    // Find user with valid verification code
    const user = await User.findOne({
      email,
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password and clear reset fields
    user.password = hashedPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    // Send success email
    await sendPasswordResetSuccess(email);
    
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



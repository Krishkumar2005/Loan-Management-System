import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const signToken = (userId: string, role: string, email: string): string => {
  return jwt.sign(
    { userId, role, email },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' } as object
  ) as string;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already in use' });
      return;
    }

    const user = await User.create({ name, email, password, role: 'borrower' });
    const token = signToken(user._id.toString(), user.role, user.email);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const token = signToken(user._id.toString(), user.role, user.email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

export const getMe = async (req: Request & { user?: { userId: string } }, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId).select('-password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.status(200).json({ success: true, data: { user } });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

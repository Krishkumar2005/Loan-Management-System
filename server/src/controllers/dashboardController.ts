import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Loan } from '../models/Loan';
import { User } from '../models/User';

// ─── SALES MODULE ──────────────────────────────────────────────────
// GET /api/dashboard/sales/leads
// Users who signed up but have NO loan yet
export const getSalesLeads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loansWithBorrowers = await Loan.distinct('borrower');
    const leads = await User.find({
      role: 'borrower',
      _id: { $nin: loansWithBorrowers },
    }).select('-password').sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: { leads } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch leads' });
  }
};

// ─── SANCTION MODULE ───────────────────────────────────────────────
// GET /api/dashboard/sanction/loans
export const getSanctionLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: 'applied' })
      .populate('borrower', 'name email createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: { loans } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch loans for sanction' });
  }
};

// PATCH /api/dashboard/sanction/loans/:id/approve
export const approveLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found' });
      return;
    }
    if (loan.status !== 'applied') {
      res.status(400).json({ success: false, message: `Cannot approve loan with status: ${loan.status}` });
      return;
    }

    loan.status = 'sanctioned';
    loan.sanctionedBy = new mongoose.Types.ObjectId(req.user!.userId);
    loan.sanctionedAt = new Date();
    await loan.save();

    res.status(200).json({ success: true, message: 'Loan sanctioned successfully', data: { loan } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to sanction loan' });
  }
};

// PATCH /api/dashboard/sanction/loans/:id/reject
export const rejectLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim() === '') {
      res.status(400).json({ success: false, message: 'Rejection reason is required' });
      return;
    }

    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found' });
      return;
    }
    if (loan.status !== 'applied') {
      res.status(400).json({ success: false, message: `Cannot reject loan with status: ${loan.status}` });
      return;
    }

    loan.status = 'rejected';
    loan.rejectionReason = reason.trim();
    loan.sanctionedBy = new mongoose.Types.ObjectId(req.user!.userId);
    loan.sanctionedAt = new Date();
    await loan.save();

    res.status(200).json({ success: true, message: 'Loan rejected', data: { loan } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to reject loan' });
  }
};

// ─── DISBURSEMENT MODULE ───────────────────────────────────────────
// GET /api/dashboard/disbursement/loans
export const getDisbursementLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: 'sanctioned' })
      .populate('borrower', 'name email')
      .populate('sanctionedBy', 'name')
      .sort({ sanctionedAt: -1 });

    res.status(200).json({ success: true, data: { loans } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch loans for disbursement' });
  }
};

// PATCH /api/dashboard/disbursement/loans/:id/disburse
export const disburseLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found' });
      return;
    }
    if (loan.status !== 'sanctioned') {
      res.status(400).json({ success: false, message: `Cannot disburse loan with status: ${loan.status}` });
      return;
    }

    loan.status = 'disbursed';
    loan.disbursedBy = new mongoose.Types.ObjectId(req.user!.userId);
    loan.disbursedAt = new Date();
    await loan.save();

    res.status(200).json({ success: true, message: 'Loan disbursed successfully', data: { loan } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to disburse loan' });
  }
};

// ─── COLLECTION MODULE ─────────────────────────────────────────────
// GET /api/dashboard/collection/loans
export const getCollectionLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: { $in: ['disbursed', 'closed'] } })
      .populate('borrower', 'name email')
      .populate('disbursedBy', 'name')
      .sort({ disbursedAt: -1 });

    res.status(200).json({ success: true, data: { loans } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch loans for collection' });
  }
};

// POST /api/dashboard/collection/loans/:id/payment
export const recordPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { utrNumber, amount, date } = req.body;

    if (!utrNumber || !amount || !date) {
      res.status(400).json({ success: false, message: 'UTR number, amount, and date are required' });
      return;
    }

    const paymentAmount = Number(amount);
    if (paymentAmount <= 0) {
      res.status(400).json({ success: false, message: 'Payment amount must be greater than 0' });
      return;
    }

    // UTR uniqueness across ALL loans
    const utrExists = await Loan.findOne({ 'payments.utrNumber': utrNumber.trim() });
    if (utrExists) {
      res.status(409).json({ success: false, message: 'UTR number already exists. Each payment must have a unique UTR.' });
      return;
    }

    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found' });
      return;
    }
    if (loan.status !== 'disbursed') {
      res.status(400).json({ success: false, message: `Cannot record payment for loan with status: ${loan.status}` });
      return;
    }

    // Validate payment doesn't exceed outstanding balance
    if (paymentAmount > loan.outstandingBalance) {
      res.status(400).json({
        success: false,
        message: `Payment amount (₹${paymentAmount.toLocaleString()}) exceeds outstanding balance (₹${loan.outstandingBalance.toLocaleString()})`,
      });
      return;
    }

    loan.payments.push({
      _id: new mongoose.Types.ObjectId(),
      utrNumber: utrNumber.trim(),
      amount: paymentAmount,
      date: new Date(date),
      recordedBy: new mongoose.Types.ObjectId(req.user!.userId),
      createdAt: new Date(),
    });

    loan.totalPaid = parseFloat((loan.totalPaid + paymentAmount).toFixed(2));
    loan.outstandingBalance = parseFloat((loan.totalRepayment - loan.totalPaid).toFixed(2));

    // Auto-close when fully paid
    if (loan.totalPaid >= loan.totalRepayment) {
      loan.status = 'closed';
      loan.closedAt = new Date();
      loan.outstandingBalance = 0;
    }

    await loan.save();

    res.status(200).json({
      success: true,
      message: loan.status === 'closed' ? 'Payment recorded. Loan is now closed!' : 'Payment recorded successfully',
      data: { loan },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to record payment' });
  }
};

// ─── ADMIN MODULE ──────────────────────────────────────────────────
// GET /api/dashboard/admin/loans
export const getAllLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [loans, total] = await Promise.all([
      Loan.find(filter)
        .populate('borrower', 'name email')
        .populate('sanctionedBy', 'name')
        .populate('disbursedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Loan.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: { loans, total, page: Number(page), limit: Number(limit) },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch all loans' });
  }
};

// GET /api/dashboard/admin/stats
export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalBorrowers,
      totalLoans,
      applied,
      sanctioned,
      disbursed,
      closed,
      rejected,
    ] = await Promise.all([
      User.countDocuments({ role: 'borrower' }),
      Loan.countDocuments(),
      Loan.countDocuments({ status: 'applied' }),
      Loan.countDocuments({ status: 'sanctioned' }),
      Loan.countDocuments({ status: 'disbursed' }),
      Loan.countDocuments({ status: 'closed' }),
      Loan.countDocuments({ status: 'rejected' }),
    ]);

    res.status(200).json({
      success: true,
      data: { totalBorrowers, totalLoans, applied, sanctioned, disbursed, closed, rejected },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Loan } from '../models/Loan';
import { runBRE, calculateLoan } from '../utils/bre';
import { EmploymentMode } from '../types';
import path from 'path';

// POST /api/loans/bre-check
export const breCheck = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dateOfBirth, monthlySalary, pan, employmentMode } = req.body;

    if (!dateOfBirth || !monthlySalary || !pan || !employmentMode) {
      res.status(400).json({ success: false, message: 'All personal details are required' });
      return;
    }

    const result = runBRE({
      dateOfBirth,
      monthlySalary: Number(monthlySalary),
      pan: pan.trim().toUpperCase(),
      employmentMode: employmentMode as EmploymentMode,
    });

    res.status(200).json({ success: true, data: result });
  } catch {
    res.status(500).json({ success: false, message: 'BRE check failed' });
  }
};

// POST /api/loans/upload-salary-slip
export const uploadSalarySlip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Salary slip file is required' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Salary slip uploaded successfully',
      data: {
        fileUrl: `/uploads/${req.file.filename}`,
        originalName: req.file.originalname,
        size: req.file.size,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'File upload failed' });
  }
};

// POST /api/loans/apply
export const applyLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      fullName, pan, dateOfBirth, monthlySalary, employmentMode,
      salarySlipUrl, salarySlipOriginalName,
      loanAmount, tenure,
    } = req.body;

    // Re-run BRE on server to be safe
    const bre = runBRE({
      dateOfBirth,
      monthlySalary: Number(monthlySalary),
      pan: pan.trim().toUpperCase(),
      employmentMode: employmentMode as EmploymentMode,
    });

    if (!bre.passed) {
      res.status(400).json({ success: false, message: 'BRE checks failed', data: { failedRules: bre.failedRules } });
      return;
    }

    const amount = Number(loanAmount);
    const days = Number(tenure);

    if (amount < 50000 || amount > 500000) {
      res.status(400).json({ success: false, message: 'Loan amount must be between ₹50,000 and ₹5,00,000' });
      return;
    }
    if (days < 30 || days > 365) {
      res.status(400).json({ success: false, message: 'Tenure must be between 30 and 365 days' });
      return;
    }

    const { simpleInterest, totalRepayment } = calculateLoan(amount, days);

    const loan = await Loan.create({
      borrower: req.user!.userId,
      fullName: fullName.trim(),
      pan: pan.trim().toUpperCase(),
      dateOfBirth: new Date(dateOfBirth),
      monthlySalary: Number(monthlySalary),
      employmentMode,
      salarySlipUrl,
      salarySlipOriginalName,
      loanAmount: amount,
      tenure: days,
      interestRate: 12,
      simpleInterest,
      totalRepayment,
      status: 'applied',
      totalPaid: 0,
      outstandingBalance: totalRepayment,
    });

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
      data: { loan },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to apply for loan' });
  }
};

// GET /api/loans/my-loans
export const getMyLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ borrower: req.user!.userId })
      .sort({ createdAt: -1 })
      .populate('sanctionedBy', 'name email')
      .populate('disbursedBy', 'name email');

    res.status(200).json({ success: true, data: { loans } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch loans' });
  }
};

// GET /api/loans/my-loans/:id
export const getMyLoanById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, borrower: req.user!.userId })
      .populate('sanctionedBy', 'name email')
      .populate('disbursedBy', 'name email');

    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found' });
      return;
    }

    res.status(200).json({ success: true, data: { loan } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch loan' });
  }
};

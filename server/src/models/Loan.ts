import mongoose, { Document, Schema } from 'mongoose';
import { LoanStatus, EmploymentMode } from '../types';

export interface IPayment {
  _id: mongoose.Types.ObjectId;
  utrNumber: string;
  amount: number;
  date: Date;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ILoan extends Document {
  _id: mongoose.Types.ObjectId;
  borrower: mongoose.Types.ObjectId;

  // Personal details
  fullName: string;
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;

  // Salary slip
  salarySlipUrl?: string;
  salarySlipOriginalName?: string;

  // Loan config
  loanAmount: number;
  tenure: number; // days
  interestRate: number; // fixed 12% p.a.
  simpleInterest: number;
  totalRepayment: number;

  // Status lifecycle
  status: LoanStatus;
  rejectionReason?: string;

  // Executive who handled each stage
  sanctionedBy?: mongoose.Types.ObjectId;
  sanctionedAt?: Date;
  disbursedBy?: mongoose.Types.ObjectId;
  disbursedAt?: Date;

  // Payments (collection stage)
  payments: IPayment[];
  totalPaid: number;
  outstandingBalance: number;
  closedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    utrNumber: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const loanSchema = new Schema<ILoan>(
  {
    borrower: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    fullName: { type: String, required: true, trim: true },
    pan: { type: String, required: true, uppercase: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    monthlySalary: { type: Number, required: true },
    employmentMode: {
      type: String,
      enum: ['salaried', 'self_employed', 'unemployed'],
      required: true,
    },

    salarySlipUrl: { type: String },
    salarySlipOriginalName: { type: String },

    loanAmount: { type: Number, required: true, min: 50000, max: 500000 },
    tenure: { type: Number, required: true, min: 30, max: 365 },
    interestRate: { type: Number, default: 12 },
    simpleInterest: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },

    status: {
      type: String,
      enum: ['applied', 'sanctioned', 'rejected', 'disbursed', 'closed'],
      default: 'applied',
    },
    rejectionReason: { type: String },

    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sanctionedAt: { type: Date },
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: { type: Date },

    payments: [paymentSchema],
    totalPaid: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

// Index for UTR uniqueness check (we'll validate in service layer)
loanSchema.index({ 'payments.utrNumber': 1 });

export const Loan = mongoose.model<ILoan>('Loan', loanSchema);

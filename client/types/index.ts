export type UserRole = "borrower" | "admin" | "sales" | "sanction" | "disbursement" | "collection";
export type LoanStatus = "applied" | "sanctioned" | "rejected" | "disbursed" | "closed";
export type EmploymentMode = "salaried" | "self_employed" | "unemployed";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Payment {
  _id: string;
  utrNumber: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface Loan {
  _id: string;
  borrower: User | string;
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  salarySlipUrl?: string;
  loanAmount: number;
  tenure: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedBy?: User;
  sanctionedAt?: string;
  disbursedBy?: User;
  disbursedAt?: string;
  payments: Payment[];
  totalPaid: number;
  outstandingBalance: number;
  closedAt?: string;
  createdAt: string;
}

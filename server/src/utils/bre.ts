import { BREResult, EmploymentMode } from '../types';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export function runBRE(data: {
  dateOfBirth: Date | string;
  monthlySalary: number;
  pan: string;
  employmentMode: EmploymentMode;
}): BREResult {
  const failedRules: string[] = [];

  // Age check: 23 to 50
  const dob = new Date(data.dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  if (age < 23 || age > 50) {
    failedRules.push(`Age must be between 23 and 50 years. Your age: ${age}`);
  }

  // Salary check: >= 25000
  if (data.monthlySalary < 25000) {
    failedRules.push(`Monthly salary must be at least ₹25,000. Provided: ₹${data.monthlySalary.toLocaleString()}`);
  }

  // PAN validation
  const panUpper = data.pan.toUpperCase().trim();
  if (!PAN_REGEX.test(panUpper)) {
    failedRules.push(`Invalid PAN format. Must follow pattern: ABCDE1234F (5 letters, 4 digits, 1 letter)`);
  }

  // Employment check
  if (data.employmentMode === 'unemployed') {
    failedRules.push('Unemployed applicants are not eligible for a loan');
  }

  return {
    passed: failedRules.length === 0,
    failedRules,
  };
}

export function calculateLoan(principal: number, tenureDays: number, ratePercent = 12) {
  const si = (principal * ratePercent * tenureDays) / (365 * 100);
  const totalRepayment = principal + si;
  return {
    simpleInterest: parseFloat(si.toFixed(2)),
    totalRepayment: parseFloat(totalRepayment.toFixed(2)),
  };
}

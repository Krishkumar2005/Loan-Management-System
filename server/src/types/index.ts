export type UserRole = 'borrower' | 'admin' | 'sales' | 'sanction' | 'disbursement' | 'collection';

export type LoanStatus =
  | 'applied'
  | 'sanctioned'
  | 'rejected'
  | 'disbursed'
  | 'closed';

export type EmploymentMode = 'salaried' | 'self_employed' | 'unemployed';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface BREResult {
  passed: boolean;
  failedRules: string[];
}

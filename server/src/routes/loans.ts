import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../utils/upload';
import {
  breCheck,
  uploadSalarySlip,
  applyLoan,
  getMyLoans,
  getMyLoanById,
} from '../controllers/loanController';

const router = Router();

// All routes require authentication and borrower role
router.use(authenticate);
router.use(authorize('borrower'));

router.post('/bre-check', breCheck);
router.post('/upload-salary-slip', upload.single('salarySlip'), uploadSalarySlip);
router.post('/apply', applyLoan);
router.get('/my-loans', getMyLoans);
router.get('/my-loans/:id', getMyLoanById);

export default router;

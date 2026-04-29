import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getSalesLeads,
  getSanctionLoans, approveLoan, rejectLoan,
  getDisbursementLoans, disburseLoan,
  getCollectionLoans, recordPayment,
  getAllLoans, getAdminStats,
} from '../controllers/dashboardController';

const router = Router();

router.use(authenticate);

// Sales
router.get('/sales/leads', authorize('sales', 'admin'), getSalesLeads);

// Sanction
router.get('/sanction/loans', authorize('sanction', 'admin'), getSanctionLoans);
router.patch('/sanction/loans/:id/approve', authorize('sanction', 'admin'), approveLoan);
router.patch('/sanction/loans/:id/reject', authorize('sanction', 'admin'), rejectLoan);

// Disbursement
router.get('/disbursement/loans', authorize('disbursement', 'admin'), getDisbursementLoans);
router.patch('/disbursement/loans/:id/disburse', authorize('disbursement', 'admin'), disburseLoan);

// Collection
router.get('/collection/loans', authorize('collection', 'admin'), getCollectionLoans);
router.post('/collection/loans/:id/payment', authorize('collection', 'admin'), recordPayment);

// Admin only
router.get('/admin/loans', authorize('admin'), getAllLoans);
router.get('/admin/stats', authorize('admin'), getAdminStats);

export default router;

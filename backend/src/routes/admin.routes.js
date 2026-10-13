const express = require('express');
const router = express.Router();
const {
  getPlatformStats,
  getAllUsers,
  toggleUserStatus,
  getAdminPlayers,
  getAdminCoaches,
  getAdminAssessments,
  deleteUser,
  exportUsersExcel,
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// All admin routes strictly require authentication and 'admin' role
router.use(protect, authorizeRoles('admin'));

router.get('/stats', getPlatformStats);
router.get('/users', getAllUsers);
router.get('/export/users', exportUsersExcel);
router.put('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/players', getAdminPlayers);
router.get('/coaches', getAdminCoaches);
router.get('/assessments', getAdminAssessments);

module.exports = router;


const express = require('express');
const { getUsers, getAllClasses, deleteUser } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('admin')); // Restrict entire route to admin

router.get('/users', getUsers);
router.get('/classes', getAllClasses);
router.delete('/users/:id', deleteUser);

module.exports = router;

const express = require('express');
const { createClass, joinClass, getMyClasses, getClassDetails, startAttendance, markAttendance, terminateAttendance, getEnrolledStudents, getAnalytics, getClassAnalytics, deleteClass, updateClass, exportClassData } = require('../controllers/classController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect); // All class routes are protected

router.route('/')
  .post(authorize('teacher', 'admin'), createClass)
  .get(getMyClasses);

router.get('/analytics', getAnalytics);
router.get('/:id/analytics', getClassAnalytics);
router.post('/join', authorize('student'), joinClass);

router.get('/:id', getClassDetails);
router.put('/:id', authorize('teacher', 'admin'), updateClass);
router.delete('/:id', authorize('teacher', 'admin'), deleteClass);
router.get('/:id/students', getEnrolledStudents);
router.get('/:id/export', authorize('teacher', 'admin'), exportClassData);

// Attendance routes
router.post('/:classId/attendance', authorize('teacher', 'admin'), startAttendance);
router.put('/:classId/attendance/:token/terminate', authorize('teacher', 'admin'), terminateAttendance);
router.post('/:classId/attendance/:token', authorize('student'), markAttendance);

module.exports = router;

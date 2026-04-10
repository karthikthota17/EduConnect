const express = require('express');
const { 
  getClasswork, 
  createMaterial, 
  createAssignment, 
  submitAssignment,
  createQuiz,
  updateQuiz,
  getAnnouncements,
  createAnnouncement,
  getSubmissions,
  gradeSubmission,
  submitQuiz,
  deleteMaterial,
  deleteAssignment,
  deleteQuiz,
  deleteAnnouncement,
  getTodo
} = require('../controllers/classworkController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const upload = require('../utils/upload');

const router = express.Router({ mergeParams: true });

// Require auth for all classwork routes
router.use(protect);
router.get('/todo', getTodo);
router.get('/:classId', getClasswork);
router.get('/:classId/announcements', getAnnouncements);

// Teacher only routes
router.post('/:classId/materials', authorize('teacher', 'admin'), upload, createMaterial);
router.delete('/:classId/materials/:materialId', authorize('teacher', 'admin'), deleteMaterial);

router.post('/:classId/assignments', authorize('teacher', 'admin'), upload, createAssignment);
router.delete('/:classId/assignments/:assignmentId', authorize('teacher', 'admin'), deleteAssignment);

router.post('/:classId/quizzes', authorize('teacher', 'admin'), createQuiz);
router.put('/:classId/quizzes/:quizId', authorize('teacher', 'admin'), updateQuiz);
router.delete('/:classId/quizzes/:quizId', authorize('teacher', 'admin'), deleteQuiz);

router.post('/:classId/announcements', authorize('teacher', 'admin'), createAnnouncement);
router.delete('/:classId/announcements/:announcementId', authorize('teacher', 'admin'), deleteAnnouncement);
router.get('/:classId/assignments/:assignmentId/submissions', authorize('teacher', 'admin'), getSubmissions);
router.put('/:classId/submissions/:submissionId/grade', authorize('teacher', 'admin'), gradeSubmission);

// Student only routes
router.post('/:classId/assignments/:assignmentId/submit', authorize('student'), upload, submitAssignment);
router.post('/:classId/quizzes/:quizId/submit', authorize('student'), submitQuiz);

module.exports = router;

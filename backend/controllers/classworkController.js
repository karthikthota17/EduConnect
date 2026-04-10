const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Material = require('../models/Material');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Quiz = require('../models/Quiz');
const QuizResponse = require('../models/QuizResponse');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');

// Helper to check if user has access to the class
const verifyClassAccess = async (classId, userId, userRole) => {
  const classObj = await Class.findById(classId);
  if (!classObj) throw new Error('Class not found');
  
  if (userRole === 'admin') return true;
  if (classObj.teacher.toString() === userId) return true;
  
  const enrollment = await Enrollment.findOne({ class: classId, student: userId });
  if (enrollment) return true;
  
  throw new Error('Not authorized to access this class');
};

// @desc    Delete a material
// @route   DELETE /api/classwork/:classId/materials/:materialId
// @access  Private (Teacher)
exports.deleteMaterial = async (req, res) => {
  try {
    const { classId, materialId } = req.params;
    const classObj = await Class.findById(classId);
    if (!classObj || (classObj.teacher.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await Material.findByIdAndDelete(materialId);
    res.status(200).json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an assignment
// @route   DELETE /api/classwork/:classId/assignments/:assignmentId
// @access  Private (Teacher)
exports.deleteAssignment = async (req, res) => {
  try {
    const { classId, assignmentId } = req.params;
    const classObj = await Class.findById(classId);
    if (!classObj || (classObj.teacher.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await Assignment.findByIdAndDelete(assignmentId);
    await Submission.deleteMany({ assignment: assignmentId });
    res.status(200).json({ success: true, message: 'Assignment and related submissions deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a quiz
// @route   DELETE /api/classwork/:classId/quizzes/:quizId
// @access  Private (Teacher)
exports.deleteQuiz = async (req, res) => {
  try {
    const { classId, quizId } = req.params;
    const classObj = await Class.findById(classId);
    if (!classObj || (classObj.teacher.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await Quiz.findByIdAndDelete(quizId);
    await QuizResponse.deleteMany({ quiz: quizId });
    res.status(200).json({ success: true, message: 'Quiz and related responses deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/classwork/:classId/announcements/:announcementId
// @access  Private (Teacher)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { classId, announcementId } = req.params;
    const classObj = await Class.findById(classId);
    if (!classObj || (classObj.teacher.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await Announcement.findByIdAndDelete(announcementId);
    res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// @desc    Get all classwork for a class
// @route   GET /api/classwork/:classId
// @access  Private
exports.getClasswork = async (req, res) => {
  try {
    const { classId } = req.params;
    await verifyClassAccess(classId, req.user.id, req.user.role);

    const materials = await Material.find({ class: classId }).sort('-createdAt');
    const assignments = await Assignment.find({ class: classId }).sort('-createdAt').lean();
    const quizzes = await Quiz.find({ class: classId }).sort('-createdAt').select('-questions.correctOptionIndex').lean();

    // Attach submission status if student
    if (req.user.role === 'student') {
        const studentSubmissions = await Submission.find({ student: req.user.id, assignment: { $in: assignments.map(a => a._id) } });
        const studentResponses = await QuizResponse.find({ student: req.user.id, quiz: { $in: quizzes.map(q => q._id) } });

        assignments.forEach(a => {
            const sub = studentSubmissions.find(s => s.assignment.toString() === a._id.toString());
            a.submitted = !!sub;
            a.submissionStatus = sub ? sub.status : null;
            a.grade = sub ? sub.grade : null;
        });

        quizzes.forEach(q => {
            const resData = studentResponses.find(r => r.quiz.toString() === q._id.toString());
            q.submitted = !!resData;
            q.score = resData ? resData.score : null;
        });
    }

    res.status(200).json({
      success: true,
      data: { materials, assignments, quizzes }
    });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

// @desc    Create a new material
// @route   POST /api/classwork/:classId/materials
// @access  Private (Teacher)
exports.createMaterial = async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, description, type } = req.body;
    
    // Check if Teacher of this class
    const classObj = await Class.findById(classId);
    if (!classObj || (classObj.teacher.toString() !== req.user.id && req.user.role !== 'admin')) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let fileUrl = '';
    let originalName = '';
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      originalName = req.file.originalname;
    }

    const material = await Material.create({
      class: classId,
      title,
      description,
      type: type || 'document',
      url: fileUrl,
      originalName
    });

    const io = req.app.get('io');
    if (io) io.to(classId).emit('classwork-updated');

    res.status(201).json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new assignment
// @route   POST /api/classwork/:classId/assignments
// @access  Private (Teacher)
exports.createAssignment = async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, description, points, dueDate } = req.body;
    
    const classObj = await Class.findById(classId);
    if (!classObj || (classObj.teacher.toString() !== req.user.id && req.user.role !== 'admin')) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let fileUrl = '';
    let originalName = '';
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      originalName = req.file.originalname;
    }

    const assignment = await Assignment.create({
      class: classId,
      title,
      description,
      points,
      dueDate,
      fileUrl,
      originalName
    });

    const io = req.app.get('io');
    if (io) io.to(classId).emit('classwork-updated');

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit an assignment
// @route   POST /api/classwork/:classId/assignments/:assignmentId/submit
// @access  Private (Student)
exports.submitAssignment = async (req, res) => {
  try {
    const { classId, assignmentId } = req.params;
    await verifyClassAccess(classId, req.user.id, req.user.role);

    // Make sure assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment || assignment.class.toString() !== classId) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    let fileUrl = '';
    let originalName = '';
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      originalName = req.file.originalname;
    }

    // Check for existing submission first
    const existingSubmission = await Submission.findOne({ assignment: assignmentId, student: req.user.id });
    if (existingSubmission && (existingSubmission.status === 'turned_in' || existingSubmission.status === 'graded')) {
       return res.status(403).json({ success: false, message: 'Assessment already submitted. Re-submission is disabled by protocol.' });
    }

    // Create or update submission
    const submission = await Submission.findOneAndUpdate(
      { assignment: assignmentId, student: req.user.id },
      { fileUrl, originalName, status: 'turned_in' },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a quiz
// @route   POST /api/classwork/:classId/quizzes
// @access  Private (Teacher)
exports.createQuiz = async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, description, questions } = req.body;
    
    const classObj = await Class.findById(classId);
    if (!classObj || (classObj.teacher.toString() !== req.user.id && req.user.role !== 'admin')) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // questions is expected to be an array of objects
    const quiz = await Quiz.create({
      class: classId,
      title,
      description,
      questions: typeof questions === 'string' ? JSON.parse(questions) : questions
    });

    const io = req.app.get('io');
    if (io) io.to(classId).emit('classwork-updated');

    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a quiz
// @route   PUT /api/classwork/:classId/quizzes/:quizId
// @access  Private (Teacher)
exports.updateQuiz = async (req, res) => {
  try {
    const { classId, quizId } = req.params;
    const { title, description, questions, duration } = req.body;
    
    const classObj = await Class.findById(classId);
    if (!classObj || (classObj.teacher.toString() !== req.user.id && req.user.role !== 'admin')) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const quiz = await Quiz.findByIdAndUpdate(
      quizId,
      { 
        title, 
        description, 
        questions: typeof questions === 'string' ? JSON.parse(questions) : questions,
        duration
      },
      { new: true, runValidators: true }
    );

    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get announcements for a class
// @route   GET /api/classwork/:classId/announcements
// @access  Private
exports.getAnnouncements = async (req, res) => {
  try {
     const { classId } = req.params;
     await verifyClassAccess(classId, req.user.id, req.user.role);

     const announcements = await Announcement.find({ class: classId })
                                            .populate('author', 'name role')
                                            .sort('-createdAt');
     res.status(200).json({ success: true, data: announcements });
  } catch (err) {
     res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create announcement
// @route   POST /api/classwork/:classId/announcements
// @access  Private (Teacher)
exports.createAnnouncement = async (req, res) => {
  try {
     const { classId } = req.params;
     const { text } = req.body;
     
     const classObj = await Class.findById(classId);
     if (!classObj || (classObj.teacher.toString() !== req.user.id && req.user.role !== 'admin')) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
     }

     const announcement = await Announcement.create({
        class: classId,
        author: req.user.id,
        text
     });

     // Push notification to enrolled students
     const enrollments = await Enrollment.find({ class: classId });
     const notifications = enrollments.map(en => ({
        user: en.student,
        message: `New announcement in ${classObj.name}`,
        link: `/class/${classId}`
     }));
     
     if (notifications.length > 0) {
        await Notification.insertMany(notifications);
     }

     const io = req.app.get('io');
     if (io) io.to(classId).emit('classwork-updated');

     res.status(201).json({ success: true, data: announcement });
  } catch (err) {
     res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get submissions for an assignment
// @route   GET /api/classwork/:classId/assignments/:assignmentId/submissions
// @access  Private (Teacher)
exports.getSubmissions = async (req, res) => {
  try {
    const { classId, assignmentId } = req.params;
    
    // Verify teacher
    const classObj = await Class.findById(classId);
    if (!classObj || (classObj.teacher.toString() !== req.user.id && req.user.role !== 'admin')) {
       return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const submissions = await Submission.find({ assignment: assignmentId })
                                        .populate('student', 'name email')
                                        .sort('-createdAt');
    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Grade a submission
// @route   PUT /api/classwork/:classId/submissions/:submissionId/grade
// @access  Private (Teacher)
exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    const submission = await Submission.findById(submissionId).populate('assignment');
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

    // Verify teacher of the class the assignment belongs to
    const classObj = await Class.findById(submission.assignment.class);
     if (!classObj || (classObj.teacher.toString() !== req.user.id && req.user.role !== 'admin')) {
       return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    submission.grade = grade;
    submission.feedback = feedback;
    submission.status = 'graded';
    await submission.save();

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit quiz responses
// @route   POST /api/classwork/:classId/quizzes/:quizId/submit
// @access  Private (Student)
exports.submitQuiz = async (req, res) => {
  try {
    const { classId, quizId } = req.params;
    const { answers } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz || quiz.class.toString() !== classId) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Evaluate score
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctOptionIndex) {
        score += 10; // Default 10 points per correct answer
      }
    });

    // Check for existing quiz response
    const existingResponse = await QuizResponse.findOne({ quiz: quizId, student: req.user.id });
    if (existingResponse) {
       return res.status(403).json({ success: false, message: 'Evaluation already finalized. Multi-attempt protocol is inactive.' });
    }

    const response = await QuizResponse.create({
      quiz: quizId,
      student: req.user.id,
      answers,
      score
    });

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get upcoming tasks (ToDo) for a student across all classes
// @route   GET /api/classwork/todo
// @access  Private (Student)
exports.getTodo = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get all classes student is enrolled in
    const Enrollment = require('../models/Enrollment');
    const Assignment = require('../models/Assignment');
    const Quiz = require('../models/Quiz');

    const enrollments = await Enrollment.find({ student: studentId });
    const classIds = enrollments.map(e => e.class);

    // Get my submissions and quiz starts
    const submissions = await Submission.find({ student: studentId }).distinct('assignment');
    const responses = await QuizResponse.find({ student: studentId }).distinct('quiz');

    // Get upcoming assignments NOT already submitted
    const assignments = await Assignment.find({ 
      _id: { $nin: submissions },
      class: { $in: classIds },
      dueDate: { $gte: new Date() }
    }).populate('class', 'name');

    // Get quizzes NOT already taken
    const quizzes = await Quiz.find({ 
      _id: { $nin: responses },
      class: { $in: classIds } 
    }).populate('class', 'name');

    // Map to a unified format
    const todoList = [
      ...assignments.map(a => ({
        _id: a._id,
        title: a.title,
        dueDate: a.dueDate,
        className: a.class.name,
        classId: a.class._id,
        type: 'assignment'
      })),
      ...quizzes.map(q => ({
        _id: q._id,
        title: q.title,
        dueDate: q.createdAt, // Fallback since quizzes don't have dueDate yet
        className: q.class.name,
        classId: q.class._id,
        type: 'quiz'
      }))
    ];

    // Sort by date
    todoList.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.status(200).json({ success: true, data: todoList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

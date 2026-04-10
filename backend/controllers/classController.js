// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private (Teacher, Admin)
exports.deleteClass = async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id);

    if (!classObj) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Check if Teacher of this class or Admin
    if (classObj.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this class' });
    }

    // Cascading Delete: Materials, Assignments, Quizzes, etc.
    const classId = req.params.id;
    
    // Use Promise.all for faster deletion
    await Promise.all([
       Enrollment.deleteMany({ class: classId }),
       Attendance.deleteMany({ class: classId }),
       Assignment.deleteMany({ class: classId }),
       Submission.deleteMany({ assignment: { $in: await Assignment.find({ class: classId }).distinct('_id') } }),
       Quiz.deleteMany({ class: classId }),
       QuizResponse.deleteMany({ quiz: { $in: await Quiz.find({ class: classId }).distinct('_id') } }),
       Announcement.deleteMany({ class: classId }),
       Material.deleteMany({ class: classId }),
       classObj.deleteOne()
    ]);

    res.status(200).json({
      success: true,
      message: 'Class and all related data purged successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Quiz = require('../models/Quiz');
const QuizResponse = require('../models/QuizResponse');
const crypto = require('crypto');
const generateCode = require('../utils/generateCode');

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private (Teacher, Admin)
exports.createClass = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Generate unique code
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = generateCode();
      const existingClass = await Class.findOne({ code });
      if (!existingClass) isUnique = true;
    }

    const newClass = await Class.create({
      name,
      description,
      teacher: req.user.id,
      code
    });

    res.status(201).json({
      success: true,
      data: newClass
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a class
// @route   PUT /api/classes/:id
// @access  Private (Teacher, Admin)
exports.updateClass = async (req, res) => {
  try {
    let classObj = await Class.findById(req.params.id);

    if (!classObj) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Check if Teacher of this class or Admin
    if (classObj.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this class' });
    }

    classObj = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: classObj
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Join a class via code
// @route   POST /api/classes/join
// @access  Private (Student)
exports.joinClass = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Class code is required' });
    }

    const classObj = await Class.findOne({ code });
    if (!classObj) {
      return res.status(404).json({ success: false, message: 'Invalid class code' });
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user.id,
      class: classObj._id
    });

    if (existingEnrollment) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this class' });
    }

    const enrollment = await Enrollment.create({
      student: req.user.id,
      class: classObj._id
    });

    // Return the populated class details so the frontend can immediately show it
    const updatedClass = await Class.findById(classObj._id).populate('teacher', 'name avatar email');

    res.status(200).json({ success: true, data: updatedClass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Start an attendance session
// @route   POST /api/classes/:classId/attendance
// @access  Private (Teacher)
exports.startAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const classObj = await Class.findById(classId);

    if (!classObj || classObj.teacher.toString() !== req.user.id) {
       return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Invalidate any existing active sessions
    await Attendance.updateMany({ class: classId, isActive: true }, { isActive: false });

    // Generate random 16 byte token for unique QR
    const token = crypto.randomBytes(16).toString('hex');
    
    const attendance = await Attendance.create({
       class: classId,
       date: new Date(),
       token,
       isActive: true,
       presentStudents: []
    });

    res.status(201).json({ success: true, token, attendanceId: attendance._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Terminate an attendance session
// @route   PUT /api/classes/:classId/attendance/:token/terminate
// @access  Private (Teacher)
exports.terminateAttendance = async (req, res) => {
  try {
     const { classId, token } = req.params;
     const classObj = await Class.findById(classId);

     if (!classObj || classObj.teacher.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to terminate session' });
     }

     const attendance = await Attendance.findOneAndUpdate(
        { class: classId, token, isActive: true },
        { isActive: false },
        { new: true }
     );

     if (!attendance) {
        return res.status(404).json({ success: false, message: 'Active session not found' });
     }

     res.status(200).json({ success: true, message: 'Attendance session terminated successfully' });
  } catch (error) {
     res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark attendance via QR token
// @route   POST /api/classes/:classId/attendance/:token
// @access  Private (Student)
exports.markAttendance = async (req, res) => {
  try {
    const { classId, token } = req.params;

    const attendance = await Attendance.findOne({ class: classId, token, isActive: true });
    if (!attendance) {
       return res.status(404).json({ success: false, message: 'Session expired or invalidated by instructor' });
    }

    // Check if enrolled
    const enrollment = await Enrollment.findOne({ class: classId, student: req.user.id });
    if (!enrollment) {
       return res.status(403).json({ success: false, message: 'You are not enrolled in this class' });
    }

    // Add if not already present
    if (!attendance.presentStudents.includes(req.user.id)) {
       attendance.presentStudents.push(req.user.id);
       await attendance.save();
       
       // Real-time signal to teacher in the room
       const io = req.app.get('io');
       if (io) {
          io.to(classId).emit('attendance-updated', { studentId: req.user.id, name: req.user.name });
       }
    }

    res.status(200).json({ success: true, message: 'Attendance marked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's classes
// @route   GET /api/classes
// @access  Private
exports.getMyClasses = async (req, res) => {
  try {
    let classes = [];

    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      classes = await Class.find({ teacher: req.user.id }).populate('teacher', 'name avatar');
    } else {
      const enrollments = await Enrollment.find({ student: req.user.id }).populate({
        path: 'class',
        populate: {
          path: 'teacher',
          select: 'name avatar'
        }
      });
      classes = enrollments.map(e => e.class);
    }

    res.status(200).json({
      success: true,
      data: classes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single class details
// @route   GET /api/classes/:id
// @access  Private (Only enrolled or teacher)
exports.getClassDetails = async (req, res) => {
  try {
    const classDetails = await Class.findById(req.params.id).populate('teacher', 'name avatar email');

    if (!classDetails) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Access control check
    if (classDetails.teacher._id.toString() !== req.user.id && req.user.role !== 'admin') {
      const isEnrolled = await Enrollment.findOne({
        student: req.user.id,
        class: req.params.id
      });

      if (!isEnrolled) {
        return res.status(403).json({ success: false, message: 'You are not authorized to view this class' });
      }
    }

    res.status(200).json({
      success: true,
      data: classDetails
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get enrolled students
// @route   GET /api/classes/:id/students
// @access  Private
exports.getEnrolledStudents = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ class: req.params.id }).populate('student', 'name email avatar');
    const students = enrollments.map(e => e.student);
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user performance analytics
// @route   GET /api/classes/analytics
// @access  Private
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    let stats = {};

    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      const classes = await Class.find({ teacher: userId });
      const classIds = classes.map(c => c._id);
      
      const totalStudents = await Enrollment.countDocuments({ class: { $in: classIds } });
      const totalAssignments = await Assignment.countDocuments({ class: { $in: classIds } });
      
      const assignmentDocs = await Assignment.find({ class: { $in: classIds } });
      const totalSubmissions = await Submission.countDocuments({ 
        assignment: { $in: assignmentDocs.map(a => a._id) } 
      });
      const totalQuizzes = await Quiz.countDocuments({ class: { $in: classIds } });
      
      const quizDocs = await Quiz.find({ class: { $in: classIds } });
      const quizResponses = await QuizResponse.find({ 
        quiz: { $in: quizDocs.map(q => q._id) } 
      });
      
      const avgQuizScore = quizResponses.length > 0 
        ? (quizResponses.reduce((acc, curr) => acc + (curr.score || 0), 0) / quizResponses.length).toFixed(1)
        : 0;

      stats = {
        totalClasses: classes.length,
        totalStudents,
        totalAssignments,
        avgCompletionRate: totalAssignments > 0 ? ((totalSubmissions / (totalAssignments * totalStudents || 1)) * 100).toFixed(1) : 0,
        avgQuizScore,
        totalQuizzes
      };
    } else {
      const enrollments = await Enrollment.find({ student: userId });
      const classIds = enrollments.map(e => e.class);
      
      const totalClasses = classIds.length;
      const enrollment = await Enrollment.findOne({ student: userId, class: { $in: classIds } });
      const attendanceRecords = await Attendance.find({ 
         class: { $in: classIds },
         createdAt: { $gte: enrollment ? enrollment.createdAt : new Date(0) }
      });
      const presentCount = attendanceRecords.filter(a => a.presentStudents.includes(userId)).length;
      const attendanceRate = attendanceRecords.length > 0 ? ((presentCount / attendanceRecords.length) * 100).toFixed(1) : 100;
      
      const assignments = await Assignment.find({ class: { $in: classIds } });
      const submissions = await Submission.find({ student: userId, assignment: { $in: assignments.map(a => a._id) } });
      const completionRate = assignments.length > 0 ? ((submissions.length / assignments.length) * 100).toFixed(1) : 0;
      
      const quizResponses = await QuizResponse.find({ student: userId });
      const avgQuizScore = quizResponses.length > 0 
        ? (quizResponses.reduce((acc, curr) => acc + (curr.score || 0), 0) / quizResponses.length).toFixed(1)
        : 0;

      stats = {
        totalClasses,
        attendanceRate,
        completionRate,
        avgQuizScore,
        pointsEarned: (parseFloat(avgQuizScore) * 5 + submissions.length * 10 + presentCount * 2).toFixed(0),
        upcomingAssignments: assignments.filter(a => new Date(a.dueDate) > new Date()).length
      };
    }

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Get specific class analytics
// @route   GET /api/classes/:id/analytics
// @access  Private
exports.getClassAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verify access
    const classObj = await Class.findById(id);
    if (!classObj) return res.status(404).json({ success: false, message: 'Class not found' });
    
    const isTeacher = classObj.teacher.toString() === userId || req.user.role === 'admin';
    const enrollment = await Enrollment.findOne({ class: id, student: userId });
    
    if (!isTeacher && !enrollment) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let stats = {};

    if (isTeacher) {
      const totalStudents = await Enrollment.countDocuments({ class: id });
      const assignments = await Assignment.find({ class: id });
      const assignmentIds = assignments.map(a => a._id);
      
      const submissions = await Submission.find({ assignment: { $in: assignmentIds } });
      const quizzes = await Quiz.find({ class: id });
      const quizIds = quizzes.map(q => q._id);
      const responses = await QuizResponse.find({ quiz: { $in: quizIds } });
      
      // Calculate overall attendance rate for the class
      const attendanceRecords = await Attendance.find({ class: id });
      let overallAttendanceRate = 0;
      if (attendanceRecords.length > 0 && totalStudents > 0) {
         const totalAttendanceMarks = attendanceRecords.reduce((acc, curr) => acc + curr.presentStudents.length, 0);
         overallAttendanceRate = ((totalAttendanceMarks / (attendanceRecords.length * totalStudents)) * 100).toFixed(1);
      } else if (attendanceRecords.length === 0) {
         overallAttendanceRate = 100; // Perfect until a session is missed
      }

      stats = {
        totalStudents,
        totalAssignments: assignments.length,
        submissionRate: assignments.length > 0 ? ((submissions.length / (assignments.length * totalStudents || 1)) * 100).toFixed(1) : 0,
        avgQuizScore: responses.length > 0 ? (responses.reduce((acc, r) => acc + (r.score || 0), 0) / responses.length).toFixed(1) : 0,
        totalQuizzes: quizzes.length,
        attendanceRate: overallAttendanceRate
      };
    } else {
      const enrollment = await Enrollment.findOne({ class: id, student: userId });
      const attendanceRecords = await Attendance.find({ 
         class: id,
         createdAt: { $gte: enrollment ? enrollment.createdAt : new Date(0) }
      });
      const presentCount = attendanceRecords.filter(a => a.presentStudents.includes(userId)).length;
      
      const assignments = await Assignment.find({ class: id });
      const submissions = await Submission.find({ student: userId, assignment: { $in: assignments.map(a => a._id) } });
      
      const quizResponses = await QuizResponse.find({ student: userId, quiz: { $in: await Quiz.find({ class: id }).distinct('_id') } });

      stats = {
        attendanceRate: attendanceRecords.length > 0 ? ((presentCount / attendanceRecords.length) * 100).toFixed(1) : 100,
        completionRate: assignments.length > 0 ? ((submissions.length / assignments.length) * 100).toFixed(1) : 0,
        avgQuizScore: quizResponses.length > 0 ? (quizResponses.reduce((acc, r) => acc + (r.score || 0), 0) / quizResponses.length).toFixed(1) : 0,
        pointsInClass: (submissions.length * 10 + presentCount * 5).toFixed(0)
      };
    }

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export all class data (marks, attendance)
// @route   GET /api/classes/:id/export
// @access  Private (Teacher)
exports.exportClassData = async (req, res) => {
  try {
     const { id } = req.params;
     const classObj = await Class.findById(id);
     if (!classObj) return res.status(404).json({ success: false, message: 'Class not found' });

     // Verify teacher node
     if (classObj.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized data mobilization' });
     }

     const enrollments = await Enrollment.find({ class: id }).populate('student', 'name email');
     const assignments = await Assignment.find({ class: id });
     const quizzes = await Quiz.find({ class: id });
     const attendanceRecords = await Attendance.find({ class: id });

     const submissions = await Submission.find({ assignment: { $in: assignments.map(a => a._id) } });
     const quizResponses = await QuizResponse.find({ quiz: { $in: quizzes.map(q => q._id) } });

     const exportData = enrollments.map(en => {
        const student = en.student;
        const row = {
           'Student Name': student.name,
           'Email Address': student.email,
        };

        // Attendance Percentage
        const presentCount = attendanceRecords.filter(att => att.presentStudents.includes(student._id.toString())).length;
        row['Attendance (%)'] = attendanceRecords.length > 0 
           ? ((presentCount / attendanceRecords.length) * 100).toFixed(1) 
           : '100.0';

        // Assignments
        assignments.forEach(assn => {
           const sub = submissions.find(s => s.assignment.toString() === assn._id.toString() && s.student.toString() === student._id.toString());
           row[`Assignment: ${assn.title}`] = sub ? (sub.grade || 'Turned In') : 'Pending';
        });

        // Quizzes
        quizzes.forEach(qz => {
           const qr = quizResponses.find(r => r.quiz.toString() === qz._id.toString() && r.student.toString() === student._id.toString());
           row[`Quiz: ${qz.title}`] = qr ? qr.score : 'Not Taken';
        });

        return row;
     });

     res.status(200).json({ success: true, data: exportData });
  } catch (err) {
     res.status(500).json({ success: false, message: err.message });
  }
};

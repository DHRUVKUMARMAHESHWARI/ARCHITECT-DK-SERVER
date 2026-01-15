const Resume = require('../models/Resume');

// @desc    Create a new resume
// @route   POST /api/resumes
// @access  Private
exports.createResume = async (req, res, next) => {
  try {
    req.body.user = req.user.id;
    const resume = await Resume.create(req.body);
    res.status(201).json({ success: true, data: resume });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all resumes for current user
// @route   GET /api/resumes
// @access  Private
exports.getResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: resumes.length, data: resumes });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single resume
// @route   GET /api/resumes/:id
// @access  Private
exports.getResume = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      res.status(404);
      throw new Error(`Resume not found with id of ${req.params.id}`);
    }

    // Make sure user owns resume
    if (resume.user.toString() !== req.user.id) {
      res.status(401);
      throw new Error(`User not authorized to access this resume`);
    }

    res.status(200).json({ success: true, data: resume });
  } catch (err) {
    next(err);
  }
};

// @desc    Update resume
// @route   PUT /api/resumes/:id
// @access  Private
exports.updateResume = async (req, res, next) => {
  try {
    let resume = await Resume.findById(req.params.id);

    if (!resume) {
      res.status(404);
      throw new Error(`Resume not found with id of ${req.params.id}`);
    }

    // Make sure user owns resume
    if (resume.user.toString() !== req.user.id) {
      res.status(401);
      throw new Error(`User not authorized to update this resume`);
    }

    resume = await Resume.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: resume });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete resume
// @route   DELETE /api/resumes/:id
// @access  Private
exports.deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      res.status(404);
      throw new Error(`Resume not found with id of ${req.params.id}`);
    }

    // Make sure user owns resume
    if (resume.user.toString() !== req.user.id) {
      res.status(401);
      throw new Error(`User not authorized to delete this resume`);
    }

    await resume.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

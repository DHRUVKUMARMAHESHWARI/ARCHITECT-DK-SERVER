const express = require('express');
const router = express.Router();
const { 
  convertResumeFile, 
  createResumeFromText, 
  improveResumeContent, 
  reorderResumeSections, 
  getATSFeedback 
} = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');

// Validations (Basic)
// You might want to use Joi here for stricter validation in a real app
router.use(protect);

router.post('/convert', convertResumeFile);
router.post('/text', createResumeFromText);
router.post('/improve', improveResumeContent);
router.post('/reorder', reorderResumeSections);
router.post('/feedback', getATSFeedback);

module.exports = router;

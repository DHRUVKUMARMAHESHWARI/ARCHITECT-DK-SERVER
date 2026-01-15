const express = require('express');
const { 
  createResume, 
  getResumes, 
  getResume, 
  updateResume, 
  deleteResume 
} = require('../controllers/resumeController');

const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getResumes)
  .post(createResume);

router
  .route('/:id')
  .get(getResume)
  .put(updateResume)
  .delete(deleteResume);

module.exports = router;

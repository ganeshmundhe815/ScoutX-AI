const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessageHistory,
  getConversations,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', sendMessage);
router.get('/conversations', getConversations);
router.get('/:userId', getMessageHistory);

module.exports = router;

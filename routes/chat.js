import express from 'express';
import chatController from '../controllers/chat.js';
import { upload } from '../config/file-upload.js';

const router = express.Router();

// Chat room routes
router.post('/rooms', upload.single("picture") ,chatController.createChatRoom);
router.post('/rooms/createPrivateRoom', chatController.createPrivateRoom);
router.get('/rooms/user/:userId', chatController.getUserChatRooms);
router.get('/groupChatRooms', chatController.getGroupChatRooms);
router.post('/rooms/privateroom', chatController.getPrivateRoomBetweenUsers);
router.get('/rooms/:roomId', chatController.getChatRoom);
router.post('/rooms/:roomId/join', chatController.joinChatRoom);
router.post('/rooms/:roomId/leave', chatController.leaveChatRoom);
router.delete('/rooms/:roomId', chatController.deleteChatRoom);

// Message routes
router.post('/rooms/:roomId/messages', chatController.sendMessage);
router.get('/rooms/:roomId/messages', chatController.getMessages);
router.put('/messages/:messageId', chatController.editMessage);
router.delete('/messages/:messageId', chatController.deleteMessage);
router.post('/messages/:messageId/read', chatController.markMessageAsRead);

// Search and utility routes
router.get('/search/users', chatController.searchUsers);
router.get('/search/messages', chatController.searchMessages);
router.get('/rooms/:roomId/media', chatController.getMediaMessages);

export default router;
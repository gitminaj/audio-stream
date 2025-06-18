import Auth from '../models/auth.js';
import ChatRoom from '../models/chatRoom.js';
import Message from '../models/message.js';
import path from 'path';

const chatController = {
  // Create a new chat room

    createPrivateRoom: async (req, res) => {
  try {
    const { userId, receiverId } = req.body;
    console.log('room req', req.body);

    if (!userId || !receiverId) {
      return res.status(400).json({ success: false, message: 'Missing IDs' });
    }

    let chatRoom = await ChatRoom.findOne({
      participants: { $all: [userId, receiverId] },
      $expr: { $eq: [{ $size: "$participants" }, 2] }
    }).populate('participants', 'name email');

    if (!chatRoom) {
      chatRoom = new ChatRoom({
        name: 'private',
        type: 'private',
        participants: [userId, receiverId],
        admin: userId
      });
      await chatRoom.save();
      await chatRoom.populate('participants', 'name email profile isOnline lastSeen');
    }

    res.status(200).json({ success: true, data: chatRoom });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
},

  // get private room between users
  getPrivateRoomBetweenUsers: async (req, res) =>{
    try {
      const { userId, receiverId } = req.body;

      if(!userId || !receiverId){
        return res.status(404).json({
          success: false,
          message: "id missing"
        })
      }

      const response = await ChatRoom.findOne({
      participants: { $all: [userId, receiverId] },
      $expr: { $eq: [{ $size: "$participants" }, 2] } 
      }).populate('participants', 'name email profile isOnline lastSeen');

      if(!response){
        return res.status(404).json({ 
          success: false,
          message: 'Room not found'
         })
      }

      return res.status(200).json({
        success: true,
        data: response
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message
      })
    }
  },

  createChatRoom: async (req, res) => {
    try {
      const { name = 'group', description, type = 'group', participants =[], maxParticipants } = req.body;
      const picture = req.file;
      const userId = req.user.id;
      // console.log(name, description, picture, maxParticipants, req.user )

      if(!userId){
        return res.status(404).json({
          success: false,
          messsage: "UserId not found"
        })
      }

      const picturePath = picture ? picture.path : null;
      
      const chatRoom = new ChatRoom({
        picture: picturePath,
        name,
        description,
        type,
        participants: [...participants, userId],
        admin: userId
      });
      
      await chatRoom.save();
      await chatRoom.populate('participants', 'name email profile isOnline lastSeen');
      
      // Notify participants via socket
      participants.forEach(participantId => {
        const user = req.io.sockets.sockets.get(participantId);
        if (user) {
          user.join(chatRoom._id.toString());
          user.emit('newChatRoom', chatRoom);
        }
      });
      
      res.status(201).json({ success: true, chatRoom });
    } catch (error) {
      console.log('error', error.message)
      res.status(500).json({ success: false, error: error.message });
    }
  },


  // get group room between users
  getGroupChatRooms: async (req, res) =>{
    try {
      const { id } = req.user;

      // if(!userId || !receiverId){
      //   return res.status(404).json({
      //     success: false,
      //     message: "id missing"
      //   })
      // }

      const response = await ChatRoom.find({ 
        admin: { $ne: id },
        type: 'group'
       }).populate('participants', 'name email profile isOnline lastSeen')
       .populate('admin', 'name email profile');

      if(!response){
        return res.status(404).json({ 
          success: false,
          message: 'Room not found'
         })
      }

      return res.status(200).json({
        success: true,
        data: response
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message
      })
    }
  },

  // Get user's chat rooms
  getUserChatRooms: async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const chatRooms = await ChatRoom.find({ participants: userId })
        .populate('participants', 'name email profile isOnline lastSeen')
        .populate('lastMessage')
        .populate({
          path: 'lastMessage',
          populate: {
            path: 'sender',
            select: 'name'
          }
        })
        .sort({ lastActivity: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      res.json({ success: true, chatRooms });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get specific chat room
  getChatRoom: async (req, res) => {
    try {
      const { roomId } = req.params;
      
      const chatRoom = await ChatRoom.findById(roomId)
        .populate('participants', 'name profile isOnline lastSeen')
        .populate('admin', 'name picture');
      
      if (!chatRoom) {
        return res.status(404).json({ success: false, message: 'Chat room not found' });
      }
      
      res.json({ success: true, chatRoom });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Send message (REST endpoint)
   sendMessage: async (req, res) => {
      try {
        const { roomId } = req.params;
        const { content ="file", senderId, messageType = 'text', replyTo } = req.body;
        
        let fileUrl = null;
        let fileName = null;

        // If file is uploaded, set file details
        if (req.file) {
          fileUrl = path.join('chat', req.file.filename).replace(/\\/g, '/');
          fileName = req.file.originalname;
        }

        // Validate based on message type
        if (messageType === 'text' && !content?.trim()) {
          return res.status(400).json({ 
            success: false, 
            error: 'Message content cannot be empty' 
          });
        }

        if ((messageType === 'image' || messageType === 'video') && !fileUrl) {
          return res.status(400).json({ 
            success: false, 
            error: 'File is required for media messages' 
          });
        }

        const message = new Message({
          content: content || '',
          sender: senderId,
          chatRoom: roomId,
          messageType,
          fileUrl,
          fileName,
          replyTo
        });
        
        await message.save();
        await message.populate('sender', 'name profile');
        
        if (replyTo) {
          await message.populate('replyTo', 'content sender');
          await message.populate({
            path: 'replyTo',
            populate: {
              path: 'sender',
              select: 'name',
            },
          });
        }
        
        // Update chat room's last message and activity
        await ChatRoom.findByIdAndUpdate(roomId, {
          lastMessage: message._id,
          lastActivity: new Date()
        });
        
        // Emit message to room participants via socket
        req.io.to(roomId).emit('newMessage', message);
        
        res.status(201).json({ 
          success: true, 
          message,
          fileUrl: fileUrl ? `${req.protocol}://${req.get('host')}/uploads/${fileUrl}` : null
        });

      } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
  
  },


  // Get messages for a chat room
  getMessages: async (req, res) => {
    try {
      const { roomId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      
      const messages = await Message.find({ chatRoom: roomId })
        .populate('sender', 'name profile')
        .populate('replyTo', 'content sender')
        .populate({
          path: 'replyTo',
          populate: {
            path: 'sender',
            select: 'name'
          }
        })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      res.json({ success: true, messages: messages.reverse() });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Edit message
  editMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { content, userId } = req.body;
      
      const message = await Message.findById(messageId);
      
      if (!message) {
        return res.status(404).json({ success: false, message: 'Message not found' });
      }
      
      if (message.sender.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      
      message.content = content;
      message.edited = true;
      message.editedAt = new Date();
      
      await message.save();
      await message.populate('sender', 'name profile');
      
      // Emit updated message to room
      req.io.to(message.chatRoom.toString()).emit('messageEdited', message);
      
      res.json({ success: true, message });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Delete message
  deleteMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId } = req.body;
      
      const message = await Message.findById(messageId);
      
      if (!message) {
        return res.status(404).json({ success: false, message: 'Message not found' });
      }
      
      if (message.sender.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      
      await Message.findByIdAndDelete(messageId);
      
      // Emit message deletion to room
      req.io.to(message.chatRoom.toString()).emit('messageDeleted', { messageId });
      
      res.json({ success: true, message: 'Message deleted' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Mark message as read
  markMessageAsRead: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { userId } = req.body;
      
      const message = await Message.findById(messageId);
      
      if (!message) {
        return res.status(404).json({ success: false, message: 'Message not found' });
      }
      
      // Check if user already read this message
      const alreadyRead = message.readBy.some(read => read.user.toString() === userId);
      
      if (!alreadyRead) {
        message.readBy.push({ user: userId });
        await message.save();
        
        // Emit read receipt to room
        req.io.to(message.chatRoom.toString()).emit('messageRead', {
          messageId,
          userId,
          readAt: new Date()
        });
      }
      
      res.json({ success: true, message: 'Message marked as read' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Join chat room
  joinChatRoom: async (req, res) => {
    try {
      const { roomId } = req.params;
      const { userId } = req.body;
      
      const chatRoom = await ChatRoom.findById(roomId);
      
      if (!chatRoom) {
        return res.status(404).json({ success: false, message: 'Chat room not found' });
      }
      
      if (!chatRoom.participants.includes(userId)) {
        chatRoom.participants.push(userId);
        await chatRoom.save();
        
        // Emit user joined event
        req.io.to(roomId).emit('userJoined', { userId, roomId });
      }
      
      res.json({ success: true, message: 'Joined chat room' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Leave chat room
  leaveChatRoom: async (req, res) => {
    try {
      const { roomId } = req.params;
      const { userId } = req.body;
      
      const chatRoom = await ChatRoom.findById(roomId);
      
      if (!chatRoom) {
        return res.status(404).json({ success: false, message: 'Chat room not found' });
      }
      
      chatRoom.participants = chatRoom.participants.filter(
        participant => participant.toString() !== userId
      );
      
      await chatRoom.save();
      
      // Emit user left event
      req.io.to(roomId).emit('userLeft', { userId, roomId });
      
      res.json({ success: true, message: 'Left chat room' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Delete chat room
  deleteChatRoom: async (req, res) => {
    try {
      const { roomId } = req.params;
      const { userId } = req.body;
      
      const chatRoom = await ChatRoom.findById(roomId);
      
      if (!chatRoom) {
        return res.status(404).json({ success: false, message: 'Chat room not found' });
      }
      
      if (chatRoom.admin.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Only admin can delete room' });
      }
      
      // Delete all messages in the room
      await Message.deleteMany({ chatRoom: roomId });
      
      // Delete the room
      await ChatRoom.findByIdAndDelete(roomId);
      
      // Emit room deleted event
      req.io.to(roomId).emit('roomDeleted', { roomId });
      
      res.json({ success: true, message: 'Chat room deleted' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Search users
  searchUsers: async (req, res) => {
    try {
      const { query, limit = 10 } = req.query;
      
      const users = await Auth.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      })
      .select('name email profile isOnline')
      .limit(parseInt(limit));
      
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Search messages
  searchMessages: async (req, res) => {
    try {
      const { query, roomId, limit = 20 } = req.query;
      
      const searchFilter = {
        content: { $regex: query, $options: 'i' }
      };
      
      if (roomId) {
        searchFilter.chatRoom = roomId;
      }
      
      const messages = await Message.find(searchFilter)
        .populate('sender', 'name profile')
        .populate('chatRoom', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
      
      res.json({ success: true, messages });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Get media messages
  getMediaMessages: async (req, res) => {
    try {
      const { roomId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const messages = await Message.find({
        chatRoom: roomId,
        messageType: { $in: ['image', 'file'] }
      })
      .populate('sender', 'name profile')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
      res.json({ success: true, messages });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

export default chatController;
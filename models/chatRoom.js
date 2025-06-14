import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  picture:{
    type: String,
  },
  type: {
    type: String,
    enum: ['group', 'private'],
    default: 'group'
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auth'
  }],
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auth',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxParticipants: {
    type: Number,
    default: 7
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ lastActivity: -1 });

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

export default ChatRoom;
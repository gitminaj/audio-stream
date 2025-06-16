import Auth from "../models/auth.js";
import ChatRoom from "../models/chatRoom.js";
import Message from "../models/message.js";

const socketController = {
  handleConnection: (socket, io) => {
    // User authentication and setup
    socket.on("authenticate", async (data) => {
      try {
        const { userId } = data;
        // Update user's online status and socket ID
        const res = await Auth.findByIdAndUpdate(
          userId,
          {
            isOnline: true,
            socketId: socket.id,
            lastSeen: new Date(),
          },
          { new: true }
        );

        socket.userId = userId;

        // Join user to their chat rooms
        const userChatRooms = await ChatRoom.find({ participants: userId });
        userChatRooms.forEach((room) => {
          socket.join(room._id.toString());
        });

        // Notify others that user is online
        socket.broadcast.emit("userOnline", { userId });

        socket.emit("authenticated", { success: true });
        // console.log('authenticate', socket.userId )
      } catch (error) {
        socket.emit("error", { message: "Authentication failed" });
      }
    });

    // Handle sending messages via socket
    socket.on("sendMessage", async (data) => {
      try {
        const {
          content,
          chatRoomId,
          messageType = "text",
          fileUrl,
          fileName,
          replyTo,
        } = data;


        if (!socket.userId) {
          socket.emit("error", { message: "Not authenticated" });
          return;
        }

        const message = new Message({
          content,
          sender: socket.userId,
          chatRoom: chatRoomId,
          messageType,
          fileUrl,
          fileName,
          replyTo,
        });

        await message.save();
        await message.populate("sender", "name profile");

        if (replyTo) {
          await message.populate("replyTo", "content sender");
          await message.populate({
            path: "replyTo",
            populate: {
              path: "sender",
              select: "name",
            },
          });
        }

        // Update chat room's last message and activity
        await ChatRoom.findByIdAndUpdate(chatRoomId, {
          lastMessage: message._id,
          lastActivity: new Date(),
        });

        // Send message to all users in the chat room
        io.to(chatRoomId).emit("newMessage", message);

        // Send delivery confirmation to sender
        socket.emit("messageDelivered", {
          tempId: data.tempId,
          messageId: message._id,
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle typing indicators
    socket.on("typing", (data) => {
      const { chatRoomId, isTyping } = data;

      if (!socket.userId) return;

      socket.to(chatRoomId).emit("userTyping", {
        userId: socket.userId,
        isTyping,
        chatRoomId,
      });
    });

    // Handle joining a chat room
    socket.on("joinRoom", async (data) => {
      try {
        const { chatRoomId } = data;

        if (!socket.userId) {
          socket.emit("error", { message: "Not authenticated" });
          return;
        }

        // Verify user is participant in the room
        const chatRoom = await ChatRoom.findById(chatRoomId);
        if (!chatRoom || !chatRoom.participants.includes(socket.userId)) {
          socket.emit("error", { message: "Access denied to chat room" });
          return;
        }

        socket.join(chatRoomId);
        socket.emit("joinedRoom", { chatRoomId });

        // Notify others in the room
        socket.to(chatRoomId).emit("userJoinedRoom", {
          userId: socket.userId,
          chatRoomId,
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("joinGroupChatRoom", async (data) => {
      try {
        const { chatRoomId } = data;

        if (!socket.userId) {
          socket.emit("error", { message: "Not authenticated" });
          return;
        }

        // Verify chatroom exist
        const chatRoom = await ChatRoom.findById(chatRoomId);
        if (!chatRoom) {
          socket.emit("error", { message: "chat room not found" });
          return;
        }

        const res = await ChatRoom.findByIdAndUpdate(
          chatRoomId,
          { $addToSet: { participants: socket.userId } },
          { new: true }
        );

        console.log("res", res);

        socket.join(chatRoomId);
        socket.emit("joinedRoom", { chatRoomId, success: true });

        // Notify others in the room
        socket.to(chatRoomId).emit("userJoinedRoom", {
          userId: socket.userId,
          chatRoomId,
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // Handle leaving a chat room
    socket.on("leaveRoom", async (data) => {
  const { chatRoomId } = data;

  try {
    const chatRoom = await ChatRoom.findById(chatRoomId);

    if (!chatRoom) {
      socket.emit("error", { message: "Chat room not found" });
      return;
    }

    const isAdmin = chatRoom.admin?.toString() === socket.userId;
    const isGroup = chatRoom.type === "group";

    // Only delete if admin is leaving a group room
    if (isAdmin && isGroup) {
      io.to(chatRoomId).emit("roomDeleted", { chatRoomId });

      const connectedSockets = await io.in(chatRoomId).fetchSockets();
      for (const s of connectedSockets) {
        s.leave(chatRoomId);
      }

      await Message.deleteMany({ chatRoom: chatRoomId });
      await ChatRoom.findByIdAndDelete(chatRoomId);
    } else {
      // Normal leave flow
      socket.leave(chatRoomId);
      socket.emit("leftRoom", { chatRoomId });

      chatRoom.participants = chatRoom.participants.filter(
        (id) => id.toString() !== socket.userId
      );
      await chatRoom.save();

      socket.to(chatRoomId).emit("userLeftRoom", {
        userId: socket.userId,
        chatRoomId,
      });
    }
  } catch (error) {
    console.error("Leave room error:", error);
    socket.emit("error", { message: "Failed to leave room" });
  }
});


    // Handle message read receipts
    socket.on("markMessageRead", async (data) => {
      try {
        const { messageId, chatRoomId } = data;

        if (!socket.userId) return;

        const message = await Message.findById(messageId);
        if (!message) return;

        // Check if user already read this message
        const alreadyRead = message.readBy.some(
          (read) => read.user.toString() === socket.userId
        );

        if (!alreadyRead) {
          message.readBy.push({ user: socket.userId });
          await message.save();

          // Notify sender about read receipt
          io.to(chatRoomId).emit("messageRead", {
            messageId,
            userId: socket.userId,
            readAt: new Date(),
          });
        }
      } catch (error) {
        console.error("Mark message read error:", error);
      }
    });

    // Handle message editing via socket
    socket.on("editMessage", async (data) => {
      try {
        const { messageId, content } = data;

        console.log(messageId, content, socket.userId);

        if (!socket.userId) {
          socket.emit("error", { message: "Not authenticated" });
          return;
        }

        const message = await Message.findById(messageId);

        console.log("messa", message);

        if (!message) {
          socket.emit("error", { message: "Message not found" });
          return;
        }

        if (message.sender.toString() !== socket.userId) {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        message.content = content;
        message.edited = true;
        message.editedAt = new Date();

        await message.save();
        await message.populate("sender", "name profile");

        // Notify all users in the room
        io.to(message.chatRoom.toString()).emit("messageEdited", message);
      } catch (error) {
        socket.emit("error", { message: "Failed to edit message" });
      }
    });

    // Handle message deletion via socket
    socket.on("deleteMessage", async (data) => {
      try {
        const { messageId } = data;

        if (!socket.userId) {
          socket.emit("error", { message: "Not authenticated" });
          return;
        }

        const message = await Message.findById(messageId);

        if (!message) {
          socket.emit("error", { message: "Message not found" });
          return;
        }

        if (message.sender.toString() !== socket.userId) {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        const chatRoomId = message.chatRoom.toString();
        await Message.findByIdAndDelete(messageId);

        // Notify all users in the room
        io.to(chatRoomId).emit("messageDeleted", { messageId });
      } catch (error) {
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    // Handle video call initiation
    socket.on("initiateCall", (data) => {
      const { targetUserId, callType, chatRoomId } = data;

      if (!socket.userId) return;

      // Find target user's socket
      const targetUser = Array.from(io.sockets.sockets.values()).find(
        (s) => s.userId === targetUserId
      );

      if (targetUser) {
        targetUser.emit("incomingCall", {
          callerId: socket.userId,
          callType,
          chatRoomId,
        });
      }
    });

    // Handle call response
    socket.on("callResponse", (data) => {
      const { callerId, accepted, chatRoomId } = data;

      // Find caller's socket
      const callerSocket = Array.from(io.sockets.sockets.values()).find(
        (s) => s.userId === callerId
      );

      if (callerSocket) {
        callerSocket.emit("callResponse", {
          userId: socket.userId,
          accepted,
          chatRoomId,
        });
      }
    });

    // Handle WebRTC signaling
    socket.on("webrtcSignal", (data) => {
      const { targetUserId, signal } = data;

      const targetUser = Array.from(io.sockets.sockets.values()).find(
        (s) => s.userId === targetUserId
      );

      if (targetUser) {
        targetUser.emit("webrtcSignal", {
          userId: socket.userId,
          signal,
        });
      }
    });
  },

  handleDisconnection: async (socket, io) => {
    if (socket.userId) {
      try {
        // Update user's offline status
        const res = await Auth.findByIdAndUpdate(
          socket.userId,
          {
            isOnline: false,
            lastSeen: new Date(),
            socketId: null,
          },
          { new: true }
        );

        // Notify others that user is offline
        socket.broadcast.emit("userOffline", { userId: socket.userId });
      } catch (error) {
        console.error("Error updating user offline status:", error);
      }
    }
  },
};

export default socketController;

import serverClient from '../config/stream.js';
import MessageModel from '../models/message.js';

export const sendDirectMessage = async (req, res) => {
    try {
        const { senderId, receiverId, text } = req.body;

        // Make sure sender + receiver exist on Stream
        await serverClient.upsertUser({ id: senderId });
        await serverClient.upsertUser({ id: receiverId });

        const members = [senderId, receiverId].sort();
        const channelId = `dm-${members[0]}-${members[1]}`;

        const channel = serverClient.channel('messaging', channelId, {
            name: `Direct message between ${members[0]} and ${members[1]}`,
            members,
            created_by_id: senderId,
        });

        await channel.create();

        const response = await channel.sendMessage({
            text,
            user_id: senderId,
        });

        res.status(201).json({
            success: true,
            message: "Direct message sent",
            streamResponse: response,
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};



export const getMessages = async (req, res) => {
    try {
        const { senderId, receiverId } = req.params;

        const members = [senderId, receiverId].sort();
        const channelId = `dm-${members[0]}-${members[1]}`;

        const channel = serverClient.channel('messaging', channelId);

        const response = await channel.query({
            messages: { limit: 50, sort: [{ created_at: 1 }] },
        });

        res.status(200).json({
            success: true,
            data: response.messages,
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};


export const sendGroupMessage = async (req, res) => {
  try {
      const { senderId, roomId, text } = req.body;

      const channel = serverClient.channel('messaging', roomId);

      const response = await channel.sendMessage({
          text,
          user_id: senderId,
      });

      res.status(201).json({
          success: true,
          message: "Group message sent",
          streamResponse: response,
      });

  } catch (err) {
      res.status(500).json({
          success: false,
          message: err.message,
      });
  }
};

export const getGroupMessages = async (req, res) => {
    try {
        const { roomId } = req.params;

        const channel = serverClient.channel('messaging', roomId);

        // Get messages (default limit is 20; you can adjust with { limit: N })
        const messages = await channel.query({ messages: { limit: 50 } });

        return res.status(200).json({
            success: true,
            roomId: roomId,
            messages: messages.messages, // array of message objects
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

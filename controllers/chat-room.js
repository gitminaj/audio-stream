import { json } from 'express';
import serverClient from '../config/stream.js';


export const createRoom = async (req, res) => {
    try {
        const { id } = req.user
        const { roomId, members } = req.body;

        const channel = serverClient.channel('messaging', roomId, {
            name: `Room: ${roomId}`,
            members,
            created_by_id: id,
        });

        await channel.create();

        // Only send back safe data
        return res.status(201).json({
            success: true,
            data: {
                id: channel.id,
                cid: channel.cid,
                type: channel.type,
                members: channel.state.members,
            },
            message: 'Room created successfully',
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};


export const getRoomCount = async (req, res) => {
    try {
        // Query all channels of type 'messaging'
        const filters = { type: 'messaging' };
        const sort = [{ last_message_at: -1 }];
        const channels = await serverClient.queryChannels(filters, sort, { limit: 100 });

        const roomCount = channels.length;

        // Extract room ID and room name from each channel
        const rooms = channels.map(channel => ({
            roomId: channel.id,
            roomName: channel.data.name || '',
        }));

        return res.status(200).json({
            success: true,
            roomCount,
            rooms,
            message: `There are ${roomCount} rooms.`,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};


export const deleteRoom = async (req, res) => {
    try {
        const { roomId } = req.params;  // assuming you pass the roomId in the URL, e.g., /api/v1/room/:roomId

        const channel = serverClient.channel('messaging', roomId);

        // Call delete on the channel
        await channel.delete();

        return res.status(200).json({
            success: true,
            message: `Room ${roomId} deleted successfully.`,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

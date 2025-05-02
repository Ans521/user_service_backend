import {io} from '../app'

export const userSocketMap = new Map<string, string>()

export const sendNotification = (socketId : any, message : any) => {
    console.log("socketId", socketId)
    io.to(socketId).emit('notification', message);
}

import ioClient from "socket.io-client";

const socket = ioClient("http://82.180.144.143:4000");

socket.on('connect', () => {
  socket.emit('set-user-id', '68133b7684870d278960430c');
});

socket.on('server-connect', (message : any) => {
  console.log('Received from server:', message);
});
// Listen for incoming messages from the server
socket.on('notification', (message : any) => {
  console.log('Received from server:', message);
});

// Listen for disconnect events
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

// Add error handling for connection issues
socket.on('connect_error', (error : any) => {
  console.error('Connection error:');
});

socket.on('error', (error : any) => {
  console.error('Error in socket communication:');
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect to the server.');
});

socket.on('reconnect', (attempt : any) => {
  console.log(`Reconnected to the server. Attempt number: ${attempt}`);
});

import ioClient from "socket.io-client";

const socket = ioClient("http://localhost:4000");

socket.on('connect', () => {
  socket.emit('clientMessage', 'Hello from client!');
});

// Listen for incoming messages from the server
socket.on('serverMessage', (message : any) => {
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

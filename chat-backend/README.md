# PhotoMaster Chat Server

This is the real-time chat server for the PhotoMaster application. It provides WebSocket functionality for real-time messaging between users.

## Features

- Real-time messaging
- User presence tracking
- Typing indicators
- Join/leave notifications

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file with the following variables:

   ```
   PORT=5000
   NODE_ENV=development
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

## Docker Integration

The chat server is designed to work with Docker Compose as part of the PhotoMaster application. When running in Docker, the server will be available at `http://chat-server:5000` from other containers.

## API Endpoints

- `GET /health` - Health check endpoint

## WebSocket Events

### Client to Server

- `join` - User joins the chat
- `message` - New message
- `typing` - User typing status
- `disconnect` - User disconnects

### Server to Client

- `message` - Receive new message
- `userJoined` - User joined notification
- `userLeft` - User left notification
- `typing` - User typing status update

## Error Handling

The server includes comprehensive error handling for:

- Connection issues
- Invalid messages
- Server errors
- Database errors (if implemented)

## Security

- CORS enabled
- Input validation
- Error logging
- Rate limiting (to be implemented)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

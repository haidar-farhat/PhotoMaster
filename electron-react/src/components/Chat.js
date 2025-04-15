import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const ChatContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: "100%",
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.palette.background.paper,
}));

const MessageList = styled(List)({
  flexGrow: 1,
  overflow: "auto",
  marginBottom: (theme) => theme.spacing(2),
});

const MessageInput = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
}));

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState(
    "User" + Math.floor(Math.random() * 1000)
  );
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const chatServerUrl =
      process.env.REACT_APP_CHAT_SERVER_URL || "http://localhost:5000";
    console.log("Connecting to chat server at:", chatServerUrl);

    const newSocket = io(chatServerUrl);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to chat server");
      setIsConnected(true);
      newSocket.emit("join", username);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Chat server connection error:", error);
      setIsConnected(false);
    });

    newSocket.on("message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    newSocket.on("userJoined", (data) => {
      setMessages((prev) => [
        ...prev,
        { type: "system", content: `${data.username} joined the chat` },
      ]);
    });

    newSocket.on("userLeft", (data) => {
      setMessages((prev) => [
        ...prev,
        { type: "system", content: `${data.username} left the chat` },
      ]);
    });

    return () => {
      console.log("Disconnecting from chat server");
      newSocket.close();
    };
  }, [username]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket) {
      socket.emit("message", { message, username });
      setMessage("");
    }
  };

  return (
    <ChatContainer elevation={3}>
      <Typography variant="h6" gutterBottom>
        Chat {!isConnected && "(Connecting...)"}
      </Typography>
      <MessageList>
        {messages.map((msg, index) => (
          <React.Fragment key={index}>
            <ListItem>
              <ListItemText
                primary={
                  msg.type === "system" ? (
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      align="center"
                    >
                      {msg.content}
                    </Typography>
                  ) : (
                    <>
                      <Typography variant="subtitle2" component="span">
                        {msg.username}
                      </Typography>
                      <Typography variant="body1" component="div">
                        {msg.message}
                      </Typography>
                    </>
                  )
                }
              />
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </MessageList>
      <form onSubmit={handleSendMessage}>
        <MessageInput>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!isConnected}
          />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={!isConnected || !message.trim()}
          >
            Send
          </Button>
        </MessageInput>
      </form>
    </ChatContainer>
  );
};

export default Chat;

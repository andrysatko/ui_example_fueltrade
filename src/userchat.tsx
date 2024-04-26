import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
};

type Message = {
  id: number;
  text: string;
  fileName: string | null;
  orderId: number;
  senderId: number;
  receiverId: number;
  createdAt: string;
  updatedAt: string;
  Admin: User;
  Client: User;
};

const App = () => {
  const [jwt, setJwt] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomName, setRoomName] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingMessage, setTypingMessage] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  // Fetch chat history from the server
  const fetchChatHistory = async (roomId: number) => {
    try {
      const response = await fetch(
          `http://localhost:3000/chat/chat-history/${roomId}`
      );
      const data = await response.json();
      console.log("Chat history:", data);
      return data;
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return [];
    }
  };

  // Join a chat room
  const joinRoom = () => {
    if (socket && roomName && user) {
      const userPayload = { socketId: socket.id, userId: user.id, userName: user.firstName };
      socket.emit("joinRoom", { roomName, user: userPayload });
      setMessages([]);
      const fetchHistory = async () => {
        try {
          const history = await fetchChatHistory(parseInt(roomName));
          setMessages(history);
        } catch (e) {
          console.log(e);
        }
      };
      fetchHistory();
    }
  };

  // Send a message to the chat room
  const sendMessage = () => {
    if (socket && roomName && user && message) {
      const userPayload = { socketId: socket.id, userId: user.id, userName: user.firstName };
      const payload = {
        message,
        roomName,
        timeSent: Date.now(),
        user: userPayload,
      };
      socket.emit("chat", payload);
      setMessage("");
      handleStopTyping();
    }
  };

  // Upload a file to the chat room
  const handleFileUpload = () => {
    if (socket && roomName && user && file) {
      const userPayload = { socketId: socket.id, userId: user.id, userName: user.firstName };
      const filePayload = {
        roomName,
        user: userPayload,
        file,
        fileName: file.name,
        fileType: file.type,
      };
      socket.emit("file", filePayload);
    }
  };

  // Send a typing event to the chat room
  const handleTyping = () => {
    if (socket && roomName && user) {
      const userPayload = { socketId: socket.id, userId: user.id, userName: user.firstName };
      const payload = { roomName, user: userPayload, isTyping: true };
      socket.emit("typing", payload);
      setIsTyping(true);
    }
  };

  // Stop sending typing events to the chat room
  const handleStopTyping = () => {
    if (socket && roomName && user) {
      const userPayload = { socketId: socket.id, userId: user.id, userName: user.firstName };
      const payload = { roomName, user: userPayload, isTyping: false };
      socket.emit("typing", payload);
      setIsTyping(false);
    }
  };

  // Sign in the user and retrieve user data
  const handleSignIn = async () => {
    const result = await fetch("http://localhost:3000/user/personal-data", {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (!result.ok) {
      return;
    }
    const data = await result.json();
    console.log(data);
    setUser(data);
  };

  // Set up the socket connection and event listeners
  useEffect(() => {
    if (user) {
      const newSocket = io("http://localhost:8001", { query: { token: `Bearer ${jwt}` } });
      setSocket(newSocket);
      console.log("Socket:", newSocket);
      console.log("User:", user);

      newSocket.on("chat", (data) => {
        console.log(data);
        setMessages((prevMessages) => [...prevMessages, data]);
      });

      newSocket.on("typing", (data) => {
        if (data.isTyping) {
          setTypingMessage(`${data.user.userName} is typing...`);
        } else {
          setTypingMessage("");
        }
      });

      newSocket.on("file", (data) => {
        setMessages((prevMessages) => [...prevMessages, data]);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, jwt]);

  return (
      <div>
        {/* Login form */}
        {!user && (
            <div>
              <input
                  type="text"
                  placeholder="JWT Token"
                  value={jwt}
                  onChange={(e) => setJwt(e.target.value)}
              />
              <button onClick={handleSignIn}>Login</button>
            </div>
        )}

        {/* Chat room */}
        {user && (
            <div>
              <h1>Chat Room</h1>
              <div>
                <input
                    type="text"
                    placeholder="Room Name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                />
                <button onClick={joinRoom}>Join Room</button>
              </div>
              <div>
                <input
                    type="text"
                    placeholder="Message"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping();
                    }}
                    onBlur={handleStopTyping}
                />
                <button onClick={sendMessage}>Send Message</button>
                <input
                    type="file"
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                />
                <button onClick={handleFileUpload}>Upload File</button>
              </div>
              <div>
                <h2>Messages</h2>
                {messages.map((msg, index) => {
                  const sender = msg.senderId === msg.Admin.id ? msg.Admin : msg.Client;
                  return (
                      <div key={index}>
                        <p>{sender.firstName}:</p>
                        {msg.fileName && !msg.text ? (
                            <div>
                              <p>{sender.firstName} shared the file : </p>
                              <img
                                  src={`http://localhost:3000/static/${msg.fileName}`}
                                  alt={msg.fileName}
                                  width="100%"
                                  height="300"
                              />
                            </div>
                        ) : (
                            msg.text
                        )}
                      </div>
                  );
                })}
                {typingMessage && <div>{typingMessage}</div>}
              </div>
            </div>
        )}
      </div>
  );
};

export default App;
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
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
  const [socket, setSocket] = useState(null);
  const [roomName, setRoomName] = useState(null);
  const [User, setUser] = useState<User| null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState("");
  const [file, setFile] = useState(null);
  const [authorization, setAuthorization] = useState('');

  const fetchChatHistory = async (roomId:any) => {
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
  
  const fetchWhoAmI = async () => {
    const response = await fetch("http://localhost:3000/user/personal-data", {
      headers: { Authorization: `Bearer ${authorization}` },
    });
    return response.json();
  }

  useEffect(() => {
    const fetchUser = async () => {
      if (authorization) {
        const user = await fetchWhoAmI();
        setUser(user);
      }
    };
    fetchUser();
  }, [authorization])
  useEffect(() => {
    const newSocket = io("http://localhost:8001", {
      query: {
        token: `Bearer `,
      },
    });
    setSocket(newSocket);

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

    newSocket.on("file", (data: Message & { fileName: string }) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinRoom = () => {
    if (socket && roomName && User) {
      const user = { socketId: socket.id, userId: 2, userName: User.firstName };
      socket.emit("joinRoom", { roomName, user });
      setMessages([]);
      const fetchHistory = async () => {
        try {
          if (roomName) {
            const history = await fetchChatHistory(roomName);
            setMessages(history);
          }
        } catch (e) {
          console.log(e);
        }
      };

      fetchHistory();
    }
  };

  const sendMessage = () => {
    if (socket && roomName && User && message) {
      const user = { socketId: socket.id, userId: 2, userName: User.firstName };
      const payload = {
        eventName: "chat",
        message,
        roomName,
        timeSent: Date.now(),
        user,
      };
      socket.emit("chat", payload);
      setMessage("");
      handleStopTyping();
    }
  };

  const handleFileUpload = () => {
    if (socket && roomName && User && file) {
      const user = { socketId: socket.id, userId: 2, userName: User.firstName };
      const filePayload = {
        roomName,
        user,
        file: file,
        fileName: file.name,
        fileType: file.type,
      };
      socket.emit("file", filePayload);
    }
  };

  const handleTyping = () => {
    if (socket && roomName && User) {
      const user = { socketId: socket.id, userId: 2, userName: User.firstName };
      const payload = { roomName, user, isTyping: true };
      socket.emit("typing", payload);
      setIsTyping(true);
    }
  };

  const handleStopTyping = () => {
    if (socket && roomName && User) {
      const user = { socketId: socket.id, userId: 2, userName: User.firstName };
      const payload = { roomName, user, isTyping: false };
      socket.emit("typing", payload);
      setIsTyping(false);
    }
  };

  return (
    <div>
      <h1>Chat Room</h1>
      <div>
        <input
          type="text"
          placeholder="Room Name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Authorization"
          value={authorization}
          onChange={e=>setAuthorization(e.target.value)}
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
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
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
                    src={"http://localhost:3000/static/" + msg.fileName}
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
  );
};

export default App;

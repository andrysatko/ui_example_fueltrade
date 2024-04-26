import { useEffect, useState } from "react";
import "./App.css";
import io, { Socket } from "socket.io-client";
import MessageInput from "./MessageInput";
import Mesages from "./Message";
import AdminChat from "./adminchat";
import UserChat from "./userchat";
function App() {
  const [socket, setSocket] = useState<Socket | null>(null);

  const [messages, setMessages] = useState<string[]>([]);

  const send = (value: string) => {
    socket?.emit("message", value);
  };
  useEffect(() => {
    const newSocket = io("http://localhost:8001");
    setSocket(newSocket);
  }, [setSocket]);
  const MessageListenere = (message: string) => {
    setMessages([...messages, message])
  }
  useEffect(() => {
    if (socket) {
      socket.on("message", MessageListenere);
      return () => {
        socket.off("message", MessageListenere);
      };
    }
  }, [MessageListenere]);
  return <>
  <UserChat ></UserChat>

  </>
}

export default App;

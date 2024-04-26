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
export default function Chat(){
const [user, setUser] = useState<User | null>(null);
const [authorization, setAuthorization] = useState<string| null>(null);


const handleSignIn = async () => {
    try {
        if(authorization){
            const response = await fetch("http://localhost:3000/user/personal-data", {
                headers: { Authorization: `Bearer ${authorization}` },
              });
            const user = await response.json();
              setUser(user);
        }else{
            console.error("Authorization token is required");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(null);
      }
}
return(
    <div>
        <input type="text" value={authorization} onChange={e=>setAuthorization(e.target.value)}/>
        <button onClick={e=>{}}>SignIn</button>
    </div>
)
}
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getuserbyid, getChatHistory } from "../api";
import Dashboard from "../Dashboard";
import { io } from "socket.io-client";
import { Send, Smile, Paperclip, ArrowLeft } from "lucide-react";

const socket = io("http://localhost:5000");

const ChatBox = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const myid = localStorage.getItem("userId");
  const [friendData, setFriendData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await getuserbyid(id);
        if (data) {
          console.log("tes data", data);
          
          setFriendData(data);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    const fetchMessages = async () => {
      try {
        const { data } = await getChatHistory(myid, id);
        if (data) {
          const filteredMessages = data.filter(
            msg => 
              (msg.sender_id == myid && msg.receiver_id == id) || 
              (msg.sender_id == id && msg.receiver_id == myid)
          );
          
          setMessages(filteredMessages);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    if (id) {
      fetchUser();
      fetchMessages();
    }

    socket.emit("joinRoom", { myid, friendId: id });

    socket.on("receiveMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on("userTyping", () => {
      setIsTyping(true);
    });

    socket.on("userStoppedTyping", () => {
      setIsTyping(false);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
    };
  }, [id, myid]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "") return;

    const messageData = {
      sender: myid,
      receiver: id,
      text: newMessage,
    };

    socket.emit("sendMessage", messageData);
    setNewMessage("");
    inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    socket.emit("typing", { myid, friendId: id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { myid, friendId: id });
    }, 2000);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const groupMessagesByDate = () => {
    const groups = {};
    messages.forEach(msg => {
      const date = getMessageDate(msg.timestamp || Date.now());
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  useEffect(() => {
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, 100);
  }, [messages]);

  const messageGroups = groupMessagesByDate();

  const handleBackButton = () => {
    navigate(-1);
  };

  return (
    <div className="flex w-full flex-col items-center h-screen bg-gray-900 md:w-[400px] lg:w-[400px] lg:ml-170">
      <div className="w-full h-screen bg-gray-800 rounded-lg shadow-2xl flex flex-col border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800 text-white rounded-t-lg sticky top-0 z-10">
          <div className="flex items-center">
            <button 
              onClick={handleBackButton} 
              className="p-2 mr-2 rounded-full hover:bg-gray-700 transition-colors"
              aria-label="Back to chat list"
            >
              <ArrowLeft size={20} className="text-blue-400" />
            </button>
            {friendData?.profile_image_url ? (
              <img
                src={friendData.profile_image_url}
                alt={friendData.name}
                className="w-12 h-12 rounded-full border-2 border-blue-600 mr-3 object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold mr-3 shadow-lg">
                {friendData?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-lg font-semibold">{friendData ? friendData.name : "Loading..."}</div>
              <div className="text-xs flex items-center">
                <span className={`h-2 w-2 rounded-full ${isTyping ? "bg-green-400 animate-pulse" : "bg-green-500"} mr-2`}></span>
                <span className="text-gray-300">
                  {isTyping ? "Sedang mengetik..." : "Online"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={chatRef} 
          className="flex-1 p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-gray-900 to-gray-800 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
        >
          {Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date} className="space-y-4">
              <div className="flex justify-center">
                <div className="px-4 py-1 bg-gray-700 rounded-full text-xs text-gray-300 shadow-md">
                  {date}
                </div>
              </div>
              
              {msgs.map((msg, idx) => {
                const isMine = msg.sender_id == myid;
                const showAvatar = idx === 0 || msgs[idx - 1]?.sender_id !== msg.sender_id;
                const isLastInGroup = idx === msgs.length - 1 || msgs[idx + 1]?.sender_id !== msg.sender_id;
                
                return (
                  <div
                    key={idx}
                    className={`flex ${isMine ? "justify-end" : "justify-start"} ${!isLastInGroup ? "mb-1" : "mb-3"}`}
                  >
                    {/* {!isMine && showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex-shrink-0 mr-2 flex items-center justify-center text-gray-300 text-xs font-bold shadow-md">
                        {friendData?.name?.charAt(0).toUpperCase()}
                      </div>
                    )} */}
                    
                    <div className={`space-y-1 max-w-xs ${isMine ? "items-end" : "items-start"}`}>
                      <div
                        className={`p-3 rounded-2xl shadow-md ${
                          isMine
                            ? "bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-br-none"
                            : "bg-gradient-to-r from-gray-700 to-gray-800 text-gray-200 rounded-bl-none"
                        }`}
                      >
                        {msg.message}
                      </div>
                      <div className={`text-xs text-gray-500 px-2 ${isMine ? "text-right" : "text-left"}`}>
                        {formatTime(msg.timestamp || Date.now())}
                      </div>
                    </div>
                    
                    {/* {isMine && showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex-shrink-0 ml-2 flex items-center justify-center text-blue-200 text-xs font-bold shadow-md">
                        {localStorage.getItem("userName")?.charAt(0).toUpperCase() || "Me"}
                      </div>
                    )} */}
                  </div>
                );
              })}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex-shrink-0 mr-2 flex items-center justify-center text-gray-300 text-xs font-bold shadow-md">
                {friendData?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-r from-gray-700 to-gray-800 text-gray-200 rounded-bl-none shadow-md">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-lg">
          <div className="flex items-center bg-gray-700 rounded-full px-4 py-2 shadow-inner">
            <button 
              onClick={() => setShowEmoji(!showEmoji)} 
              className="p-2 rounded-full text-gray-400 hover:bg-gray-600 hover:text-blue-400 transition-colors"
            >
              <Smile size={20} />
            </button>
            <button className="p-2 rounded-full text-gray-400 hover:bg-gray-600 hover:text-blue-400 transition-colors">
              <Paperclip size={20} />
            </button>
            
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 p-2 mx-2 bg-transparent outline-none text-gray-200 placeholder-gray-500"
              placeholder="Ketik pesan..."
            />
            
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className={`p-3 rounded-full ${
                newMessage.trim() 
                  ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-700 hover:to-blue-900" 
                  : "bg-gray-600 text-gray-400"
              } transition-colors shadow-md`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
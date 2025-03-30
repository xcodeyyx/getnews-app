import React, { useState, useEffect } from "react";
import Dashboard from "../Dashboard";
import { getChatList } from "../api";
import { Search, MessageCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const ChatList = () => {
  const id = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!id || !token) return;
  
    const fetchChat = async () => {
      setLoading(true);
      try {
        const { data } = await getChatList(id, token);
        console.log("test data", data);
        
  
        if (data && data.length > 0) {
          const latestChats = new Map();
  
          data.forEach((chat) => {
            // Menentukan ID lawan bicara
            const chatKey = chat.sender_id == id ? chat.receiver_id : chat.sender_id;
           
            const partnerInfo = chat.sender_id == id ? {
              id: chat.receiver_id,
              name: chat.receiver.name,
              profile_image_url: chat.receiver.profile_image_url
            } : {
               id: chat.sender_id,
               name: chat.sender.name,
               profile_image_url: chat.sender.profile_image_url
            };
            // Memastikan hanya menyimpan pesan terbaru dari lawan bicara
            if (
              !latestChats.has(chatKey) ||
              new Date(chat.created_at) > new Date(latestChats.get(chatKey).created_at)
            ) {
              chat.partnerInfo = partnerInfo;
              latestChats.set(chatKey, chat);
              
            }
          });
  
          const chatArray = Array.from(latestChats.values());
          console.log("Last chat messages 1:", chatArray);
          // const lastMessage = chatArray.reduce((latest, chat) => 
          //   !latest || new Date(chat.created_at) > new Date(latest.created_at) ? chat : latest, 
          //   null
          // );
          
          // console.log("Last message:", lastMessage);
          

          
         // console.log("Last chat messages IDs:", chatArray.map(chat => chat.sender_id));
  
          setChats(chatArray);
          setFilteredChats(chatArray);
        } else {
          setChats([]);
          setFilteredChats([]);
        }
      } catch (error) {
        console.error("Error fetching chat list:", error);
        if (error.response && error.response.status === 403) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchChat();
  }, [id, token]);
  

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter(chat => 
        (chat.partnerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.message.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredChats(filtered);
    }
  }, [searchTerm, chats]);

  // Function to format the date in a more user-friendly way
  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${date.toLocaleDateString([], { weekday: 'long' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Function to get the first letter of name for avatar
  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  // Function to get a color based on the name (for avatar background)
  const getAvatarColor = (name) => {
    if (!name) return "bg-gray-600";
    const colors = [
      "bg-blue-600", "bg-red-600", "bg-green-600", "bg-yellow-600", 
      "bg-purple-600", "bg-pink-600", "bg-indigo-600", "bg-teal-600"
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="w-full bg-gray-900 min-h-screen text-gray-100 md:w-[400px] lg:w-[400px] lg:ml-170">
      <Dashboard />
      
      <div className="max-w-2xl mx-auto p-6 ">
        <div className="mb-6">
          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-gray-800 w-full py-3 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (

          <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
            {filteredChats.length > 0 ? (
              <div className="divide-y divide-gray-700">
                {filteredChats.map((chat) => (
                  <Link to={`chat/${chat.partnerInfo?.id}`} key={chat.id} className="block">
                  <div
                    key={chat.id}
                    className="p-4 hover:bg-gray-700 cursor-pointer transition duration-300"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getAvatarColor(chat.receiver.name)}`}>
                        {/* {getInitials(chat.receiver.name)} */}
                        <img src={chat.partnerInfo?.profile_image_url} alt="" className="w-full h-full object-cover rounded-full"/>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className="text-lg font-semibold truncate">{chat.partnerInfo?.name}</h3>
                          <div className="flex items-center text-xs text-gray-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(chat.created_at)}
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm truncate mt-1">
                          {chat.message}
                        </p>
                      </div>
                    </div>
                  </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="bg-gray-700 p-4 rounded-full mb-4">
                  <MessageCircle className="w-10 h-10 text-gray-400" />
                </div>
                {searchTerm ? (
                  <>
                    <p className="text-gray-400 text-lg mb-2">No results found</p>
                    <p className="text-gray-500 text-sm max-w-sm">No conversations match your search criteria</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 text-lg mb-2">Tidak ada chat</p>
                    <p className="text-gray-500 text-sm max-w-sm">Mulai percakapan baru</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
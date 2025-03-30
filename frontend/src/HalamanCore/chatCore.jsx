import React, { useEffect,useState } from 'react'

const ChatCore = () => {
  const [userId, setuserId] = useState([]);
  useEffect(() => {
    const id =localStorage.getItem("userId");
    setuserId(id);
  },[])
  return (
    <div>
      <h1>Welcome to Dashboard</h1>
      {userId && <p>Your ID: {userId}</p>}
    </div>
  )
}

export default ChatCore
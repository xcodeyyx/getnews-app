import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { getuser, getName } from "../api.jsx";
import Dashboard from '../Dashboard.jsx';

const ActiveCore = () => {
  const [users, setUsers] = useState([]);
  const [username, setUserName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const response = async () => {
    try {
      const { data } = await getuser();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const getdata = async () => {
    try {
      const myid = localStorage.getItem("userId");
      const token = localStorage.getItem("token")
      const { data } = await getName( myid, token);
      setUserName(data.name);
    } catch (error) {
      console.error("Error fetching chat list:", error);
      if (error.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
  };

  useEffect(() => {
    response();
    getdata();
  }, []);

  const myid = Number(localStorage.getItem("userId")); // Pastikan myid adalah Number

  const filteredUsers = users.filter(user =>
    Number(user.id) !== myid && // Ubah user.id ke Number juga
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <div className="w-full max-w-3xl bg-gray-900 md:w-[400px] lg:w-[400px] lg:ml-170">
      <Dashboard />
        {/* Search Bar di Atas */}
        <div className="sticky bg-gray-900 z-10 py-4 p-5">
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full p-3 border border-gray-700 rounded-4xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Daftar Pengguna */}
        <div className="mt-3 p-5">
          {filteredUsers.length > 0 ? (
            <div className="space-y-3">
              {filteredUsers.map(user => (
                <Link to={`chat/${user.id}`} key={user.id} className="block">
                  <div className="bg-gray-800 p-4 rounded-3xl shadow-sm hover:shadow-md transition-shadow hover:border-blue-500 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3 font-medium text-lg">
                          {/* {user.name.charAt(0).toUpperCase()} */}
                          <img src={user.profile_image_url} alt=""
                          className='w-full h-full object-cover rounded-full' />
                          
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{user.name}</h3>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        <span className="text-sm text-gray-400">{user.status}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Last active: {user.lastActive}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-800 rounded-lg shadow-sm mt-4">
              <p className="text-gray-400">No users found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ActiveCore;
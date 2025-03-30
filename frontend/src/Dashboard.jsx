import React from "react";
import { Link, useLocation } from "react-router-dom";

const Dashboard = () => {
  const location = useLocation();
  
  // Function to check if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };  
  
  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-900 shadow-lg z-50 md:w-[400px] lg:w-[400px] lg:ml-170">
      <nav className="container mx-auto p-3">
        <ul className="flex justify-between items-center">
          <li className={`flex-1 text-center px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 ${
            isActive("/chatlist")
              ? "bg-indigo-600 text-white font-medium"
              : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          }`}>
            <Link to="/chatlist" className="flex flex-col items-center text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Link>
          </li>
          <li className={`flex-1 text-center px-3 py-3 mx-2 rounded-xl cursor-pointer transition-all duration-300 ${
            isActive("/post")
              ? "bg-indigo-600 text-white font-medium"
              : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          }`}>
            <Link to="/post" className="flex flex-col items-center text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Link>
          </li>
          <li className={`flex-1 text-center px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 ${
            isActive("/postmain")
              ? "bg-indigo-600 text-white font-medium"
              : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          }`}>
            <Link to="/postmain" className="flex flex-col items-center text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            </Link>
          </li>
          
          <li className={`flex-1 text-center px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 ${
            isActive("/active")
              ? "bg-indigo-600 text-white font-medium"
              : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          }`}>
            <Link to="/active" className="flex flex-col items-center text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </Link>
          </li>
          <li className={`flex-1 text-center px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 ${
            isActive("/profile")
              ? "bg-indigo-600 text-white font-medium"
              : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
          }`}>
            <Link to="/profile" className="flex flex-col items-center text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A4 4 0 0110 15h4a4 4 0 014.879 2.804M12 7a4 4 0 110-8 4 4 0 010 8z" />
              </svg>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Dashboard;
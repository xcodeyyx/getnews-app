import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const fullText = "Hello Welcome To GetNews";
  const [displayText, setDisplayText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(fullText.slice(0, index + 1));
        setIndex(index + 1);
      }, 100); // Kecepatan ketik (100ms)
      return () => clearTimeout(timeout);
    }
  }, [index, fullText]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-6">
      <motion.h1 
        className="font-display text-5xl  text-center mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {displayText}<span className="animate-blink">|</span> {/* Kursor berkedip */}
      </motion.h1>
      
      <motion.p 
        className="font-dekrip text-lg text-center max-w-2xl mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        Fast, secure and easy to use modern chat app. Connect with friends and family anywhere!
      </motion.p>
      <Link to="/register">
      <motion.button 
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 text-lg rounded-2xl shadow-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        whileHover={{ scale: 1.1 }}
      >
        Try Now
      </motion.button></Link>
    </div>
  );
};

export default LandingPage;

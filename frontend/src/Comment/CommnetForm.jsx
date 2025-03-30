import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPostById, getCommentById, postComment } from '../api';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { FaHeart, FaComment, FaArrowLeft, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const PostDetail = () => {
  const { id } = useParams();
  const userid = localStorage.getItem("userId");
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0); // Track active slide for the post images
  const commentsEndRef = useRef(null);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const { data } = await getPostById(id);
      console.log("test", data);
      
      
      // Process image URLs in the same way as PostCore
      try {
        // Try to parse image_url if in JSON string format
        if (data.image_url && typeof data.image_url === 'string' && data.image_url.startsWith('[')) {
          data.image_urls = JSON.parse(data.image_url);
          data.image_url = null; // Set to null because it's stored in image_urls
        } else if (data.image_url) {
          data.image_urls = [data.image_url];
          data.image_url = null;
        } else {
          data.image_urls = [];
        }
      } catch (e) {
        console.error("Error parsing image_url:", e);
        data.image_urls = data.image_url ? [data.image_url] : [];
      }
      
      setPost(data);
    } catch (error) {
      console.log("Error fetching post details:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchComment = async () => {
    try {
      const { data } = await getCommentById(id);
      
      if (Array.isArray(data)) {
        setComments(data);
      } else {
        console.error("Data comments bukan array:", data);
        setComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };
  
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    
    try {
      const newComment = {
        userid: userid,
        post_id: id,
        content: comment,
        timestamp: new Date()
      };
      const { data } = await postComment(newComment);
      setComment("");
      fetchComment();
      // Scroll to the bottom after adding a new comment
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Navigation functions for the image slider
  const nextSlide = () => {
    if (post?.image_urls?.length > 0) {
      setActiveSlide((prev) => (prev + 1) % post.image_urls.length);
    }
  };

  const prevSlide = () => {
    if (post?.image_urls?.length > 0) {
      setActiveSlide((prev) => (prev - 1 + post.image_urls.length) % post.image_urls.length);
    }
  };
  
  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    fetchPost();
    fetchComment();
  }, [id]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 w-full">
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header with back button - fixed at top */}
        <div className="bg-gray-800 p-4 shadow-md z-10 sticky top-0">
          <div className="container mx-auto max-w-4xl">
            <Link to="/post" className="inline-flex items-center text-blue-500 hover:text-blue-400 transition-colors duration-200">
              <FaArrowLeft className="mr-2" />
              Back to Feed
            </Link>
          </div>
        </div>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="container mx-auto max-w-4xl px-4 py-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-400">Loading post...</p>
              </div>
            ) : !post ? (
              <div className="bg-gray-800 rounded-xl p-8 text-center">
                <p className="text-gray-400">Post not found</p>
              </div>
            ) : (
              <div className="relative w-full bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-700">
                {/* Post Content */}
                <div className="p-5">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex-shrink-0 flex items-center justify-center">
                      <span className="text-white font-medium text-lg">
                      {post.profile_image_url ? (
                            <img
                              src={post.profile_image_url}
                              alt={post.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span className="text-white font-medium">
                              yyy
                            </span>
                          )}
                      </span>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-white text-lg">{post.username}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(post.created_at || Date.now()).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-200 mb-6 text-lg leading-relaxed">
                    {post.content}
                  </p>

                  {/* Image Slider - similar to PostCore but adapted for PostDetail */}
                  {post.image_urls && post.image_urls.length > 0 ? (
                    <div className="mb-6 relative">
                      {/* Image container with slide effect */}
                      <div className="relative rounded-lg overflow-hidden" style={{ height: '410px' }}>
                        {post.image_urls.map((url, index) => (
                          <div
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-300 
                              ${index === activeSlide ? 'opacity-100' : 'opacity-0'}`}
                          >
                            <img
                              src={url}
                              alt={`Post image ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/800x600?text=Image+Not+Found";
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      
                      {/* Navigation arrows - only show if there's more than 1 image */}
                      {post.image_urls.length > 1 && (
                        <>
                          <button 
                            onClick={prevSlide}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black bg-opacity-50 text-white z-10 hover:bg-opacity-70"
                          >
                            <FaChevronLeft size={18} />
                          </button>
                          <button 
                            onClick={nextSlide}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black bg-opacity-50 text-white z-10 hover:bg-opacity-70"
                          >
                            <FaChevronRight size={18} />
                          </button>
                          
                          {/* Slide indicators (dots) */}
                          <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
                            {post.image_urls.map((_, index) => (
                              <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                  index === activeSlide 
                                    ? 'bg-white w-3' 
                                    : 'bg-gray-500'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}

                  {/* Like and Comment counters */}
                  <div className="flex items-center space-x-4 text-gray-400 border-t border-gray-700 pt-4">
                    <button className="flex items-center space-x-2 hover:text-red-500 transition-colors duration-200 p-2 rounded-md hover:bg-gray-700">
                      <FaHeart className="text-lg" />
                      <span>{post.likes || 0} Likes</span>
                    </button>
                    <div className="flex items-center space-x-2 text-blue-500 p-2">
                      <FaComment className="text-lg" />
                      <span>{comments.length} Comments</span>
                    </div>
                  </div>
                </div>

                {/* Comments Section Header */}
                <div className="border-t border-gray-700 bg-gray-750 p-4">
                  <h3 className="text-white font-medium">Comments</h3>
                </div>

                {/* Comments List */}
                <div className="border-t border-gray-700">
                  <div className="p-4">
                    {comments.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <FaComment className="mx-auto h-8 w-8 mb-2" />
                        <p>No comments yet. Be the first to comment!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {comments.map((com) => (
                          <div key={com.id || `comment-${com.user_id}-${Date.now()}`} 
                              className="border-b border-gray-700 pb-4 last:border-0 hover:bg-gray-750 p-3 rounded-lg transition-colors duration-200">
                            <div className="flex items-start">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex-shrink-0 flex items-center justify-center">
                                <span className="text-white text-xs font-medium">
                                  {com.username?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div className="ml-3 flex-1">
                                <div className="flex justify-between items-baseline">
                                  <p className="font-medium text-white text-sm">{com.users?.name || com.user_id}</p>
                                  <p className="text-xs text-gray-400">
                                    {new Date(com.timestamp || com.created_at || Date.now()).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                                <p className="text-gray-300 mt-1 text-sm leading-relaxed">{com.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={commentsEndRef} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Fixed Comment Input at bottom */}
        {post && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 shadow-lg">
            <div className="container mx-auto max-w-4xl">
              <form onSubmit={handleCommentSubmit} className="flex">
                <div className="relative flex-1">
                  <textarea
                    className="w-full h-14 bg-gray-700 border border-gray-600 rounded-lg p-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="1"
                    placeholder="Write your comment here..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={isSubmitting}
                  ></textarea>
                  <button
                    type="submit"
                    disabled={isSubmitting || !comment.trim()}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      comment.trim() && !isSubmitting
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-600 opacity-70"
                    } text-white p-2 rounded-full transition-colors duration-200`}
                  >
                    {isSubmitting ? (
                      <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetail;
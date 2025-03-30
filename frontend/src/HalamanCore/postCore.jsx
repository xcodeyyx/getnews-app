import React, { useEffect, useState } from "react";
import { getAllPost, likePosts } from "../api";
import Dashboard from "../Dashboard";
import { FaHeart, FaComment, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
const PostCore = () => {
  const token = localStorage.getItem("token");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState({});
  const [activeSlides, setActiveSlides] = useState({}); // Track active slide for each post
  const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");

        if(!token) {
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            navigate("/login")
        }
    }, [navigate]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data } = await getAllPost(token);
      console.log("debug posts:", data);
      
      // Inisialisasi data posts dengan parsing image_url jika ada
      const processedPosts = data.map(post => {
        try {
          // Coba parse image_url jika dalam format JSON string
          if (post.image_url && typeof post.image_url === 'string' && post.image_url.startsWith('[')) {
            post.image_urls = JSON.parse(post.image_url);
            post.image_url = null; // Set menjadi null karena sudah disimpan ke image_urls
          } else if (post.image_url) {
            post.image_urls = [post.image_url];
            post.image_url = null;
          } else {
            post.image_urls = [];
          }
        } catch (e) {
          console.error("Error parsing image_url:", e);
          post.image_urls = post.image_url ? [post.image_url] : [];
        }
        return post;
      });
      
      setPosts(processedPosts);

      // Inisialisasi likedPosts dan activeSlides
      const initialLiked = {};
      const initialSlides = {};
      processedPosts.forEach((post) => {
        initialLiked[post.id] = false; // Default belum like
        initialSlides[post.id] = 0; // Default slide pertama
      });
      setLikedPosts(initialLiked);
      setActiveSlides(initialSlides);
    } catch (error) {
      console.error("Error fetching chat list:", error);
      if (error.response && error.response.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Fungsi untuk navigasi slide
  const nextSlide = (postId, totalSlides) => {
    setActiveSlides(prev => ({
      ...prev,
      [postId]: (prev[postId] + 1) % totalSlides
    }));
  };

  const prevSlide = (postId, totalSlides) => {
    setActiveSlides(prev => ({
      ...prev,
      [postId]: (prev[postId] - 1 + totalSlides) % totalSlides
    }));
  };

  // Fungsi toggle like/unlike
  const handleLike = async (postId) => {
    const isLiked = likedPosts[postId]; // Cek apakah sudah di-like sebelumnya
    
    // 1. Optimistic update (langsung update UI)
    setLikedPosts((prevLiked) => ({
      ...prevLiked,
      [postId]: !isLiked, // Toggle status
    }));
    
    // Update the posts array directly to reflect like change
    setPosts((prevPosts) => 
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            likes: isLiked ? (post.likes || 0) - 1 : (post.likes || 0) + 1,
          };
        }
        return post;
      })
    );
  
    // 2. Panggil API like/unlike
    try {
      const { data } = await likePosts(postId);
      console.log("Response like/unlike:", data);
      
      // If the API returns updated like count, update the posts state with accurate data
      if (data && data.totalLikes !== undefined) {
        setPosts((prevPosts) => 
          prevPosts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                likes: data.totalLikes,
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.log("Error like/unlike:", error);
  
      // 3. Rollback jika gagal (balikin UI)
      setLikedPosts((prevLiked) => ({
        ...prevLiked,
        [postId]: isLiked, // Kembali ke status awal
      }));
  
      // Rollback the posts array too
      setPosts((prevPosts) => 
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              likes: isLiked ? (post.likes || 0) : (post.likes || 0) - 1,
            };
          }
          return post;
        })
      );
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-900 w-full md:w-[400px] lg:w-[400px] lg:ml-170">
      <Dashboard />
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-4 py-6">
          <div className="container mx-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-400">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <svg
                  className="mx-auto h-12 w-12 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                No posts found
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 transition-all duration-200 hover:border-blue-500"
                  >
                    <div className="p-4">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center">
                        {post.users.profile_image_url ? (
                            <img
                              src={post.users.profile_image_url}
                              alt={post.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span className="text-white font-medium">
                              yyy
                            </span>
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-white">{post.username}</p>
                          <p className="text-xs text-gray-400">
                            {new Date().toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      <p className="text-gray-200 mb-4 text-sm leading-relaxed">
                        {post.content}
                      </p>

                      {/* Image Slider */}
                      {post.image_urls && post.image_urls.length > 0 && (
                        <div className="mb-4 relative">
                          {/* Image container with slide effect */}
                          <div className="relative h-120 rounded-lg overflow-hidden" >
                            {post.image_urls.map((url, index) => (
                              <div
                                key={index}
                                className={`absolute inset-0 transition-opacity duration-300 
                                  ${index === activeSlides[post.id] ? 'opacity-100' : 'opacity-0'}`}
                              >
                                <img
                                  src={url}
                                  alt={`Post image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          
                          {/* Navigation arrows - hanya tampil jika ada lebih dari 1 gambar */}
                          {post.image_urls.length > 1 && (
                            <>
                              <button 
                                onClick={() => prevSlide(post.id, post.image_urls.length)}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black bg-opacity-50 text-white z-10 hover:bg-opacity-70"
                              >
                                <FaChevronLeft />
                              </button>
                              <button 
                                onClick={() => nextSlide(post.id, post.image_urls.length)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black bg-opacity-50 text-white z-10 hover:bg-opacity-70"
                              >
                                <FaChevronRight />
                              </button>
                              
                              {/* Indikator slide (dots) */}
                              <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
                                {post.image_urls.map((_, index) => (
                                  <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full ${
                                      index === activeSlides[post.id] 
                                        ? 'bg-white' 
                                        : 'bg-gray-500'
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Like dan Komentar */}
                      <div className="flex items-center space-x-4 text-gray-400">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center space-x-2 transition-colors duration-200 ${
                            likedPosts[post.id] ? "text-red-500" : "hover:text-red-500"
                          }`}
                        >
                          <FaHeart />
                          <span>{post.likes || 0}</span>
                        </button>
                        <Link
                          to={`/post/${post.id}`}
                          className="flex items-center space-x-2 hover:text-blue-500 transition-colors duration-200"
                        >
                          <FaComment />
                          <span>{post.comment}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCore;
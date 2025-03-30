import React, { useState, useEffect, useRef } from "react";
import Dashboard from "../Dashboard";
import { getuserprofile, updateProfile } from "../api";
import { FaHeart, FaComment, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { User, LogOut, Loader, AlertCircle, Camera, X, Check, Edit2, Calendar, Award, Image } from "lucide-react";
import { Link } from "react-router-dom";

const ProfileMain = () => {
  const [mypost, setmypost] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeSlides, setActiveSlides] = useState({});
  const [updateFormData, setUpdateFormData] = useState({
    name: "",
    username: "",
    email: ""
  });
  const [updateStatus, setUpdateStatus] = useState({
    loading: false,
    error: null,
    success: false
  });
  const fileInputRef = useRef(null);
  const id = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!id) {
      setError("User ID tidak ditemukan di localStorage! Silakan login ulang.");
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data } = await getuserprofile(id, token);
        if (data) {
          console.log("Data profile:", data);
          setProfile(data.user);
          
          // Process posts to handle image_url in the same way as PostCore
          const processedPosts = data.posts?.map(post => {
            try {
              // Try to parse image_url if it's in JSON string format
              if (post.image_url && typeof post.image_url === 'string' && post.image_url.startsWith('[')) {
                post.image_urls = JSON.parse(post.image_url);
                post.image_url = null; // Set to null as it's stored in image_urls
              } else if (post.image_url) {
                // If image_url exists but is not JSON (old format), put it in array
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
          }) || [];
          
          setmypost(processedPosts);
          
          // Initialize activeSlides
          const initialSlides = {};
          processedPosts.forEach((post) => {
            initialSlides[post.id] = 0; // Default to first slide
          });
          setActiveSlides(initialSlides);
          
          setUpdateFormData({
            name: data.user?.name || "",
            email: data.user?.email || ""
          });
        } else {
          setError("Profil tidak ditemukan!");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Gagal mengambil data profil. Coba lagi nanti.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  // Functions for image slider navigation
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

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileImage(null);
    setPreviewUrl(null);
    // Reset form data to current profile
    setUpdateFormData({
      name: profile?.name || "",
      email: profile?.email || ""
    });
    setUpdateStatus({
      loading: false,
      error: null,
      success: false
    });
  };

  const handleImageClick = () => {
    if (isEditing) {
      fileInputRef.current.click();
    } else if (profile?.profile_image_url) {
      setShowImageModal(true);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateStatus({
      loading: true,
      error: null,
      success: false
    });

    try {
      const formData = new FormData();
      formData.append("id", id);
      formData.append("name", updateFormData.name);
      formData.append("email", updateFormData.email);
      
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const token = localStorage.getItem("token");
      const response = await updateProfile(formData, token);
      
      if (response.data) {
        setProfile(response.data);
        setUpdateStatus({
          loading: false,
          error: null,
          success: true
        });
        
        // Wait a moment to show success message before closing edit mode
        setTimeout(() => {
          setIsEditing(false);
          setProfileImage(null);
          setPreviewUrl(null);
          setUpdateStatus(prev => ({...prev, success: false}));
        }, 1500);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setUpdateStatus({
        loading: false,
        error: "Gagal mengupdate profil. Silakan coba lagi.",
        success: false
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: "2-digit",
      minute: "2-digit"
    };
    
    return new Date(dateString).toLocaleString([], options);
  };

  // Tampilkan pesan "Loading..." saat data masih diambil
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex justify-center items-center w-full">
        <div className="flex flex-col items-center bg-gray-800/50 p-10 rounded-2xl backdrop-blur-sm shadow-xl">
          <Loader className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <p className="text-xl font-medium">Loading your profile...</p>
          <p className="text-gray-400 mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  // Jika ada error, tampilkan pesan error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex justify-center items-center">
        <div className="flex flex-col items-center bg-gray-800/90 p-8 rounded-2xl shadow-2xl max-w-md backdrop-blur-sm border border-red-500/30">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <p className="text-2xl text-red-400 font-semibold mb-2">Error</p>
          <p className="text-center text-gray-300">{error}</p>
          <button
            className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/20 font-medium"
            onClick={() => window.location.href = "/login"}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col items-center w-full pb-24 md:w-[400px] lg:w-[400px] lg:ml-170">
        {/* Page Header Tag */}
        <div className="bg-gray-900/80 backdrop-blur-md w-full py-4 px-6 mb-8 shadow-xl sticky top-0 z-10 border-b border-gray-800">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <User className="w-6 h-6 mr-2 text-blue-400" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">My Profile</h1>
            </div>
            <button
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-xl flex items-center transition-all duration-300 shadow-lg shadow-red-600/20"
              onClick={() => {
                localStorage.removeItem("userId");
                localStorage.removeItem("token");
                window.location.reload();
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="w-full max-w-5xl">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl mb-8 border border-gray-700/50 backdrop-blur-sm">
            {!isEditing ? (
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Profile Image with Edit Button */}
                <div className="relative group">
                  <div 
                    className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-5xl font-semibold flex-shrink-0 overflow-hidden border-4 border-blue-500/70 shadow-xl cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-blue-500/30"
                    onClick={handleImageClick}
                  >
                    {profile?.profile_image_url ? (
                      <img 
                        src={profile.profile_image_url} 
                        alt={profile.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      profile?.name ? profile.name.charAt(0).toUpperCase() : <User size={56} className="text-white/90" />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                      {profile?.profile_image_url && <Camera className="w-12 h-12 text-white" />}
                    </div>
                  </div>
                  <button 
                    onClick={handleEditProfile}
                    className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg shadow-blue-500/30 border-2 border-gray-900"
                    aria-label="Edit profile"
                  >
                    <Edit2 className="w-5 h-5 text-white" />
                  </button>
                </div>
                
                {/* Profile Info */}
                <div className="flex-1 flex flex-col items-center md:items-start">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    {profile?.name || "User"}
                  </h2>
                  
                  <div className="flex items-center mb-4 text-gray-400">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Joined: {profile?.createdAt ? formatDate(profile.createdAt).split(',')[0] : "N/A"}</span>
                  </div>
                  
                  {profile?.email && (
                    <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 w-full max-w-md ">
                      <p className="text-sm text-gray-400 text-center">Email (Private)</p>
                      <p className="text-gray-300">{profile.email}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  {/* Profile Image Upload */}
                  <div className="relative">
                    <div 
                      onClick={handleImageClick}
                      className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-5xl font-semibold cursor-pointer overflow-hidden border-4 border-blue-500/70 shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
                    >
                      {previewUrl ? (
                        <img 
                          src={previewUrl} 
                          alt="Profile preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : profile?.profile_image_url ? (
                        <img 
                          src={profile.profile_image_url} 
                          alt={profile.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        profile?.name ? profile.name.charAt(0).toUpperCase() : <User size={56} className="text-white/90" />
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Camera className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageChange} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                  <p className="text-gray-400 text-sm flex items-center">
                    <Camera className="w-4 h-4 mr-2" />
                    Click on the image to upload a new profile picture
                  </p>
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={updateFormData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700/80 border border-gray-600/80 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email (Private)</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={updateFormData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700/80 border border-gray-600/80 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="Your email"
                  />
                </div>

                {updateStatus.error && (
                  <div className="px-4 py-3 bg-red-900/80 text-white rounded-xl flex items-center border border-red-700 max-w-lg mx-auto">
                    <AlertCircle className="w-5 h-5 mr-2 text-red-300" />
                    {updateStatus.error}
                  </div>
                )}

                {updateStatus.success && (
                  <div className="px-4 py-3 bg-green-800/80 text-white rounded-xl flex items-center border border-green-700 max-w-lg mx-auto">
                    <Check className="w-5 h-5 mr-2 text-green-300" />
                    Profile updated successfully!
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4 max-w-lg mx-auto">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center transition-all duration-300 shadow-lg hover:shadow-gray-900/30"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateStatus.loading}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl flex items-center transition-all duration-300 shadow-lg shadow-blue-900/20 hover:shadow-blue-900/30 font-medium"
                  >
                    {updateStatus.loading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* User Posts Section */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 ">
            <h3 className="text-2xl font-bold mb-6 flex items-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              <Award className="w-6 h-6 mr-2 text-blue-400" />
              Your Posts
            </h3>

            {/* Posts Grid */}
            <div className="space-y-6 pb-4">
              {mypost && mypost.length > 0 ? (
                mypost.map((post) => (
                  <div
                    key={post.id}
                    className="bg-gray-800/50 overflow-hidden border border-gray-700/50 rounded-xl transition-all duration-300 hover:border-blue-500/30 hover:shadow-blue-900/20 hover:shadow-lg mb-6 backdrop-blur-sm"
                  >
                    <div className="p-5">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-blue-500/70 shadow-lg">
                          {profile?.profile_image_url ? (
                            <img
                              src={profile.profile_image_url}
                              alt={profile.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white/90 font-medium">
                              {profile?.name ? profile.name.charAt(0).toUpperCase() : "U"}
                            </span>
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-200">{profile?.name || "User"}</p>
                          <p className="text-xs text-gray-400 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(post.createdAt)}
                          </p>
                        </div>
                      </div>

                      <p className="text-gray-200 mb-4 text-sm leading-relaxed">
                        {post.content}
                      </p>

                      {/* Image Slider */}
                      {post.image_urls && post.image_urls.length > 0 && (
                        <div className="mb-4 relative rounded-xl overflow-hidden border border-gray-700/50">
                          {/* Image container with slide effect */}
                          <div className="relative h-96 rounded-xl overflow-hidden bg-gray-900/50">
                            {post.image_urls.map((url, index) => (
                              <div
                                key={index}
                                className={`absolute inset-0 transition-opacity duration-500 
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
                          
                          {/* Navigation arrows - only show if there's more than 1 image */}
                          {post.image_urls.length > 1 && (
                            <>
                              <button 
                                onClick={() => prevSlide(post.id, post.image_urls.length)}
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black bg-opacity-50 text-white z-10 hover:bg-opacity-70 transition-all duration-300 border border-gray-700/70"
                              >
                                <FaChevronLeft />
                              </button>
                              <button 
                                onClick={() => nextSlide(post.id, post.image_urls.length)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black bg-opacity-50 text-white z-10 hover:bg-opacity-70 transition-all duration-300 border border-gray-700/70"
                              >
                                <FaChevronRight />
                              </button>
                              
                              {/* Slide indicators (dots) */}
                              <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2">
                                {post.image_urls.map((_, index) => (
                                  <div
                                    key={index}
                                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                      index === activeSlides[post.id] 
                                        ? 'bg-white scale-110' 
                                        : 'bg-gray-500'
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-gray-400 mt-3">
                        <button
                          className="flex items-center space-x-2 transition-all duration-300 hover:text-red-400 p-2 rounded-xl hover:bg-gray-700/50 group"
                        >
                          <FaHeart className="group-hover:scale-110 transition-transform duration-300" />
                          <span>{post.likes || 0}</span>
                        </button>
                        <Link
                          to={`/post/${post.id}`}
                          className="flex items-center space-x-2 hover:text-blue-400 transition-all duration-300 p-2 rounded-xl hover:bg-gray-700/50 group"
                        >
                          <FaComment className="group-hover:scale-110 transition-transform duration-300" />
                          <span>{post.comment || 0}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400 bg-gray-800/30 rounded-xl border border-gray-700/30">
                  <Image className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-xl mb-2 font-medium text-gray-300">No posts yet</p>
                  <p className="text-gray-500">Start sharing your thoughts with the world!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Image Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowImageModal(false)}
        >
          <div 
            className="relative max-w-3xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={profile.profile_image_url} 
              alt={profile.name} 
              className="max-w-full max-h-screen rounded-lg object-contain border border-gray-700 shadow-2xl"
            />
            <button 
              className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center transition-colors border border-gray-700"
              onClick={() => setShowImageModal(false)}
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}

      <Dashboard />
    </>
  );
};

export default ProfileMain;
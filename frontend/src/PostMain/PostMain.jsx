import React, { useState } from "react";
import { createPost } from "../api.jsx";
import Dashboard from "../Dashboard";
import { AiOutlinePicture, AiOutlineLoading3Quarters, AiOutlineClose } from "react-icons/ai";
import { MdSend } from "react-icons/md";

const PostMain = () => {
  const id = localStorage.getItem("userId");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState(null);
  //const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validasi file
    const invalidFiles = selectedFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError(`${invalidFiles.length} file terlalu besar (maks 5MB)`);
      return;
    }
    
    // Batasi jumlah gambar (maksimal 5)
    if (selectedFiles.length + images.length > 5) {
      setError("Maksimal 5 gambar yang diperbolehkan");
      return;
    }
    
    setImages([...images, ...selectedFiles]);
    setError(null);
    
    // Buat preview untuk semua gambar
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      console.log("deug render", reader);
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Unauthorized: No token found");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    if (!id) {
      setError("You must be logged in to post");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("id", id);
    formData.append("content", content);
    
    if (images.length > 0) {
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });
      formData.append("imageCount", images.length);
    }

    try {
      const response = await createPost(formData, token);
      console.log("Post created successfully:", response.data);
      
      setContent("");
      setImages([]);
      setPreviews([]);
      
      // Toast notification instead of alert
      showToast("Post berhasil dibuat!");
    } catch (error) {
      console.error("Error creating post:", error);
      
      const errorMessage = 
        error.response?.data?.details || 
        error.response?.data?.error || 
        error.message || 
        "Unknown error occurred";
        
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Simple toast function
  const showToast = (message) => {
    const toast = document.createElement("div");
    toast.className = "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("opacity-0", "transition-opacity", "duration-500");
      setTimeout(() => document.body.removeChild(toast), 500);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 w-full md:w-[400px] lg:w-[400px] lg:ml-170">
      <Dashboard />
      
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-700">
            <h2 className="text-xl font-bold text-gray-100">Buat Postingan</h2>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4">
            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded border border-red-700 text-sm">
                {error}
              </div>
            )}
            
            {/* Text area */}
            <div className="mb-4">
              <textarea
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-100 placeholder-gray-400"
                placeholder="Apa yang ingin Anda bagikan?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="4"
                required
              ></textarea>
            </div>
            
            {/* Image previews */}
            {previews.length > 0 && (
              <div className="mb-4">
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative rounded-lg overflow-hidden group">
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`} 
                        className="h-24 w-full object-contain" 
                      />
                      <div className="absolute inset-0  bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></div>
                      <button 
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                      >
                        <AiOutlineClose size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-700">
              {/* Image upload */}
              <div className="relative">
                <input 
                  id="image-upload"
                  type="file" 
                  onChange={handleFileChange} 
                  className="hidden"
                  accept="image/*"
                  multiple
                />
                <label 
                  htmlFor="image-upload" 
                  className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <AiOutlinePicture size={20} className="text-blue-400" />
                  <span className="text-sm text-gray-300">Foto</span>
                </label>
              </div>
              
              {/* Submit button */}
              <button
                type="submit"
                className={`flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <AiOutlineLoading3Quarters className="animate-spin" size={18} />
                ) : (
                  <MdSend size={18} />
                )}
                <span>{loading ? "Posting..." : "Post"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostMain;
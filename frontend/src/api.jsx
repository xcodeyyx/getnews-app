import axios from "axios";
const getBaseURL = () => "http://localhost:5000/api/auth";
const API = axios.create({ baseURL: getBaseURL()});

export const register = (data) => API.post("/register", data);
export const login = (form) => API.post("/login", form);
export const getuser = () => API.get("/getuser");

export const getName = (myid, token) => 
    API.post("/getname", { myid }, { 
      headers: { Authorization: `Bearer ${token}` } 
    });

export const getuserbyid = (id) => API.get(`/getuser/${id}`);
export const getuserprofile = (id, token) => 
    API.get(`/getmyprofile/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

export const loadchat = (chat) => API.post("/loadchat", chat);
export const getChatList = async (id,token) => API.get(`/getchatlist/${id}`,{
    headers: { 
        "Authorization": `Bearer ${token}`
    }
});

// New function for updating user profile
export const updateProfile = async (profileData, token) => {
    return API.post("/update-profile", profileData, {
        headers: { 
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`
        }
    });
};

export const createPost = async (postData, token) => {
    return API.post("/posting", postData, {
        headers: { 
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`
        }
    });
};
export const getChatHistory = async (sender, receiver) => API.get(`/chat-history/${sender}/${receiver}`);
export const getAllPost = async (token) => {
    return API.get("/getallpost", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
}
export const getPostById = async (postId) => API.get(`/getpostbyid/${postId}`);
export const getCommentById = async (postId) => API.get(`/getcommentbyid/${postId}`);
export const postComment = async (comment) => API.post(`/postcomment`, comment);
export const likePosts = async (id) => API.post(`/likepost/${id}`);
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../Database/Config.js";
import dotenv from "dotenv";
import multer from "multer";
import "../server.js";
const router = express.Router();
const SECRET_KEY = "your_secret_key";
import verifyToken from "../middleware/middleware.js";

dotenv.config();
// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validasi input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Nama, email, dan password diperlukan" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password harus minimal 6 karakter" });
    }
    //Hash password sebelum menyimpan ke database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cek apakah email sudah terdaftar di tabel users
    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    // Buat akun di Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return res.status(400).json({ message: error.message });

    // Tambahkan user ke tabel `users` dengan id dari Supabase Auth
    // Penting: JANGAN simpan password di tabel users, karena sudah dihandle Supabase Auth
    const { error: insertError } = await supabase
      .from("users")
      .insert([
        { 
          name, 
          email,
          password: hashedPassword,
          created_at: new Date()
        }
      ]);

    if (insertError) return res.status(500).json({ message: insertError.message });

    res.status(201).json({ 
      message: "User registered successfully. Please check your email for verification.", 
      user: data.user 
    });
    
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("debug 1", req.body);

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({ message: "Email dan password diperlukan" });
    }

    // Login ke Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase Auth Error:", error);
      return res.status(401).json({ message: "Email atau password salah" });
    }

    // Ambil data user dari tabel users
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (userError || !user) {
      console.error("User fetch error:", userError);
      return res.status(400).json({ message: "User tidak ditemukan di tabel users" });
    }

    // ✅ Generate JWT Token (1 menit)
    const jwtToken = jwt.sign(
      { id: user.id },
      SECRET_KEY,
      { expiresIn: "1h" } // 1 menit
    );

    console.log("Generated JWT:", jwtToken);

    // ✅ Update token ke tabel users
    const { error: updateError } = await supabase
      .from("users")
      .update({ token: jwtToken })
      .eq("id", user.id);

    if (updateError) {
      console.error("Token update error:", updateError);
      return res.status(500).json({ message: "Gagal menyimpan token ke database" });
    }

    // ✅ Berhasil login
    res.status(200).json({
      message: "Login berhasil",
      user: { id: user.id, name: user.name, email: user.email },
      session: data.session,
      token: jwtToken,
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/posting", (req, res) => {
  const storage = multer.memoryStorage();
  const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit untuk mendukung multiple images
  }).any(); // Gunakan .any() untuk mendukung multiple files dengan nama field berbeda

  // Wrap multer in try-catch to catch file handling errors
  upload(req, res, async function(multerErr) {
    if (multerErr) {
      console.error("Multer error:", multerErr);
      return res.status(400).json({ error: "File upload error", details: multerErr.message });
    }
    
    try {
      // Check for required fields
      const { id, content, imageCount } = req.body;
      if (!id || !content) {
        return res.status(400).json({ error: "userId and content are required" });
      }

      console.log("Processing request:", { id, content, imageCount, filesReceived: req.files?.length });
      
      let imageUrls = [];

      // Process multiple images if uploaded
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
          
          console.log("Uploading file to Supabase:", filename);

          const token = req.headers.authorization?.split(" ")[1];

          if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
          }
          
          // Upload with detailed error handling
          const { data, error: uploadError } = await supabase.storage
            .from("post-image")
            .upload(`${filename}`, file.buffer, {
              contentType: file.mimetype,
              cacheControl: "3600"
            });

          if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            return res.status(500).json({ 
              error: "File upload to storage failed", 
              details: uploadError.message 
            });
          }

          console.log("File uploaded successfully:", data);
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from("post-image")
            .getPublicUrl(`${filename}`);
          
          imageUrls.push(urlData.publicUrl);
          console.log("Generated public URL:", urlData.publicUrl);
        }
      }

      console.log("Inserting post into database");
      const { data: name, error } = await supabase
        .from("users")
        .select("name,profile_image_url")
        .eq("id", id)
        .single();
        
      if (error) {
        console.error("Error fetching name:", error.message);
      } else {
        console.log("User Name:", name.name);
      }
      
      // Insert with detailed error handling - simpan URLs sebagai JSON string
      const { data: postData, error: postError } = await supabase
        .from("post")
        .insert([
          { 
            user_id: id, 
            content, 
            image_url: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null, 
            username: name.name,
            profile_image_url: name.profile_image_url
          }
        ])
        .select();

      if (postError) {
        console.error("Database insert error:", postError);
        return res.status(500).json({ 
          error: "Database insert failed", 
          details: postError.message 
        });
      }

      console.log("Post created successfully:", postData);
      res.status(201).json(postData);
    } catch (error) {
      console.error("Unhandled error in posting route:", error);
      res.status(500).json({ 
        error: "Server error occurred", 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
});

  

// GET CHAT HISTORY
router.get("/chat-history/:user1/:user2", async (req, res) => {
    const { user1, user2 } = req.params;
    
    try {
        const { data, error } = await supabase
            .from("chats")
            .select("*")
            .or(`sender_id.eq.${user1},receiver_id.eq.${user2},sender_id.eq.${user2},receiver_id.eq.${user1}`)
            .order("created_at", { ascending: true });

        if (error) throw error;

        console.log("Chat history:", data);
        res.json(data);
    } catch (error) {
        console.error("Error fetching chat history:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
router.get("/getchatlist/:userId", verifyToken,async (req, res) => {
  const { userId } = req.params;

  try {
      const { data, error } = await supabase
    .from("chats")
    .select(`*, 
      sender:users!chats_sender_id_fkey(name,profile_image_url),
      receiver:users!chats_receiver_id_fkey(name,profile_image_url)`
    )
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    // .eq("sender_id", userId)
    .order("created_at", { ascending: true });


    if (error) throw error;
   
    res.json(data);
  } catch (error) {
    console.error("Error fetching chat history:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET SEMUA USER
router.get("/getuser", async (req, res) => {
    try {
        const { data: users, error } = await supabase.from("users").select("id, name, email, profile_image_url");
        if (error) throw error;
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching data", error: error.message });
    }
});
router.get("/getallpost", verifyToken,async (req, res) => {
  try {
    const { data: post, error } = await supabase.from("post").select("*, users(profile_image_url)");
    if (error) throw error;
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error: error.message });
  }
});


router.post("/getname", verifyToken, async(req,res) => {
  try {
    const {myid} = req.body;
   // const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log("dbeug11", myid);
  
    const userId = myid;
        console.log("User ID ditemukan:", userId);
    // Cari nama user berdasarkan ID di tabel users
    const { data, error } = await supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Error fetching user", error: error.message });
    }
    console.log("User ditemukan:", data.name);
    res.json({name: data.name});

  } catch (error) {
    console.error("Error fetching user:", error);
        res.status(500).json({ message: "Error fetching data", error: error.message });
  }
})
// GET USER BERDASARKAN ID
router.get("/getuser/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { data: user, error } = await supabase
            .from("users")
            .select("id, name, email, profile_image_url")
            .eq("id", id)
            .single();

        if (error) throw error;
        res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Error fetching data", error: error.message });
    }
});
// GET USER BERDASARKAN ID + POSTINGANNYA
router.get("/getmyprofile/:id",verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Cari user berdasarkan id
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email, postingan, follower, following, total_likes, profile_image_url")
      .eq("id", id)
      .single();

    if (userError) throw userError;

    // Cari semua post berdasarkan user_id
    const { data: posts, error: postError } = await supabase
      .from("post")
      .select("*") // atau tentukan kolomnya misal: id, title, content, image_url, created_at
      .eq("user_id", id);

    if (postError) throw postError;

    // Gabungkan data user dan postingannya
    const result = {
      user,
      posts,
    };

    res.json(result);

  } catch (error) {
    console.error("Error fetching profile and posts:", error);
    res.status(500).json({ message: "Error fetching data", error: error.message });
  }
});


// Tambahkan endpoint-endpoint berikut ke file router yang sama

// GET POST BY ID
router.get("/getpostbyid/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Dapatkan post berdasarkan ID
    const { data: post, error } = await supabase
      .from("post")
      .select("*")
      .eq("id", postId)
      .single();
    
    if (error) {
      console.error("Error fetching post:", error);
      return res.status(404).json({ message: "Post not found", error: error.message });
    }
    console.log("debug post", post);
    
    res.json(post);
    
  } catch (error) {
    console.error("Error fetching post details:", error.message);
    res.status(500).json({ message: "Error fetching post details", error: error.message });
  }
});

router.get("/getcommentbyid/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    // Dapatkan post berdasarkan ID
    const { data: comment, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .select('*, users:user_id (name)');
      // .single();
    
    if (error) {
      console.error("Error fetching post:", error);
      return res.status(404).json({ message: "Post not found", error: error.message });
    }
    console.log("debug koment", comment);
    
    res.json(comment);
  } catch (error) {
    console.error("Error fetching post details:", error.message);
    res.status(500).json({ message: "Error fetching post details", error: error.message });
  }
});

router.post("/likepost/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Panggil function increment_likes dari Supabase
    const { data, error } = await supabase
      .rpc('increment_likes', { post_id: id });

    if (error) {
      console.error("Failed to like post:", error);
      return res.status(500).json({ message: "Failed to like post", error: error.message });
    }
    console.log("test", {post: data});
    
    res.json({ message: "Post liked successfully", post: data });
  } catch (error) {
    console.error("Unexpected error:", error.message);
    res.status(500).json({ message: "Unexpected error", error: error.message });
  }
});


router.post('/postcomment', async (req, res) => {
  const { userid, post_id, content, timestamp } = req.body; // Ambil data dari body

  try {
    const { data, error } = await supabase
    .from('comments')
    .insert([
      {
        user_id: userid,
        post_id: post_id,
        content: content,
        created_at: timestamp
      }
    ])
    .select('*, users:user_id (name)');


    if (error) {
      console.error("Error inserting comment:", error);
      return res.status(500).json({ message: "Failed to insert comment", error });
    } 
    res.status(201).json(data[0]);
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
});

// Add this to your existing backend routes file

// Add this route handler for profile update
router.post("/update-profile", (req, res) => {
  const storage = multer.memoryStorage();
  const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  }).single("profileImage");

  // Process file upload
  upload(req, res, async function(multerErr) {
    if (multerErr) {
      console.error("Multer error:", multerErr);
      return res.status(400).json({ error: "File upload error", details: multerErr.message });
    }
    
    try {
      // Check for required fields
      const { id, name, username, email } = req.body;
      if (!id) {
        return res.status(400).json({ error: "User ID is required" });
      }

      console.log("Processing profile update request:", { id, name, username, email, hasImage: !!req.file });
      
      // Verify token for authentication
      // const token = req.headers.authorization?.split(" ")[1]; 
      // if (!token) {
      //   return res.status(401).json({ error: "Unauthorized: No token provided" });
      // }

      // Check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (userError || !existingUser) {
        console.error("User not found:", userError);
        return res.status(404).json({ error: "User not found" });
      }

      // Create update object with only fields that are provided
      const updates = {};
      if (name) updates.name = name;
      if (username) updates.username = username;
      if (email) updates.email = email;

      // Handle profile image upload if present
      let profileImageUrl = existingUser.profile_image_url;
      if (req.file) {
        const image = req.file;
        const filename = `profile-${id}-${Date.now()}-${image.originalname.replace(/\s+/g, "-")}`;
        
        console.log("Uploading profile image to Supabase:", filename);
        
        // Upload image to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("profile-images")  // Make sure this bucket exists in your Supabase project
          .upload(`${filename}`, image.buffer, {
            contentType: image.mimetype,
            cacheControl: "3600"
          });

        if (uploadError) {
          console.error("Supabase upload error:", uploadError);
          return res.status(500).json({ 
            error: "Profile image upload failed", 
            details: uploadError.message 
          });
        }

        console.log("Profile image uploaded successfully:", uploadData);
        
        // Get public URL for the uploaded image
        const { data: urlData } = supabase.storage
          .from("profile-images")
          .getPublicUrl(`${filename}`);
        
        profileImageUrl = urlData.publicUrl;
        updates.profile_image_url = profileImageUrl;
        console.log("Generated profile image URL:", profileImageUrl);
      }

      // Update user profile in database
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error("Profile update error:", updateError);
        return res.status(500).json({ 
          error: "Failed to update profile", 
          details: updateError.message 
        });
      }

      console.log("Profile updated successfully");
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Unhandled error in profile update:", error);
      res.status(500).json({ 
        error: "Server error occurred", 
        details: error.message
      });
    }
  });
});

export default router;

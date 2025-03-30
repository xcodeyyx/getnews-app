import jwt from "jsonwebtoken";
const SECRET_KEY = "your_secret_key";
// Middleware verifikasi JWT
const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    console.log("tken mu", authHeader);
    
    const token = authHeader && authHeader.split(" ")[1]; // Format: Bearer TOKEN
    console.log("tken mu 2", token);
    if (!token) {
      return res.status(401).json({ message: "Token tidak ditemukan, login ulang." });
    }
  
    // Verifikasi JWT
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Token tidak valid atau expired, login ulang." });
      }
  
      // Jika valid, simpan data user di req
      req.user = decoded;
      next();
    });
  };
  
export default verifyToken;
  
import "dotenv/config";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 16) {
  throw new Error(
    "JWT_SECRET belum diatur atau terlalu pendek (minimal 16 karakter). Isi di server/.env sebelum menjalankan server."
  );
}

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token is missing",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Hanya akun dengan role "admin" (dari JWT bertanda tangan server) yang boleh lewat.
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Akses ditolak. Fitur ini khusus Admin.",
    });
  }
  next();
};

export { JWT_SECRET };

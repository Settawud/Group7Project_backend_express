import jwt from "jsonwebtoken";

export default function jwtBearer(req, res, next) {
  const header = req.headers["authorization"] || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const cookieToken = req.cookies?.accessToken;
  const useToken = token || cookieToken;
  if (!useToken) {
    return res.status(401).json({ error: true, message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(useToken, process.env.JWT_SECRET || "dev_secret");
    req.user = { id: decoded.userId, email: decoded.email, name: decoded.name };
    next();
  } catch (err) {
    const isExpired = err?.name === "TokenExpiredError";
    return res.status(401).json({
      error: true,
      code: isExpired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
      message: isExpired ? "Token expired" : "Invalid token",
    });
  }
}


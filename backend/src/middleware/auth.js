import jwt from "jsonwebtoken";

export function requireUser(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = auth.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "user") {
      return res.status(403).json({ message: "Forbidden" });
    }
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = auth.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    req.admin = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

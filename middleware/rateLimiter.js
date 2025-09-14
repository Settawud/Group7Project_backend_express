import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 10000, // 15 minutes
  max: 20,                 // limit each IP to 100 requests
  standardHeaders: true,
  legacyHeaders: false,
});

export default limiter;

export const env = {
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  jwtSecret: process.env.JWT_SECRET || "dev_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
};


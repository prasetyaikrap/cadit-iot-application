import dotenv from "dotenv";
dotenv.config();

export const ENVS = {
  APP_ENV: process.env.APP_ENV ?? "development",
  APP_DOMAIN: process.env.APP_DOMAIN ?? "localhost:3001",
  APP_PORT: process.env.PORT ?? "3001",
};

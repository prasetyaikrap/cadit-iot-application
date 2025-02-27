import "express-async-errors";

import express from "express";
import cors from "cors";
import errorHandlerMiddleware from "../../interfaces/middleware/errorHandlerMiddleware";

export default function createApp() {
  // Repositories

  // Usecases

  // Middleware

  // Router Handler

  // Initialize App
  const app = express();

  app.use(express.json());
  app.use(cors());
  app.get("/", (_req, res) => {
    res.json({ message: "Express IoT Application - Prasetya Ikra Priyadi" });
  });
  //   app.use("/v1/users", userRouter);

  // Error Handling
  //@ts-ignore
  app.use(errorHandlerMiddleware);

  return app;
}

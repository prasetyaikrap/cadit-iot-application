import "express-async-errors";

import express from "express";
import cors from "cors";
import errorHandlerMiddleware from "../../interfaces/middleware/errorHandlerMiddleware";
import DevicesRepository from "../repository/devices/DevicesRepository";
import GetDowntimeAggregateUseCase from "@/src/applications/usecases/devices/GetDowntimeAggregateUseCase";
import devicesRoutes from "@/src/interfaces/http/api/devices/routes";
import DevicesHandler from "@/src/interfaces/http/api/devices/handler";
import GetOEECalculationUseCase from "@/src/applications/usecases/devices/GetOEECalulationUseCase";

export default function createApp() {
  // Repositories
  const devicesRepository = new DevicesRepository();

  // Usecases
  const devicesUseCases = {
    getDowntimeAggregateUseCase: new GetDowntimeAggregateUseCase({
      devicesRepository,
    }),
    getOEECalculationUseCase: new GetOEECalculationUseCase({
      devicesRepository,
    }),
  };

  // Middleware

  // Router Handler
  const devicesRouter = devicesRoutes({
    controller: new DevicesHandler(devicesUseCases),
  });

  // Initialize App
  const app = express();

  app.use(express.json());
  app.use(cors());
  app.get("/", (_req, res) => {
    res.json({ message: "Express IoT Application - Prasetya Ikra Priyadi" });
  });

  app.use("/v1/devices", devicesRouter);

  // Error Handling
  //@ts-ignore
  app.use(errorHandlerMiddleware);

  return app;
}

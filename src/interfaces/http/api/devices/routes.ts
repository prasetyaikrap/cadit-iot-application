// @ts-nocheck
import express from "express";
import DevicesHandler from "./handler";
import { RoutesProps } from "@/types";

export default function devicesRoutes({
  controller,
}: RoutesProps<DevicesHandler>) {
  const routes = express.Router();

  routes.get("/downtime", controller.getDowntimeAggregate);
  routes.get("/oee", controller.getOEECalculation);

  return routes;
}

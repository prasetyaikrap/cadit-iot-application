import { NextFunction, Request, Response } from "express";

export type BaseUseCasePayload = {
  credentials: {
    clientId: string;
  };
};

export interface CustomRequest extends Request {
  credentials: BaseUseCasePayload["credentials"];
}

export type RoutesProps<T> = {
  controller: T;
};

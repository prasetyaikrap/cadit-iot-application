import { NextFunction, Request, Response } from "express";
import ClientError from "../../commons/exceptions/ClientError";

export default function errorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ClientError) {
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message, error: err });
  }

  return res
    .status(500)
    .json({ success: false, message: err.message, error: err });
}

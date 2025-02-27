import GetDowntimeAggregateUseCase, {
  GetDowntimeAggregateUseCasePayload,
} from "@/src/applications/usecases/devices/GetDowntimeAggregateUseCase";
import { CustomRequest } from "@/types";
import autoBind from "auto-bind";
import { NextFunction, Response } from "express";

export type DevicesHandlerProps = {
  getDowntimeAggregateUseCase: GetDowntimeAggregateUseCase;
};

export default class DevicesHandler {
  public _getDowntimeAggregateUseCase: DevicesHandlerProps["getDowntimeAggregateUseCase"];

  constructor({ getDowntimeAggregateUseCase }: DevicesHandlerProps) {
    this._getDowntimeAggregateUseCase = getDowntimeAggregateUseCase;
    autoBind(this);
  }

  async getDowntimeAggregate(
    request: CustomRequest,
    response: Response,
    _next: NextFunction
  ) {
    const useCasePayload: GetDowntimeAggregateUseCasePayload = {
      credentials: request.credentials,
    };

    const data = await this._getDowntimeAggregateUseCase.execute(
      useCasePayload
    );

    return response.status(200).json({
      success: true,
      message: "Devices downtime data retrieved successfully",
      data,
    });
  }
}

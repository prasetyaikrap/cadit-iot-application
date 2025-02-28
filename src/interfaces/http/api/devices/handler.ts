import GetDowntimeAggregateUseCase, {
  GetDowntimeAggregateUseCasePayload,
} from "@/src/applications/usecases/devices/GetDowntimeAggregateUseCase";
import GetOEECalculationUseCase, {
  GetOEECalculationUseCasePayload,
} from "@/src/applications/usecases/devices/GetOEECalulationUseCase";
import { CustomRequest } from "@/types";
import autoBind from "auto-bind";
import { NextFunction, Response } from "express";

export type DevicesHandlerProps = {
  getDowntimeAggregateUseCase: GetDowntimeAggregateUseCase;
  getOEECalculationUseCase: GetOEECalculationUseCase;
};

export default class DevicesHandler {
  public _getDowntimeAggregateUseCase: DevicesHandlerProps["getDowntimeAggregateUseCase"];
  public _getOEECalculationUseCase: DevicesHandlerProps["getOEECalculationUseCase"];

  constructor({
    getDowntimeAggregateUseCase,
    getOEECalculationUseCase,
  }: DevicesHandlerProps) {
    this._getDowntimeAggregateUseCase = getDowntimeAggregateUseCase;
    this._getOEECalculationUseCase = getOEECalculationUseCase;
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

  async getOEECalculation(
    request: CustomRequest,
    response: Response,
    _next: NextFunction
  ) {
    const useCasePayload: GetOEECalculationUseCasePayload = {
      credentials: request.credentials,
    };

    const data = await this._getOEECalculationUseCase.execute(useCasePayload);

    return response.status(200).json({
      success: true,
      message: "Devices OEE calculation data retrieved successfully",
      data,
    });
  }
}

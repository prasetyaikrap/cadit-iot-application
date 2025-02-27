import DevicesRepository from "@/src/infrastructure/repository/devices/DevicesRepository";
import { BaseUseCasePayload } from "@/types";

export type GetDowntimeAggregateUseCasePayload = BaseUseCasePayload;

type GetDowntimeAggregateUseCaseProps = {
  devicesRepository: DevicesRepository;
};

export default class GetDowntimeAggregateUseCase {
  public name: string;
  public _devicesRepository: GetDowntimeAggregateUseCaseProps["devicesRepository"];

  constructor({ devicesRepository }: GetDowntimeAggregateUseCaseProps) {
    this.name = "Get Device Downtime Aggregate UseCase";
    this._devicesRepository = devicesRepository;
  }

  async execute(_props: GetDowntimeAggregateUseCasePayload) {
    const { statusData, manualStatusData } =
      this._devicesRepository.getStatusData();
    const mergedData = this._devicesRepository.mergedStatusData({
      statusData,
      manualStatusData,
    });
    const downtimeData = this._devicesRepository.getDowntimeData({
      data: mergedData,
    });
    const aggregateDowntimeData =
      this._devicesRepository.getStatusAggregateData({ data: downtimeData });
    return aggregateDowntimeData;
  }
}

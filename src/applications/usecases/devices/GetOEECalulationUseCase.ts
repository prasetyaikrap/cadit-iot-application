import DevicesRepository from "@/src/infrastructure/repository/devices/DevicesRepository";
import { BaseUseCasePayload } from "@/types";

export type GetOEECalculationUseCasePayload = BaseUseCasePayload;

type GetOEECalculationUseCaseProps = {
  devicesRepository: DevicesRepository;
};

type DailyEquipmentOEEVariables = {
  equipment_id: number;
  availability: {
    daily: Record<string, number>;
    average: number;
  };
  performance: {
    daily: Record<string, number>;
    average: number;
  };
  quality: {
    daily: Record<string, number>;
    average: number;
  };
};

type OverallOEEVariables = {
  availability: {
    total: number;
    average: number;
  };
  performance: {
    total: number;
    average: number;
  };
  quality: {
    total: number;
    average: number;
  };
};

export default class GetOEECalculationUseCase {
  public name: string;
  public _devicesRepository: GetOEECalculationUseCaseProps["devicesRepository"];

  constructor({ devicesRepository }: GetOEECalculationUseCaseProps) {
    this.name = "Get device Overall Equipment Effectiveness (OEE) Calculation";
    this._devicesRepository = devicesRepository;
  }

  async execute(_props: GetOEECalculationUseCasePayload) {
    const { statusData } = this._devicesRepository.getStatusData();
    const { productionData } = this._devicesRepository.getProductionData();
    const eligibleOEEData = this._devicesRepository.getEligibleOEEData({
      statusData,
      productionData,
    });

    const dailyEquipmentOEEVariables = eligibleOEEData.reduce(
      (result: DailyEquipmentOEEVariables[], current) => {
        const insertIdx = result.findIndex(
          (v) => v.equipment_id === current.equipment_id
        );
        const availability = this._devicesRepository.calculateAvailability({
          data: current,
        });
        const performance = this._devicesRepository.calculatePerformance({
          data: current,
        });
        const quality = this._devicesRepository.calculateQuality({
          data: current,
        });

        if (insertIdx === -1) {
          result.push({
            equipment_id: current.equipment_id,
            availability: {
              daily: {
                [current.date]: availability,
              },
              average: availability,
            },
            performance: {
              daily: {
                [current.date]: performance,
              },
              average: performance,
            },
            quality: {
              daily: {
                [current.date]: quality,
              },
              average: quality,
            },
          });
        } else {
          const availabilityArr = Object.values(
            result[insertIdx].availability.daily
          );
          const avgAvailability = (
            (availabilityArr.reduce((acc, num) => acc + num, 0) +
              availability) /
            (availabilityArr.length + 1)
          ).toFixed(2);
          const performanceArr = Object.values(
            result[insertIdx].performance.daily
          );
          const avgPerformance = (
            (performanceArr.reduce((acc, num) => acc + num, 0) + performance) /
            (performanceArr.length + 1)
          ).toFixed(2);
          const qualityArr = Object.values(result[insertIdx].quality.daily);
          const avgQuality = (
            (qualityArr.reduce((acc, num) => acc + num, 0) + quality) /
            (qualityArr.length + 1)
          ).toFixed(2);

          result[insertIdx] = {
            ...result[insertIdx],
            availability: {
              daily: {
                ...result[insertIdx].availability.daily,
                [current.date]: availability,
              },
              average: parseFloat(avgAvailability),
            },
            performance: {
              daily: {
                ...result[insertIdx].performance.daily,
                [current.date]: performance,
              },
              average: parseFloat(avgPerformance),
            },
            quality: {
              daily: {
                ...result[insertIdx].quality.daily,
                [current.date]: quality,
              },
              average: parseFloat(avgQuality),
            },
          };
        }

        return result;
      },
      []
    );

    const { availability, performance, quality } =
      dailyEquipmentOEEVariables.reduce(
        (result: OverallOEEVariables, current, idx) => {
          const totalAvailability =
            result.availability.total + current.availability.average;
          const averageAvailability = (totalAvailability / (idx + 1)).toFixed(
            2
          );

          const totalPerformance =
            result.performance.total + current.performance.average;
          const averagePerformance = (totalPerformance / (idx + 1)).toFixed(2);

          const totalQuality = result.quality.total + current.quality.average;
          const averageQuality = (totalQuality / (idx + 1)).toFixed(2);

          return {
            availability: {
              total: totalAvailability,
              average: parseFloat(averageAvailability),
            },
            performance: {
              total: totalPerformance,
              average: parseFloat(averagePerformance),
            },
            quality: {
              total: totalQuality,
              average: parseFloat(averageQuality),
            },
          };
        },
        {
          availability: { total: 0, average: 0 },
          performance: { total: 0, average: 0 },
          quality: { total: 0, average: 0 },
        }
      );

    const OEEValue = (
      availability.average *
      performance.average *
      quality.average
    ).toFixed(2);

    const OEECategory = this._devicesRepository.getOEECategory({
      value: parseFloat(OEEValue),
    });

    return {
      classification: OEECategory,
      details: {
        daily: dailyEquipmentOEEVariables,
        overall: {
          availability: availability.average,
          performance: performance.average,
          quality: quality.average,
        },
      },
    };
  }
}

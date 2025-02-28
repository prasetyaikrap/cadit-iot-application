import statusData from "@/src/infrastructure/data/status.json" assert { type: "json" };
import manualStatusData from "@/src/infrastructure/data/manual_status.json" assert { type: "json" };
import productionData from "@/src/infrastructure/data/production.json" assert { type: "json" };
import { parseDate } from "@/src/commons/utils/general";

type StatusData = {
  equipment_id: number;
  start_time: string;
  end_time: string;
  status: string;
  reason: string;
};

type ProductionData = {
  equipment_id: number;
  start_production: string;
  finish_production: string;
  planned_duration_in_second: number;
  planned_quantity: number;
  actual_quantity: number;
  defect_quantity: number;
};

type EligibleOEEData = {
  equipment_id: number;
  date: string;
  planned_duration: number;
  planned_quantity: number;
  running_duration: number;
  idle_duration: number;
  down_duration: number;
  offline_duration: number;
  effective_duration: number;
  actual_duration: number;
  actual_quantity: number;
  defect_quantity: number;
};

type OccurancesData = {
  equipment_id: number;
  date: string;
  status: string;
  reason: string;
  occurance: number;
  start_time?: string;
  end_time?: string;
};

type MergedStatusDataProps = {
  statusData: StatusData[];
  manualStatusData: StatusData[];
};

type GetDowntimeDataProps = {
  data: StatusData[];
};

type GetStatusAggregateDataProps = {
  data: StatusData[];
};

type GetEligibleOEEDataProps = {
  statusData: StatusData[];
  productionData: ProductionData[];
};

type CalculateAvailabilityProps = {
  data: EligibleOEEData;
};

type CalculatePerformanceProps = {
  data: EligibleOEEData;
};

type CalculateQualityProps = {
  data: EligibleOEEData;
};

type GetOEECategoryProps = {
  value: number;
};

export default class DevicesRepository {
  public name: string;

  constructor() {
    this.name = "Devices Repository";
  }

  getStatusData() {
    return {
      statusData: statusData as StatusData[],
      manualStatusData: manualStatusData as StatusData[],
    };
  }

  getStatusAggregateData({ data }: GetStatusAggregateDataProps) {
    const occurances: OccurancesData[] = data.reduce(
      (result: OccurancesData[], current) => {
        const [startDate] = current.start_time.split(" ");
        const dIndex = result.findIndex(
          (d) =>
            d.equipment_id === current.equipment_id &&
            d.date === startDate &&
            d.status === current.status &&
            d.reason === current.reason
        );

        if (dIndex === -1) {
          return [
            ...result,
            {
              equipment_id: current.equipment_id,
              date: startDate,
              status: current.status,
              reason: current.reason,
              occurance: 1,
            },
          ];
        }

        result[dIndex].occurance = result[dIndex].occurance + 1;
        return result;
      },
      []
    );

    return occurances.sort((a, b) => {
      if (a.equipment_id !== b.equipment_id)
        return a.equipment_id - b.equipment_id;

      // 2️⃣ Sort by start_time (ascending)
      let dateA = parseDate(a.date) as unknown as number;
      let dateB = parseDate(b.date) as unknown as number;
      if (dateA - dateB !== 0) return dateA - dateB;

      // 4️⃣ Sort by count (descending: higher count first)
      return (b.occurance || 0) - (a.occurance || 0);
    });
  }

  mergedStatusData({ statusData, manualStatusData }: MergedStatusDataProps) {
    let merged: StatusData[] = [];
    // Step 1: Split status data into periods cross midnight
    const splitStatus = statusData
      .flatMap(this.splitMidnightPeriods)
      .sort(
        (a, b) =>
          (parseDate(a.start_time) as unknown as number) -
          (parseDate(b.start_time) as unknown as number)
      );
    const splitManualStatus = manualStatusData
      .flatMap(this.splitMidnightPeriods)
      .sort(
        (a, b) =>
          (parseDate(a.start_time) as unknown as number) -
          (parseDate(b.start_time) as unknown as number)
      );

    splitManualStatus.forEach((manual) => {
      merged.push({
        ...manual,
      });

      let i = 0;
      while (i < splitStatus.length) {
        const entry = splitStatus[i];
        const entryStart = parseDate(entry.start_time);
        const entryEnd = parseDate(entry.end_time);
        const manualStart = parseDate(manual.start_time);
        const manualEnd = parseDate(manual.end_time);

        // Step2: If the manual entry is within the status entry
        if (manualStart >= entryStart && manualEnd <= entryEnd) {
          if (manualStart > entryStart) {
            merged.push({
              ...entry,
              end_time: manual.start_time,
            });
          }

          if (manualEnd < entryEnd) {
            splitStatus[i] = { ...entry, start_time: manual.end_time };
          } else {
            splitStatus.splice(i, 1);
          }
        }

        i++;
      }
    });

    // Add remaining status entries
    merged.push(...splitStatus);

    return merged.sort(
      (a, b) =>
        (parseDate(a.start_time) as unknown as number) -
        (parseDate(b.start_time) as unknown as number)
    );
  }

  splitMidnightPeriods(entry: StatusData): StatusData[] {
    const [startDate] = entry.start_time.split(" ");
    const [endDate] = entry.end_time.split(" ");

    if (startDate !== endDate) {
      return [
        {
          equipment_id: entry.equipment_id,
          start_time: entry.start_time,
          end_time: `${startDate} 24:00:00`,
          status: entry.status,
          reason: entry.reason ?? "",
        },
        {
          equipment_id: entry.equipment_id,
          start_time: `${endDate} 00:00:00`,
          end_time: entry.end_time,
          status: entry.status,
          reason: entry.reason ?? "",
        },
      ];
    }

    return [entry];
  }

  splitProductionMidnightPeriods(entry: ProductionData): ProductionData[] {
    const [startDate] = entry.start_production.split(" ");
    const [endDate] = entry.finish_production.split(" ");

    if (startDate !== endDate) {
      return [
        {
          ...entry,
          start_production: entry.start_production,
          finish_production: `${startDate} 24:00:00`,
        },
        {
          ...entry,
          start_production: `${endDate} 00:00:00`,
          finish_production: entry.finish_production,
        },
      ];
    }

    return [entry];
  }

  getDowntimeData({ data }: GetDowntimeDataProps): StatusData[] {
    const downtimeData = data
      .filter((d) => d.status === "DOWN")
      .map((d) => ({
        ...d,
        reason: d.reason || "Status Down",
      }));

    return downtimeData;
  }

  getProductionData() {
    return { productionData: productionData as ProductionData[] };
  }

  getEligibleOEEData({ statusData, productionData }: GetEligibleOEEDataProps) {
    let eligibleData: EligibleOEEData[] = [];
    const splitStatus = statusData
      .flatMap(this.splitMidnightPeriods)
      .sort(
        (a, b) =>
          (parseDate(a.start_time) as unknown as number) -
          (parseDate(b.start_time) as unknown as number)
      );

    const splitProduction = productionData
      .flatMap(this.splitProductionMidnightPeriods)
      .sort(
        (a, b) =>
          (parseDate(a.start_production) as unknown as number) -
          (parseDate(b.start_production) as unknown as number)
      );

    splitProduction.forEach((p) => {
      const [startProdDate] = p.start_production.split(" ");
      const targetIdx = eligibleData.findIndex(
        (d) => d.equipment_id === p.equipment_id && d.date === startProdDate
      );

      if (targetIdx === -1) {
        eligibleData.push({
          equipment_id: p.equipment_id,
          date: startProdDate,
          planned_duration: p.planned_duration_in_second,
          planned_quantity: p.planned_quantity,
          running_duration: 0,
          idle_duration: 0,
          down_duration: 0,
          offline_duration: 0,
          effective_duration: 0,
          actual_duration: 0,
          actual_quantity: p.actual_quantity,
          defect_quantity: p.defect_quantity,
        });
      } else {
        eligibleData[targetIdx] = {
          ...eligibleData[targetIdx],
          planned_duration:
            eligibleData[targetIdx].planned_duration +
            p.planned_duration_in_second,
          planned_quantity:
            eligibleData[targetIdx].planned_quantity + p.planned_quantity,
          actual_quantity:
            eligibleData[targetIdx].actual_quantity + p.actual_quantity,
          defect_quantity:
            eligibleData[targetIdx].defect_quantity + p.defect_quantity,
        };
      }

      for (const entry of splitStatus) {
        const [startDate] = entry.start_time.split(" ");
        const insertIdx =
          targetIdx === -1 ? eligibleData.length - 1 : targetIdx;
        const entryStart = parseDate(entry.start_time);
        const entryEnd = parseDate(entry.end_time);
        const prodStart = parseDate(p.start_production);
        const prodEnd = parseDate(p.finish_production);
        const isTarget =
          eligibleData[insertIdx].equipment_id === entry.equipment_id &&
          eligibleData[insertIdx].date === startDate;
        const isNotOnProductionRange =
          entryEnd < prodStart || entryStart > prodEnd;

        if (!isTarget || isNotOnProductionRange) continue;

        const durationStart =
          entryStart < prodStart
            ? prodStart.getTime() / 1000
            : entryStart.getTime() / 1000;
        const durationEnd =
          entryEnd > prodEnd
            ? prodEnd.getTime() / 1000
            : entryEnd.getTime() / 1000;
        const duration = durationEnd - durationStart;
        const status = entry.status.toLowerCase();
        const insertKey = `${status}_duration` as keyof Pick<
          EligibleOEEData,
          | "idle_duration"
          | "running_duration"
          | "down_duration"
          | "offline_duration"
        >;
        eligibleData[insertIdx][insertKey] =
          eligibleData[insertIdx][insertKey] + duration;
        eligibleData[insertIdx].actual_duration =
          eligibleData[insertIdx].actual_duration + duration;

        if (insertKey !== "offline_duration") {
          eligibleData[insertIdx].effective_duration =
            eligibleData[insertIdx].effective_duration + duration;
        }
      }
    });

    return eligibleData;
  }

  calculateAvailability({ data }: CalculateAvailabilityProps) {
    const { running_duration, down_duration, idle_duration } = data;
    const availability = (
      (running_duration + idle_duration) /
      (running_duration + idle_duration + down_duration)
    ).toFixed(2);
    return parseFloat(availability);
  }

  calculatePerformance({ data }: CalculatePerformanceProps) {
    const {
      planned_duration,
      effective_duration,
      planned_quantity,
      actual_quantity,
    } = data;
    const idealCycle = planned_duration / planned_quantity;
    const actualCycle = effective_duration / actual_quantity;
    const performance = (idealCycle / actualCycle).toFixed(2);

    return parseFloat(performance) > 1 ? 1 : parseFloat(performance);
  }

  calculateQuality({ data }: CalculateQualityProps) {
    const { actual_quantity, defect_quantity } = data;
    const quality = (
      (actual_quantity - defect_quantity) /
      actual_quantity
    ).toFixed(2);

    return parseFloat(quality);
  }

  getOEECategory({ value }: GetOEECategoryProps) {
    switch (true) {
      case value > 0.85 && value <= 1:
        return {
          value,
          category: "Excellent",
          description:
            "he process runs with high efficiency, meeting or exceeding industry standards.",
        };
      case value > 0.75 && value <= 0.85:
        return {
          value,
          category: "Recommended",
          description:
            "Optimal performance, with minor improvements, can reach the best level",
        };
      case value > 0.6 && value <= 0.75:
        return {
          value,
          category: "Good",
          description:
            "The process runs well, but there are opportunities to improve efficiency",
        };
      case value > 0.5 && value <= 0.6:
        return {
          value,
          category: "Minimum",
          description:
            "Meets basic requirements but still requires significant improvements",
        };
      case value >= 0 && value <= 0.5:
        return {
          value,
          category: "Bad",
          description:
            "Performance is far below standard. A lot of time is lost due to breakdowns, downtime, or inefficiencies",
        };
      default:
        return {
          value,
          category: "Uncategorized",
          description: "-",
        };
    }
  }
}

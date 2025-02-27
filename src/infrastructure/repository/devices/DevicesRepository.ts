import statusData from "@/src/infrastructure/data/status.json" assert { type: "json" };
import manualStatusData from "@/src/infrastructure/data/manual_status.json" assert { type: "json" };
import { parseDate } from "@/src/commons/utils/general";

type StatusData = {
  equipment_id: number;
  start_time: string;
  end_time: string;
  status: string;
  reason: string;
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
          end_time: `${startDate} 23:59:59`,
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

  getDowntimeData({ data }: GetDowntimeDataProps): StatusData[] {
    const downtimeData = data
      .filter((d) => d.status === "DOWN")
      .map((d) => ({
        ...d,
        reason: d.reason || "Status Down",
      }));

    return downtimeData;
  }
}

import * as d3 from "d3";
import { Status } from "./miscTypes";
import { generate } from "random-words";
import { getEnumLength } from "./utils";
import { LabSection } from "./timeWindows";
import { DataPoint } from "./dataPoints";

// todo: uses seeds to have control over randomness

const generateRanKerberos = (): string => {
  return generate({ maxLength: 10 }) as string;
};

const generateRanTimestamp = (startTime: Date, endTime: Date): Date => {
  const start = startTime.getTime();
  const end = endTime.getTime();
  const randomTime = start + Math.random() * (end - start);
  return new Date(randomTime);
};

// note: potential bug as enum could have holes
const generateRanLabSection = (): LabSection => {
  const randomNumber =
    Math.floor(Math.random() * getEnumLength(LabSection)) + 1;
  return randomNumber as LabSection;
};

// todo: simplify this enum logic
const generateRanStatus = (): Status => {
  const randomIndex = Math.floor(Math.random() * getEnumLength(Status));

  const enumKeys = Object.keys(Status).filter((key) => isNaN(Number(key)));
  const randomKey = enumKeys[randomIndex] as keyof typeof Status;
  return Status[randomKey];
};

export const generateRanData = (): DataPoint[] => {
  const startDate = d3.timeDay.offset(new Date(), -1);
  const endDate = d3.timeDay.offset(new Date(), 1);
  const numPoints = 100;
  const data: DataPoint[] = [];

  for (let i = 0; i < numPoints; i++) {
    data.push({
      kerberos: generateRanKerberos(),
      lab_section: generateRanLabSection(),
      checkin_timestamp: generateRanTimestamp(startDate, endDate),
      status: generateRanStatus(),
      global_position: Math.floor(Math.random() * 101),
      local_position: -1,
    });
  }

  data.sort(
    (a, b) => a.checkin_timestamp.getTime() - b.checkin_timestamp.getTime(),
  );
  return data;
};

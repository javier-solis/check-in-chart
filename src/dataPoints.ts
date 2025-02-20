import { LabSection } from "./timeWindows";
import { Status, ValidURL, URLSchema } from "./miscTypes";
import { z } from "zod";

// API schema type
export const DataPointSchema = z.object({
  kerberos: z.string(),
  lab_section: z.nativeEnum(LabSection),
  checkin_timestamp: z.string().datetime({ local: true }).nullable(),
  status: z.nativeEnum(Status),
  global_position: z.number(),
  local_position: z.number().nullable(),
});

// todo: somehow merge these two? they're very similar in idea

// Runtime type
export interface DataPoint {
  kerberos: string;
  lab_section: LabSection;
  checkin_timestamp: Date;
  status: Status;
  global_position: number;
  local_position: number;
}

const APIResponseSchema = z.object({
  dataPoints: z.array(DataPointSchema),
});

export class DataPointCollection {
  private dataPoints: DataPoint[] = [];

  public static async fromJSON(
    url: ValidURL,
  ): Promise<DataPointCollection | undefined> {
    try {
      // Validate URL
      URLSchema.parse(url);

      const response = await fetch(url);
      const data = await response.json();
      const result = APIResponseSchema.safeParse(data);

      if (!result.success) {
        console.error("Validation error:", result.error);
        return undefined;
      }

      const collection = new DataPointCollection();

      for (const point of data.dataPoints) {
        // Handle ABSENT status special case
        if (point.status === Status.Absent) {
          collection.addDataPoint({
            ...point,
            checkin_timestamp: new Date(),
            local_position: 0,
          });
          continue;
        }

        // For non-absent status, ensure timestamp exists
        if (!point.checkin_timestamp) {
          console.error("Missing timestamp for non-absent status");
          return undefined;
        }

        collection.addDataPoint({
          ...point,
          checkin_timestamp: new Date(point.checkin_timestamp),
          local_position: point.local_position ?? 0, // Provide default value for local_position
        });
      }

      return collection;
    } catch (error) {
      console.error(
        "Error in fromJSON:",
        error instanceof Error ? error.message : error,
      );
      return undefined;
    }
  }

  // Add single data point
  public addDataPoint(point: DataPoint): void {
    this.dataPoints.push(point);
  }

  // Add multiple data points
  public addDataPoints(points: DataPoint[]): void {
    this.dataPoints.push(...points);
  }

  // Get all data points
  public getDataPoints(): DataPoint[] {
    return [...this.dataPoints];
  }

  // Get data points ordered by global position
  public getDataPointsByGlobalPosition(): DataPoint[] {
    return [...this.dataPoints].sort(
      (a, b) => a.global_position - b.global_position,
    );
  }

  // Clear all data points
  public clear(): void {
    this.dataPoints = [];
  }
}

import * as d3 from "d3";
import { z } from "zod";
import { ChartConfig } from "./config";
import { ValidURL } from "./miscTypes";

export enum LabSection {
  One = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
}

const TimeInputSchema = z.object({
  name: z.string(),
  day: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  // todo: use regex to validate hex color?
  color: z.string().default("#808080"),
});

const TimeWindowsAPIResponseSchema = z.object({
  windows: z.array(TimeInputSchema),
});

export interface TimeWindow {
  name: string;
  start: Date;
  end: Date;
  color: string;
}

export class TimeWindowGenerator {
  private day: Date;
  private startTime: Date;
  private endTime: Date;
  private name: string;

  constructor() {
    const now = new Date();
    this.day = now;
    this.startTime = now;
    this.endTime = now;
    this.name = "Default Window";
  }

  public generateTimeSection(
    input: z.infer<typeof TimeInputSchema>,
  ): TimeWindow {
    this.parseInput(input);

    return {
      name: input.name,
      start: new Date(this.startTime),
      end: new Date(this.endTime),
      color: input.color,
    };
  }

  private parseInput(input: z.infer<typeof TimeInputSchema>): void {
    const dayRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    const timeRegex = /^\d{2}:\d{2}:\d{2}$/;

    if (!dayRegex.test(input.day)) {
      throw new Error("Day must be in MM/DD/YYYY format");
    }
    if (!timeRegex.test(input.startTime) || !timeRegex.test(input.endTime)) {
      throw new Error("Times must be in HH:MM:SS format");
    }

    const [month, day, year] = input.day.split("/").map(Number);
    const [startHours, startMinutes, startSeconds] = input.startTime
      .split(":")
      .map(Number);
    const [endHours, endMinutes, endSeconds] = input.endTime
      .split(":")
      .map(Number);

    this.day = new Date(year, month - 1, day);
    this.startTime = new Date(
      year,
      month - 1,
      day,
      startHours,
      startMinutes,
      startSeconds,
    );
    this.endTime = new Date(
      year,
      month - 1,
      day,
      endHours,
      endMinutes,
      endSeconds,
    );
    this.name = input.name;

    if (this.endTime <= this.startTime) {
      throw new Error("End time must be after start time");
    }
  }
}

export class TimeWindowCollection {
  private windows: TimeWindow[] = [];

  public static async fromJSON(
    url: ValidURL,
  ): Promise<TimeWindowCollection | undefined> {
    try {
      const response = await fetch(url);
      const data = await response.json();

      const parsed = TimeWindowsAPIResponseSchema.safeParse(data);
      if (!parsed.success) {
        console.error("TimeWindows JSON validation error:", parsed.error);
        return undefined;
      }

      const collection = new TimeWindowCollection();
      const generator = new TimeWindowGenerator();

      for (const input of parsed.data.windows) {
        try {
          const section = generator.generateTimeSection(input);
          collection.addWindow(section);
        } catch (err) {
          console.error("Error generating time window:", err);
          return undefined;
        }
      }

      return collection;
    } catch (error) {
      console.error("Failed to parse time windowss JSON:", {
        url,
        error,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      return undefined;
    }
  }

  public addWindow(section: TimeWindow): void {
    this.windows.push(section);
  }

  public drawWindows(
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    xScale: d3.ScaleTime<number, number>,
  ): void {
    const { margin, height } = ChartConfig.dimensions;

    svg
      .append("g")
      .attr("class", "time-sections")
      .selectAll("rect")
      .data(this.windows)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.start))
      .attr("y", margin.top)
      .attr("width", (d) => xScale(d.end) - xScale(d.start))
      .attr("height", height - margin.top - margin.bottom)
      .attr("fill", (d) => d.color)
      .attr("opacity", 0.15); // todo: make a config variable?
  }

  public createWindowButtons(
    // todo: make less use of "any"
    buttonContainer: d3.Selection<any, unknown, HTMLElement, any>,
    xScale: d3.ScaleTime<number, number>,
    scrollContainer: d3.Selection<any, unknown, HTMLElement, any>,
  ): void {
    this.windows.forEach((window) => {
      buttonContainer
        .append("button")
        .style("margin-right", "8px")
        .style("cursor", "pointer")
        .text(window.name)
        .on("click", () => {
          const startX = xScale(window.start);
          const endX = xScale(window.end);
          const sectionMid = startX + (endX - startX) / 2;
          const scrollTo = sectionMid - ChartConfig.dimensions.visibleWidth / 2;

          scrollContainer.node()?.scrollTo({
            left: scrollTo,
            behavior: "smooth",
          });
        });
    });
  }
}

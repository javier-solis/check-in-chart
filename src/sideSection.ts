import { DataPoint } from "./dataPoints";
import { ChartConfig } from "./config";

// todo: move this variable to config?
// todo: fine-tune these numbers
export const sideSectionConfig = {
  width: 150,
  gap: 50,
  columns: 6,
  rows: 10,
  pointSpacing: 25,
  // below maths calculates margins based on total width and point spacing
  horizontalMargin: (150 - 5 * 25) / 2 + 50,
};

/**
 * Returns the total SVG width including room for the side section.
 */
export function updatedSVGWidth(): number {
  return (
    ChartConfig.dimensions.fullWidth +
    sideSectionConfig.width +
    sideSectionConfig.gap
  );
}

// todo: give this (and Y equivalent) a better name
/**
 * Calculates the x-position for data points on the side section.
 */
export function sideSectionXCoordinate(
  d: DataPoint,
  data: DataPoint[],
): number {
  const index = data.indexOf(d);
  const column = index % sideSectionConfig.columns;
  return (
    ChartConfig.dimensions.fullWidth +
    sideSectionConfig.horizontalMargin +
    column * sideSectionConfig.pointSpacing
  );
}

/**
 * Calculates the y-position for data points on the side section.
 */
export function sideSectionYCoordinate(
  d: DataPoint,
  data: DataPoint[],
): number {
  const index = data.indexOf(d);
  const row = Math.floor(index / sideSectionConfig.columns);
  return (
    ChartConfig.dimensions.margin.top +
    row * sideSectionConfig.pointSpacing +
    20
  );
}

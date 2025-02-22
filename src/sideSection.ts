import { DataPoint } from "./dataPoints";
import { ChartConfig } from "./config";

// todo: move this variable to config?
// todo: fine-tune these numbers
export const sideSectionConfig = {
  width: 150,
  gap: 50,
  columns: 6,
  rows: 10,
  pointSpacing: 25
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

/**
 * Calculates the x-position for data points on the side section,
 * centering them horizontally in the space provided.
 */
export function sideSectionXCoordinate(
  d: DataPoint,
  data: DataPoint[],
): number {
  const { margin, fullWidth } = ChartConfig.dimensions;

  const index = data.indexOf(d);
  const column = index % sideSectionConfig.columns;

  const startOfSideSection = fullWidth - margin.right + sideSectionConfig.gap;

  const totalGridWidth =
    sideSectionConfig.columns * sideSectionConfig.pointSpacing;

  const leftoverSpace = sideSectionConfig.width - totalGridWidth;

  const centerOffsetX = leftoverSpace / 2;

  const xPos =
    startOfSideSection +
    centerOffsetX +
    column * sideSectionConfig.pointSpacing
  
  return xPos;
}

/**
 * Calculates the y-position for data points on the side section,
 * centering them within the chart’s usable height.
 */
export function sideSectionYCoordinate(
  d: DataPoint,
  data: DataPoint[],
): number {
  const { margin, height } = ChartConfig.dimensions;

  const index = data.indexOf(d);
  const row = Math.floor(index / sideSectionConfig.columns);

  const netHeight = height - margin.top - margin.bottom;

  const totalGridHeight =
    sideSectionConfig.rows * sideSectionConfig.pointSpacing;

  const centerOffset = (netHeight - totalGridHeight) / 2;

  const yPos =
    margin.top +
    centerOffset +
    row * sideSectionConfig.pointSpacing

  return yPos;
}

export function drawSideSectionBorder(
  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
) {
  const { margin, height, fullWidth } = ChartConfig.dimensions;
  const totalGridHeight =
    sideSectionConfig.rows * sideSectionConfig.pointSpacing;


  const netHeight = height - margin.top - margin.bottom;
  const leftoverSpaceY = netHeight - totalGridHeight;
  const centerOffsetY = leftoverSpaceY / 2;

  const sideSectionX = fullWidth - margin.right + sideSectionConfig.gap;

  const sideSectionY = margin.top + centerOffsetY;

  svg
    .append("rect")
    .attr("x", sideSectionX)
    .attr("y", sideSectionY)
    .attr("width", sideSectionConfig.width)
    .attr("height", totalGridHeight)
    .attr("fill", "none")
    .attr("stroke", "red");
}

export function drawSideSectionGrid(
  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
): void {
  const { margin, height, fullWidth } = ChartConfig.dimensions;

  const totalGridWidth =
    sideSectionConfig.columns * sideSectionConfig.pointSpacing;
  const totalGridHeight =
    sideSectionConfig.rows * sideSectionConfig.pointSpacing;

  const leftoverSpaceX = sideSectionConfig.width - totalGridWidth;
  const centerOffsetX = leftoverSpaceX / 2;

  const netHeight = height - margin.top - margin.bottom;
  const leftoverSpaceY = netHeight - totalGridHeight;
  const centerOffsetY = leftoverSpaceY / 2;

  const sideSectionX = fullWidth - margin.right + sideSectionConfig.gap;
  const sideSectionY = margin.top + centerOffsetY;

  // Horizontal grid lines
  for (let i = 0; i < sideSectionConfig.rows; i++) {
    svg
      .append("line")
      .attr("x1", sideSectionX + centerOffsetX)
      .attr("x2", sideSectionX + centerOffsetX + totalGridWidth)
      .attr("y1", sideSectionY + i * sideSectionConfig.pointSpacing)
      .attr("y2", sideSectionY + i * sideSectionConfig.pointSpacing)
      .attr("stroke", "lightgray")
      .attr("stroke-dasharray", "2,2");
  }

  // Vertical grid lines
  for (let i = 0; i < sideSectionConfig.columns; i++) {
    svg
      .append("line")
      .attr(
        "x1",
        sideSectionX + centerOffsetX + i * sideSectionConfig.pointSpacing,
      )
      .attr(
        "x2",
        sideSectionX + centerOffsetX + i * sideSectionConfig.pointSpacing,
      )
      .attr("y1", sideSectionY)
      .attr("y2", sideSectionY + totalGridHeight)
      .attr("stroke", "lightgray")
      .attr("stroke-dasharray", "2,2");
  }
}

// todo: add option to place side section on left or right of main graph
// todo: Implement a less mathematical way of adding the side section points, leveraging native d3.js
// todo: fix click/pinned tooltips on side section, they currently can't be be pinned
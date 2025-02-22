import * as d3 from "d3";
import { DataPoint } from "./dataPoints";
import { ChartConfig } from "./config";
import { TooltipManager } from "./tooltips";
import { getStatusColor } from "./main";

// todo: move this variable to config?
// todo: fine-tune these numbers
export const sideSectionConfig = {
  width: 150,
  sideMargin: 50, // left and right margin
  columns: 6,
  rows: 10,
};

/**
 * Returns the total SVG width including room for the side section
 * and its horizontal margins.
 */
export function updatedSVGWidth(): number {
  return (
    ChartConfig.dimensions.fullWidth +
    sideSectionConfig.width +
    sideSectionConfig.sideMargin * 2
  );
}

export function drawSideSection(
  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
  absentData: DataPoint[],
  tooltipManager: TooltipManager,
) {
  const { margin, height, fullWidth } = ChartConfig.dimensions;
  const { radius } = ChartConfig.dataPoints;

  // Calculate where the side section begins
  const sideSectionX = fullWidth + sideSectionConfig.sideMargin - margin.right;

  // Usable height
  const netHeight = height - margin.top - margin.bottom;

  // Create a container group to hold all side section elements
  const sideGroup = svg.append("g").attr("class", "side-section");

  // Pick a cell size so columns x cellSize fits into sideSectionConfig.width,
  // and rows x cellSize fits into netHeight - guaranteeing squares.
  const cellSize = Math.min(
    sideSectionConfig.width / sideSectionConfig.columns,
    netHeight / sideSectionConfig.rows,
  );

  // The total grid width/height based on cellSize
  const actualGridWidth = cellSize * sideSectionConfig.columns;
  const actualGridHeight = cellSize * sideSectionConfig.rows;

  // Compute leftover vertical space to center the grid within "netHeight"
  const leftoverSpace = netHeight - actualGridHeight;
  const offsetY = leftoverSpace / 2;

  // Now shift the group into place horizontally and vertically
  sideGroup.attr(
    "transform",
    `translate(${sideSectionX}, ${margin.top + offsetY})`,
  );

  // Define band scales to create square cells
  const xScale = d3
    .scaleBand()
    .domain(d3.range(sideSectionConfig.columns).map(String))
    .range([0, actualGridWidth])
    .paddingInner(0.2);

  const yScale = d3
    .scaleBand()
    .domain(d3.range(sideSectionConfig.rows).map(String))
    .range([0, actualGridHeight])
    .paddingInner(0.2);

  // For debugging purposes. Leave commented out during production.
  // drawSideSectionGrid(sideGroup, actualGridWidth, actualGridHeight);

  // Create data points for absent data
  sideGroup
    .selectAll(".absent-dot")
    .data(absentData)
    .enter()
    .append("circle")
    .attr("class", "absent-dot")
    .attr("r", radius.default)
    .attr("cx", (_, i) => {
      const col = i % sideSectionConfig.columns;
      return xScale(String(col))! + xScale.bandwidth() / 2;
    })
    .attr("cy", (_, i) => {
      const row = Math.floor(i / sideSectionConfig.columns);
      return yScale(String(row))! + yScale.bandwidth() / 2;
    })
    .attr("fill", (d) => getStatusColor(d))
    .on("mouseover", function (this: SVGCircleElement, event, d) {
      d3.select(this).transition().duration(150).attr("r", radius.hover);
      tooltipManager.showHover(d, event.pageX + 10, event.pageY - 28);
    })
    .on("mouseout", function (this: SVGCircleElement) {
      d3.select(this).transition().duration(150).attr("r", radius.default);
      tooltipManager.hideHover();
    });
}

/**
 * Draws a border rectangle around the grid and dashed lines between cells
 */
function drawSideSectionGrid(
  sideGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  gridWidth: number,
  gridHeight: number,
) {
  const borderColor = "black";
  const gridLineColor = "gray";
  const gridLineDash = "3,3";

  const rowSpacing = gridHeight / sideSectionConfig.rows;
  const columnSpacing = gridWidth / sideSectionConfig.columns;

  // Draw border rectangle
  sideGroup
    .append("rect")
    .attr("class", "side-section-border")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", gridWidth)
    .attr("height", gridHeight)
    .attr("fill", "none")
    .attr("stroke", borderColor);

  // Dash lines for rows and columns
  for (let r = 1; r < sideSectionConfig.rows; r++) {
    sideGroup
      .append("line")
      .attr("x1", 0)
      .attr("y1", rowSpacing * r)
      .attr("x2", gridWidth)
      .attr("y2", rowSpacing * r)
      .attr("stroke", gridLineColor)
      .attr("stroke-dasharray", gridLineDash);
  }
  for (let c = 1; c < sideSectionConfig.columns; c++) {
    sideGroup
      .append("line")
      .attr("x1", columnSpacing * c)
      .attr("y1", 0)
      .attr("x2", columnSpacing * c)
      .attr("y2", gridHeight)
      .attr("stroke", gridLineColor)
      .attr("stroke-dasharray", gridLineDash);
  }
}

// todo: add option to place side section on left or right of main graph
// todo: fix click/pinned tooltips on side section, they currently can't be pinned

import * as d3 from "d3";
import { Color, Status, ValidURL } from "./miscTypes";
import { TimeWindowCollection } from "./timeWindows";
import { ChartConfig } from "./config";
import { DataPoint, DataPointCollection } from "./dataPoints";
import { TooltipManager } from "./tooltips";
import { drawSideSection, updatedSVGWidth } from "./sideSection";

const { dimensions, styles, dataPoints } = ChartConfig;

async function initializeData(dataPath: ValidURL, timeWindowsPath: ValidURL) {
  const dataCollection = await DataPointCollection.fromJSON(dataPath);
  const data = dataCollection?.getDataPoints() || [];
  const windowCollection = timeWindowsPath
    ? await TimeWindowCollection.fromJSON(timeWindowsPath)
    : null;
  return { data, windowCollection };
}

function createScales(timelineData: DataPoint[], data: DataPoint[]) {
  // Create date values array for time scale domain
  const dateValues = timelineData.map((d) => new Date(d.checkin_timestamp));

  // Time scale for x-axis
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(dateValues) as [Date, Date])
    .range([
      dimensions.margin.left,
      dimensions.fullWidth - dimensions.margin.right,
    ]);

  // Linear scale for y-axis
  // Adding 10% padding to max value for better visualization
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.global_position)! * 1.1])
    .range([
      dimensions.height - dimensions.margin.bottom,
      dimensions.margin.top,
    ]);

  return { xScale, yScale };
}

function addAxisLabels(
  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
) {
  // Add x-axis label
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("x", dimensions.fullWidth / 2)
    .attr("y", dimensions.height - dimensions.margin.bottom + 35)
    .style("font-family", styles.font.family)
    .style("font-size", ChartConfig.text.axes.x.fontSize)
    .text(ChartConfig.text.axes.x.label);

  // Add y-axis label
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -(dimensions.height / 2))
    .attr("y", dimensions.margin.left - 40)
    .style("font-family", styles.font.family)
    .style("font-size", ChartConfig.text.axes.y.fontSize)
    .text(ChartConfig.text.axes.y.label);
}

function createAxes(
  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
  xScale: d3.ScaleTime<number, number>,
  yScale: d3.ScaleLinear<number, number>,
) {
  // Create and configure x-axis
  const xAxis = d3
    .axisBottom<Date>(xScale)
    .ticks(d3.timeMinute.every(ChartConfig.axis.ticks.x.interval))
    .tickFormat(d3.timeFormat(ChartConfig.axis.ticks.x.format));

  // Create and configure y-axis
  const yAxis = d3.axisLeft(yScale).ticks(ChartConfig.axis.ticks.y.interval);

  // Render x-axis
  svg
    .append("g")
    .attr("class", "x-axis")
    .attr(
      "transform",
      `translate(0, ${dimensions.height - dimensions.margin.bottom})`,
    )
    .call(xAxis)
    .style("font-family", styles.font.family);

  // Render y-axis
  svg
    .append("g")
    .attr("transform", `translate(${dimensions.margin.left}, 0)`)
    .call(yAxis)
    .style("font-family", styles.font.family);
}

export function getStatusColor(d: DataPoint): Color {
  const status = d.status;
  const is_la = d.lab_section == 6;

  if (is_la) {
    return Color.Gray;
  }

  switch (status) {
    case Status.OnTime:
      return Color.Green;
    case Status.OnTimeOverride:
      return Color.DarkGreen;
    case Status.Late:
      return Color.Yellow;
    case Status.Absent:
      return Color.Red;
    default:
      return Color.Gray;
  }
}

export async function createChart(
  dataPath: ValidURL,
  timeWindowsPath: ValidURL,
) {
  // Grab data
  // todo: prevent large data structures like this
  const { data, windowCollection } = await initializeData(
    dataPath,
    timeWindowsPath,
  );

  // Create container with horizontal scroll
  const container = d3
    .select<HTMLDivElement, unknown>("#chart")
    .style("width", `${dimensions.visibleWidth}px`)
    .style("overflow-x", "auto")
    .style("overflow-y", "hidden");

  // Update the SVG width to accommodate side section section
  const svg = container
    .append("svg")
    .attr("width", updatedSVGWidth())
    .attr("height", dimensions.height);

  // Setup tooltips
  const tooltipManager = new TooltipManager("#chart");

  // todo: further filter both data sets to remove staff members
  const timelineData = data.filter((d) => d.status !== Status.Absent);
  const absentData = data.filter((d) => d.status === Status.Absent);

  // Create scales
  const { xScale, yScale } = createScales(timelineData, data);

  // Create buttons in the separate container
  const buttonContainer = d3
    .select("#button-container")
    .style("margin-bottom", "12px");

  if (timeWindowsPath) {
    // Create buttons for each time section
    windowCollection?.createWindowButtons(buttonContainer, xScale, container);

    // Draw color in each time section
    windowCollection?.drawWindows(svg, xScale);
  }

  // Add "Jump to Latest" button
  buttonContainer
    .append("button")
    .style("margin-right", "8px")
    .style("cursor", "pointer")
    .text("Jump to Latest")
    .on("click", () => {
      // Get the last data point's timestamp
      const lastDataPoint = timelineData[timelineData.length - 1];
      const lastX = xScale(lastDataPoint.checkin_timestamp);
      // Center the view on this point
      const scrollTo = lastX - dimensions.visibleWidth / 2;
      container.node()?.scrollTo({ left: scrollTo, behavior: "smooth" });
    });

  // Line generator
  const line = d3
    .line<DataPoint>()
    .x((d) => xScale(d.checkin_timestamp))
    .y((d) => yScale(d.global_position));

  // Area generator for color under the curve
  const area = d3
    .area<DataPoint>()
    .x((d) => xScale(d.checkin_timestamp))
    .y0(yScale(0))
    .y1((d) => yScale(d.global_position));

  // Draw the filled area
  svg
    .append("path")
    .datum(timelineData)
    .attr("d", area)
    .attr("fill", "rgba(74, 144, 226, 0.2)") // todo: set as a configchart var
    .attr("stroke", "none");

  // Draw line
  svg
    .append("path")
    .datum(timelineData)
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", styles.lineColor)
    .attr("stroke-width", styles.lineWidth)
    .attr("stroke-linecap", "round");

  // Add main data points
  svg
    .selectAll(".timeline-dot")
    .data(timelineData)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("r", dataPoints.radius.default)
    .attr("fill", (d) => getStatusColor(d))
    .attr("cx", (d) => {
      return xScale(d.checkin_timestamp);
    })
    .attr("cy", (d) => {
      return yScale(d.global_position);
    })
    .on("mouseover", function (this: SVGCircleElement, event, d) {
      // Only enlarge if not pinned
      const pinnedElem = tooltipManager.getPinnedElement().element?.node();
      if (pinnedElem !== this) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", dataPoints.radius.hover);
      }
      tooltipManager.showHover(d, event.pageX + 10, event.pageY - 28);
    })
    .on("mouseout", function (this: SVGCircleElement) {
      // If pinned, keep radius; otherwise revert
      const pinnedElem = tooltipManager.getPinnedElement().element?.node();
      if (pinnedElem !== this) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", dataPoints.radius.default);
      }
      tooltipManager.hideHover();
    })
    .on("click", function (this: SVGCircleElement, event, d) {
      const index = data.indexOf(d);

      // make note that this data point is pinned
      tooltipManager.pinDataPoint(
        index,
        data,
        timelineData,
        xScale,
        yScale,
        svg,
        container,
        dimensions,
      );
      event.stopPropagation();
    });

  // Add side section data points separately
  drawSideSection(svg, absentData, tooltipManager);

  // Add axes and their labels
  createAxes(svg, xScale, yScale);
  addAxisLabels(svg);

  // Title
  svg
    .append("text")
    .attr("x", dimensions.fullWidth / 2)
    .attr("y", dimensions.margin.top)
    .attr("text-anchor", "middle")
    .style("font-size", ChartConfig.text.title.fontSize)
    .style("font-family", styles.font.family)
    .style("font-weight", ChartConfig.text.title.fontWeight)
    .text(ChartConfig.text.title.content);

  tooltipManager.attachKeyListeners(
    data,
    timelineData,
    xScale,
    yScale,
    svg,
    container,
    dimensions,
  );
}

// Type declaration for TypeScript
declare global {
  interface Window {
    createChart: typeof createChart;
  }
}

// Make function globally available
window.createChart = createChart;

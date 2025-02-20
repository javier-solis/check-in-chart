import * as d3 from "d3";
import { DataPoint } from "./dataPoints";
import { ChartConfig } from "./config";

type PinnedIndex = number | null;

/**
 * Manages the pinned-element state: current pinned index, previous pinned index.
 */
class PinnedStateManager {
  private currentPinnedIndex: PinnedIndex = null;
  private previousPinnedIndex: PinnedIndex = null;

  public getCurrentIndex(): PinnedIndex {
    return this.currentPinnedIndex;
  }

  public getPreviousPinnedIndex(): PinnedIndex {
    return this.previousPinnedIndex;
  }

  public setCurrentIndex(index: PinnedIndex): void {
    this.currentPinnedIndex = index;
  }

  public setPreviousPinnedIndex(index: PinnedIndex): void {
    this.previousPinnedIndex = index;
  }

  public reset(): void {
    this.currentPinnedIndex = null;
  }
}

// todo: add a method for data point radius enlargment (and setting back to regular)
export class TooltipManager {
  // todo: remove any type
  private tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
  private pinnedTooltip: d3.Selection<
    HTMLDivElement,
    unknown,
    HTMLElement,
    any
  >;
  private pinnedElement: d3.Selection<
    SVGCircleElement,
    DataPoint,
    any,
    any
  > | null = null;
  pinnedStateManager: PinnedStateManager;

  constructor(containerId: string) {
    this.tooltip = this.createTooltip(containerId);
    this.pinnedTooltip = this.createTooltip(containerId);
    this.pinnedStateManager = new PinnedStateManager();

    document.addEventListener("click", this.handleClick);
    // todo: add keydown event handler here?
  }

  public attachKeyListeners(
    data: DataPoint[],
    filteredData: DataPoint[],
    xScale: d3.ScaleTime<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    container: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>,
    dimensions: typeof ChartConfig.dimensions,
  ): void {
    document.addEventListener("keydown", (event) => {
      this.handleKeyDown(
        event,
        data,
        filteredData,
        xScale,
        yScale,
        svg,
        container,
        dimensions,
      );
    });
  }

  // todo: make this function cleaner
  public pinDataPoint(
    index: number,
    data: DataPoint[],
    filteredData: DataPoint[],
    xScale: d3.ScaleTime<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    container: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>,
    dimensions: typeof ChartConfig.dimensions,
  ): void {
    if (index < 0 || index >= filteredData.length) return;

    const d = filteredData[index];

    // Select the circle
    const circleNode = d3
      .selectAll<SVGCircleElement, DataPoint>(".dot")
      .nodes()[index];

    // Pin the element via tooltip manager
    this.setPinnedElement(d3.select(circleNode), index);

    // Get absolute position for tooltip
    const svgRect = svg.node()?.getBoundingClientRect();
    const xPos = (svgRect?.left ?? 0) + xScale(d.checkin_timestamp);
    const yPos = (svgRect?.top ?? 0) + yScale(d.global_position);

    // Display pinned tooltip
    this.showPinned(d, xPos + 10, yPos - 28);
  }

  private handleKeyDown(
    event: KeyboardEvent,
    data: DataPoint[],
    filteredData: DataPoint[],
    xScale: d3.ScaleTime<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    container: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>,
    dimensions: typeof ChartConfig.dimensions,
  ): void {
    if (event.key === "Escape") {
      this.hidePinned();
      this.hideHover();
      this.pinnedStateManager.setPreviousPinnedIndex(
        this.pinnedStateManager.getCurrentIndex() ?? -1,
      );
      this.resetPinnedElement();
    }

    // Bracket keys
    if (event.key !== "[" && event.key !== "]") return;

    let newIndex: number;
    const currentIndex = this.pinnedStateManager.getCurrentIndex();
    const previousPinnedIndex =
      this.pinnedStateManager.getPreviousPinnedIndex();

    if (currentIndex === null && previousPinnedIndex === null) {
      newIndex = 0;
    } else {
      const referenceIndex = currentIndex ?? previousPinnedIndex ?? 0;
      newIndex = referenceIndex + (event.key === "[" ? -1 : 1);
    }

    // Call the new pinDataPoint method
    this.pinDataPoint(
      newIndex,
      data,
      filteredData,
      xScale,
      yScale,
      svg,
      container,
      dimensions,
    );

    // ALT + bracket => scroll container
    if (event.altKey && newIndex >= 0 && newIndex < filteredData.length) {
      const point = filteredData[newIndex];
      const pointX = xScale(point.checkin_timestamp);
      const scrollTo = pointX - dimensions.visibleWidth / 2;
      container.node()?.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  }

  private createTooltip(
    containerId: string,
  ): d3.Selection<HTMLDivElement, unknown, HTMLElement, any> {
    return d3
      .select(containerId)
      .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", ChartConfig.styles.backgroundColor)
      .style("border", ChartConfig.tooltipConfig.border)
      .style("padding", ChartConfig.tooltipConfig.padding)
      .style("border-radius", ChartConfig.tooltipConfig.borderRadius)
      .style("font-size", ChartConfig.tooltipConfig.fontSize)
      .style("font-family", ChartConfig.styles.font.family);
  }

  public showHover(dataPoint: DataPoint, x: number, y: number): void {
    if (!this.isPinned()) {
      this.tooltip
        .style("visibility", "visible")
        .html(this.getTooltipContent(dataPoint))
        .style("left", `${x}px`)
        .style("top", `${y}px`);
    }
  }

  public hideHover(): void {
    this.tooltip.style("visibility", "hidden");
  }

  public showPinned(dataPoint: DataPoint, x: number, y: number): void {
    this.pinnedTooltip
      .style("visibility", "visible")
      .html(this.getTooltipContent(dataPoint))
      .style("left", `${x + ChartConfig.tooltipConfig.offset.x}px`)
      .style("top", `${y + ChartConfig.tooltipConfig.offset.y}px`);
  }

  public hidePinned(): void {
    this.pinnedTooltip.style("visibility", "hidden");
  }

  public isPinned(): boolean {
    return this.pinnedTooltip.style("visibility") === "visible";
  }

  public setPinnedElement(
    element: d3.Selection<SVGCircleElement, DataPoint, any, any>,
    index: number,
  ): void {
    this.hideHover();
    element.raise();
    if (this.pinnedElement) {
      this.pinnedElement.interrupt();
    }
    this.resetPinnedElement();
    this.pinnedElement = element;
    this.pinnedElement
      .interrupt()
      .attr("r", ChartConfig.dataPoints.radius.hover);
    this.pinnedStateManager.setCurrentIndex(index);
  }

  public resetPinnedElement(): void {
    if (this.pinnedElement) {
      this.pinnedElement
        .transition()
        .duration(150)
        .attr("r", ChartConfig.dataPoints.radius.default);
      this.pinnedElement = null;
      this.pinnedStateManager.reset();
    }
  }

  public getPinnedElement() {
    return {
      element: this.pinnedElement,
      index: this.pinnedStateManager.getCurrentIndex(),
    };
  }

  private getTooltipContent(d: DataPoint): string {
    const container = d3
      .create("div")
      .style("display", "grid")
      .style("grid-template-columns", "auto 1fr")
      .style("gap", "4px 16px");

    const rows: Array<[string, string]> = [
      ["Kerberos:", d.kerberos],
      ["Lab Section:", String(d.lab_section)],
      [
        "Check-in Time:",
        d.checkin_timestamp
          ? d3.timeFormat("%b %d, %Y %H:%M")(d.checkin_timestamp)
          : "N/A",
      ],
      ["Status:", d.status],
      ["Global Position:", String(d.global_position)],
      ["Local Position:", d.local_position ? String(d.local_position) : "N/A"],
    ];

    rows.forEach(([label, value]) => {
      container.append("div").attr("class", "label").text(label);
      container.append("div").attr("class", "value").text(value);
    });

    return container.node()?.outerHTML ?? "";
  }

  private handleClick = (event: MouseEvent) => {
    if (!(event.target as Element).closest(".dot")) {
      this.hidePinned();
      this.hideHover();

      if (this.pinnedElement) {
        this.pinnedElement
          .transition()
          .duration(150)
          .attr("r", ChartConfig.dataPoints.radius.default);

        const currentIndex = this.pinnedStateManager.getCurrentIndex();
        this.pinnedStateManager.setPreviousPinnedIndex(currentIndex ?? -1);

        this.pinnedElement = null;
        this.pinnedStateManager.reset();
      }
    }
  };
}

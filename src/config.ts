export const ChartConfig = {
  dimensions: {
    fullWidth: 200000,
    visibleWidth: 1000,
    height: 500,
    margin: { top: 40, right: 30, bottom: 40, left: 50 },
  },

  styles: {
    backgroundColor: "#f8f9fa",
    lineColor: "#4a90e2",
    lineWidth: 2.5,
    areaFillColor: "rgba(74, 144, 226, 0.2)",
    font: {
      family: "sans-serif",
      sizes: {
        title: "16px",
        axis: "12px",
      },
    },
  },

  dataPoints: {
    radius: {
      default: 6,
      hover: 10,
      pinned: 10, // todo: make use of this variable
    },
    colors: {
      default: "green",
      highlight: "red",
    },
  },

  // todo: make this its own variable?
  // Tooltip configuration
  tooltipConfig: {
    padding: "5px",
    border: "1px solid #4a90e2",
    borderRadius: "4px",
    fontSize: "12px",
    offset: {
      x: 10,
      y: -28,
    },
  },

  axis: {
    ticks: {
      x: {
        interval: 1, // Show tick every X min
        format: "%H:%M", // 24hr time format
      },
      y: {
        interval: 5, // might need a better name?
      },
    },
  },

  text: {
    title: {
      content: "Attendance Count Over Time",
      fontSize: "16px",
      fontWeight: "bold",
    },
    axes: {
      x: {
        label: "Time",
        fontSize: "12px",
      },
      y: {
        label: "Attendance Count",
        fontSize: "12px",
      },
    },
  },
};

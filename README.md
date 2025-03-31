# check-in-chart

[![logo](/public/assets/logo_v1.svg)](https://github.com/javier-solis/check-in-chart)

A single-page application for visualizing student check-in data. Built with [D3.js](https://d3js.org/) to provide an intuitive and informative interface. Created and maintained for internal use at [MIT 6.190](https://llp.mit.edu/6190/).

## Usage

### Install
```sh
npm i
```

### Quick Start
1. Update the URLs in `public/index.html` to point to your JSON sources
2. Build and serve the production page: `npm run build:prod && npm run serve:prod`
3. Visit: [http://localhost:3000/public/index.html](http://localhost:3000/public/index.html)

### Integrate with Existing Project
1. Build the production `js` bundle:
```sh
npm run build:prod
```

2. Add required HTML elements to your HTML file:
```html
<div id="chart"></div>
<div id="button-container"></div>
```

3. Import the built files, updating source path as needed:
```html
<script type="module" src="/check_in_graphs.js"></script>

<link rel="stylesheet" href="/check_in_graphs.css"> <!-- custom css is optional -->
```

4. Initialize the graph inside a script in your HTML file. Must be placed after your DOM elements and script imports, like so:
```html
<script>
  // Declare URLs as string variables
  mainDataJsonPath = "http://localhost/path/to/main_data.json";
  labSectionsJsonPath = "http://localhost/path/to/lab_sections.json";
  
  window.addEventListener('DOMContentLoaded', () => {
    createGraph(dataJsonPath, labSectionsJsonPath); // labSectionJsonPath is optional
  });
</script>
```

### Security Considerations
- Restrict access to JSON files as they may contain sensitive information
- Implement proper authentication for production deployments

## Development
1. Run: `npm run dev`
2. Visit: [http://localhost:3000/public/index.html](http://localhost:3000/public/index.html)

## License
`Apache 2.0`

For more information see [LICENSE](LICENSE).
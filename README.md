# check-in-chart

A D3.js visualization tool for student check-in data, created and maintained for internal use at [MIT 6.190](https://llp.mit.edu/6190/).

## Usage

### Install
```sh
npm i
```

### Quick Start with `index.html`
1. Update the URLs in `public/index.html` to point to your JSON sources
2. Serve the production page using:
```sh
npm run build:prod && npm run serve
```

### Integration with Existing Projects
1. Build the production `js` bundle:
```sh
npm run build:prod
```

2. Add required HTML elements to your HTML file:
```html
<div id="chart"></div>
<div id="button-container"></div>
```

3. Import the built files:
```html
<script type="module" src="/path/to/check_in_graphs.js"></script>

<link rel="stylesheet" href="/path/to/check_in_graphs.css"> <!-- custom css is optional -->
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
2. Open: [http://localhost:3000/public/index.html](http://localhost:3000/public/index.html)

## License
`Apache 2.0`

For more information see [LICENSE](LICENSE).
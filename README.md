# 3D Interactive Earth – Country Search & Visualisation

An interactive **Three.js WebGL globe** that display the Earth in three-dimensions (3D), enabling users to rotate, zoom, hover, click, and search for countries. The project illustrates the use of 3D visualisation, geographic data processing, interactive features, and responsive design.

This application was created as part of a university coursework assignment.

---

# Features

*  Realistic 3D Earth with textures, clouds, and star background
*  Country borders rendered from TopoJSON data
*  Dynamic country labels using Troika 3D text
*  Country search with highlighting and information display
*  Hover and click interaction using raycasting
*  Fully responsive (desktop, tablet, mobile)
*  Keyboard-accessible search input

---

# Technologies Used

* **Three.js** – 3D rendering
* **OrbitControls** – camera interaction
* **TopoJSON / GeoJSON** – country boundary data
* **Troika Three Text** – GPU-accelerated text rendering
* **JavaScript (ES6 Modules)**
* **HTML5 & CSS3**

---

# Project Structure

```
├── 3D-Interactive-Earth
   ├── index.html            # Main HTML entry point
   ├── assets
   |   ├── data
   |   |   ├── world-topo-min.json  # TopoJSON world map data
   |   |
   |   ├── textures          # Earth, cloud, and star textures
   |    
   ├── node_modules
   |
   ├── src
   |   ├── client.js           # Three.js scene logic and interaction
   |   ├── countryInfo.js      # External country data fetcher
   |   ├── nameFix.js          # Maps API country names to standardised names
   |   ├── style.css           # Layout and responsive styling
   |
   ├──  package.json         
   ├──  package-lock.json
   ├──  server.js          
   ├── README.md           # Project documentation
```

---

# Starting Point

## Documentation
- [User Guide (PDF)](USER_GUIDE.pdf)
- README.md - Technical documentation

## Prerequisites

* A modern web browser (Chrome, Firefox, Edge)
* Local web server (required for ES modules)

## Run the project locally

You **must** serve the files using a local server.

#### Option A: VS Code

1. Go to **terminal**
2. Click **New terminal**
3. Type **npm run dev**

#### Option B: Command prompt

1. Navigate to root path **C:\project\3D-Interactive-Earth**
2. Type **npm run dev**
```

Then open:

```
http://localhost:5173

---

# How to Use

* **Rotate Globe**: Click and drag
* **Zoom**: Scroll mouse (desktop) or pinch (mobile)
* **Hover**: Highlight countries
* **Click Country**: View country information
* **Search**: Enter a country name and press Enter or click Search
* **ESC or Close Icon**: To close the information panel

---

# Responsive Design

The application is fully responsive:

* WebGL canvas resizes dynamically
* Camera aspect ratio updates on window resize
* UI adapts using CSS media queries
* Touch, mouse, and keyboard input supported
* Performance optimised for mobile devices

---

# Design Decisions

* **TopoJSON** was used to reduce file size and improve performance
* **Raycasting** enables accurate hover and click detection
* **Troika Text** ensures crisp labels that always face the camera
* **Pointer Events** unify mouse and touch interaction
* Camera movement limits prevent disorientation

---

# Known Limitations

* Country centroids are calculated using simple averaging
* Borders are rendered as line loops
* Requires internet access for external country data API

---

# Possible Improvements

* Autocomplete search suggestions
* Data-driven colouring (population, GDP, etc.)
* Animated camera transitions toggle
* Improved centroid calculation

---

# License

This project is for **educational purpose only**.

---

# Author

**Mama Djalo**
**23010394**
**Web Innovation**
**Liverpool Hope University**
University Coursework Project

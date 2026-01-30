import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Text } from 'troika-three-text';
import * as topojson from 'topojson-client';
import { getCountryInfo } from "./countryInfo.js";


let scene, camera, renderer;
const canvas = document.querySelector('.webgl');

// Create scene
scene = new THREE.Scene();

//Camera setup
const fov = 60;
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 1000;

camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(0, 0, 2); // Zoom the camera out to reveal Earth
scene.add(camera);

// WebGL renderer
renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, antialias : true 
});

// Make renderer & camera responsive
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});


// Earth geometry
const earthGeometry = new THREE.SphereGeometry(0.6, 24, 24);


// Clouds geometry
const cloudGeometry = new THREE.SphereGeometry(0.63, 24, 24);

//star background sphere
const starGeometry = new THREE.SphereGeometry(80, 64, 64);

// Store country centroids for searching/zooming
const countryCentroids = {};

// Load TopoJSON world map
const loader = new THREE.FileLoader();
loader.load("./assets/data/world-topo-min.json", (data) => {
	const world = JSON.parse(data);

	// Convert topoJSON to geoJSON features
	const countries = topojson.feature(world, world.objects.countries);
	console.log("Countries loaded: ", countries.features.length);

    // Build map borders and labels
	buildCountryMeshes(countries);
});

// Convert latitude/longitude to 3D point
function latLonToVector3(lat, lon, radius) {
	const phi = (90 - lat) * (Math.PI / 180);
	const theta = (lon + 180) * (Math.PI / 180);
	return new THREE.Vector3(
		-radius * Math.sin(phi) * Math.cos(theta),
		radius * Math.cos(phi),
		radius * Math.sin(phi) * Math.sin(theta),
	);
}

const countryLabels = [];

// Create floating text labels above countries
function createCountryLabel(name, lat, lon) {
    const text = new Text();

    text.text = name;
    text.fontSize = 0.01; // small but readable
    text.color = 0xffffff;
    text.outlineWidth = 0.0015;
    text.outlineColor = 0x000000;
    text.anchorX = "center";
    text.anchorY = "middle";

    // Convert lat/lon to 3D position above Earth
    const pos = latLonToVector3(lat, lon, 0.65);
    text.position.copy(pos);

    // Label face camera
    text.lookAt(camera.position); 
    
    earthMesh.add(text);
    countryLabels.push(text);

    //Require for troika text
    text.sync();
    
    return text;
}

// Store for raycasting and hover effects
const countryMeshes = [];

//Build country borders and labels
function buildCountryMeshes(geojson) {
    geojson.features.forEach(feature => {
        if (!feature.geometry) return;

        const coords = feature.geometry.coordinates;
        const type = feature.geometry.type;

        let polygons = [];

        //Standardize polygon format
        if (type === "Polygon") {
            polygons = [coords];
        } else if (type === "MultiPolygon") {
            polygons = coords;
        }

        polygons.forEach(poly => {

            //Outer boundary of polygon
            const shape = poly[0];

            // Convert polygon to 3D border point
            const points = shape.map(([lon, lat]) => {
                return latLonToVector3(lat, lon, 0.602);
            });

            // Turn polygon into line loop
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.LineLoop(
                geometry,
                new THREE.LineBasicMaterial({
                    color: 0xffffff,
                    linewidth: 1
                })
            );

            // Save country name for raycasting
            line.userData.country = feature.properties.name;

            // Add for raycasting
            countryMeshes.push(line);

// Compute centroid of polygon
const centroid = poly[0].reduce(
    (acc, [lon, lat]) => ({ 
        lat: acc.lat + lat, 
        lon: acc.lon + lon 
    }),
    { lat: 0, lon: 0 }

);

centroid.lat /= poly[0].length;
centroid.lon /= poly[0].length;

// store centroid for searching via input
countryCentroids[feature.properties.name] = {
    lat: centroid.lat,
    lon: centroid.lon,
    lower: feature.properties.name.toLowerCase().replace(/\s+/g,'')
};

// Create text label once per country
if (!feature._labelCreated) {
    createCountryLabel(feature.properties.name, centroid.lat, centroid.lon);
    feature._labelCreated = true;
}

            // Add border line to Earth
            earthMesh.add(line);
        });
    });

    console.log("Borders added:", countryMeshes.length);
}

// Raycaster for hover and click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let lastHovered = null;

// Mouse move to highlight country
window.addEventListener("pointermove", onMove);

// Click to show country info
window.addEventListener("click", onClick);


function onMove(e) {
	mouse.x = (e.clientX / window.innerWidth) * 2 -1;
	mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
	
	raycaster.setFromCamera(mouse, camera);

	const hit = raycaster.intersectObjects(countryMeshes);

    // Reset previous hover
	if (lastHovered && (!hit.length || hit[0].object !== lastHovered)){
		lastHovered.material.color.set(0xffffff); //Reset
		lastHovered = null;
	}

    // Highlight new hovered country
	if (hit.length) {
		const obj = hit[0].object;
		obj.material.color.set(0x39ff14); // Neon green highlight
		lastHovered = obj;
	}

}

// Handle clicking a country
async function onClick() {
    raycaster.setFromCamera(mouse, camera);

    // Check click hits the Earth first
    const hitsOnEarth = raycaster.intersectObject(earthMesh);
    if (!hitsOnEarth.length) return;

    // Then detect country borders
    const hit = raycaster.intersectObjects(countryMeshes);
    if (!hit.length) return;

    const intersect = hit[0];

    if (intersect.object.type !== "LineLoop") return;

    const name = intersect.object.userData.country;

    // Fetch external info
    const info = await getCountryInfo(name);
    if (!info) {
       showMessage("Country not found", "error");

        return;
    }

    // Display info popup
    showCountryInfo(info);
}

// Renderer setup
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.autoClear = true;
renderer.setClearColor(0x000000, 0.0);

//Orbit controls for interactive rotation
const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.minDistance = 0.8;
controls.maxDistance = 3;

// Load textures
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load('assets/textures/2k_earth_daymap.jpg');
const bumpTexture = textureLoader.load('assets/textures/2k_earth_normal_map.jpg');
const specularTexture = textureLoader.load('assets/textures/2k_earth_specular_map.jpg');
const cloudTexture = textureLoader.load('assets/textures/2k_earth_clouds.jpg');
const starTexture = textureLoader.load('assets/textures/2k_stars.jpg');

// Earth material with bump and specular maps
const earthMaterial = new THREE.MeshPhongMaterial({
    map: earthTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.1,
    specularMap: specularTexture,
    specular: new THREE.Color(0x333333),
    shininess: 10
});

// Transparent cloud layer
const cloudMaterial = new THREE.MeshPhongMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
});

// Star background sphere
const starMaterial = new THREE.MeshBasicMaterial({
	map: starTexture,
	side: THREE.BackSide
});


// Meshes creation
const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earthMesh);

const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
	scene.add(cloudMesh);

const starMesh = new THREE.Mesh(starGeometry, starMaterial);
	scene.add(starMesh);

    console.log("Centroids", countryCentroids);


// lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(5, 3, 5);
scene.add(sunLight);

// Animation loop
const animate = () => {
    requestAnimationFrame(animate);
    earthMesh.rotation.y -= 0.0015;
    cloudMesh.rotation.y -= 0.001;
    starMesh.rotation.y -= 0.002;

  const scale = window.innerWidth < 600 ? 1.6 : 1;

  countryLabels.forEach(label => {
      label.fontSize = 0.01 * scale;
      label.lookAt(camera.position);
  });


    controls.update();
    render();
}

// Render function
const render = () => {

renderer.render(scene, camera);
}

animate();

// Smooth camera travel to a country
function goToCountry(name, duration = 1.8, holdTime = 10000) {
    const { lat, lon } = countryCentroids[name];

    // Target camera position near country's location
    const targetPos = latLonToVector3(lat, lon, 1.0);
    const startPos = camera.position.clone();
    const endPos = targetPos;

    let t = 0;

    const animateMove = (onComplete) => {
        t += 0.02;
        const k = t / duration;

        // Smooth easing cubic
        const ease = k < 1 ? 1 - Math.pow(1 - k, 3) : 1;

        camera.position.lerpVectors(startPos, endPos, ease);
        camera.lookAt(earthMesh.position);

        if (ease < 1) {
            requestAnimationFrame(() => animateMove(onComplete));
        } else if (onComplete) {
            onComplete();
        }
    };

    // 
    animateMove(() => {
        setTimeout(() => {
            let tBack = 0;
            const animateBack = () => {
                tBack += 0.02;
                const kBack = tBack / duration;
                const easeBack = kBack < 1 ? 1 - Math.pow(1 - kBack, 3) : 1;

                camera.position.lerpVectors(endPos, startPos, easeBack);
                camera.lookAt(earthMesh.position);

                if (easeBack < 1) {
                    requestAnimationFrame(animateBack);
                }
            };
            animateBack();
        }, holdTime);
     });
}

function highlightCountry(name) {

    //Reset all country
    countryMeshes.forEach(mesh => {
        mesh.material.color.set(0xffffff); //default color white
    });

    //find country mesh
    const countryMesh = countryMeshes.find(mesh => mesh.userData.country === name);

    if (countryMesh) {
        countryMesh.material.color.set(0x39ff14);
    }
}


const searchInput = document.getElementById("countrySearch");
const searchButton = document.getElementById("searchButton");
const searchMessage = document.getElementById("searchMessage");

// Show errors message or info
function showMessage(text, type = "error") {
  searchMessage.textContent = text;
  searchMessage.className = type;
  searchMessage.classList.remove("hidden");

  setTimeout(() => {
    searchMessage.classList.add("hidden");
  }, 3000);
}

// Info panel elements
const infoPanel = document.getElementById("infoPanel");
const closeInfo = document.getElementById("closeInfo");

const infoName = document.getElementById("infoName");
const infoFlag = document.getElementById("infoFlag");
const infoPopulation = document.getElementById("infoPopulation");
const infoArea = document.getElementById("infoArea");
const infoGDP = document.getElementById("infoGDP");

// Close panel
closeInfo.addEventListener("click", () => {
  infoPanel.classList.add("hidden");
});

// Show country info
function showCountryInfo(info) {
  infoName.textContent = info.name;
  infoFlag.src = `https://flagcdn.com/w80/${info.code.toLowerCase()}.png`;
  infoFlag.alt = `${info.name} flag`;
  infoPopulation.textContent = info.population;
  infoArea.textContent = info.area;
  infoGDP.textContent = info.gdp;

  infoPanel.classList.remove("hidden");
}


//Search action
async function runSearch(params) {
    const query = searchInput.value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '');

    if (!query) {
        showMessage("Please enter a country name", "error");
        return;
    }

    //Get country from countryCentroids object
    const found = Object.entries(countryCentroids).find(
        ([name, data]) => data.lower === query
    );

        if(!found) {
            showMessage("Country not found", "error");
            return;
        }

        const [name, data] = found;

        //API fetch function
        const info = await getCountryInfo(name);
        if (!info) {
            showMessage("Country not found", "error");

            return;
        }

        showCountryInfo(info);


        //Highlight the country
        highlightCountry(name);
   
        //Face camera to country
        //goToCountry(name, 1.8, 3000);      
}

//Click button to search
searchButton.addEventListener("click", runSearch);

//Press enter to search
searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runSearch();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    infoPanel.classList.add("hidden");
  }
});



// Main Three.js variables
let scene, camera, renderer, controls;
let planets = [];
let stars = [];
let isPaused = false;
let darkMode = false;
let clock = new THREE.Clock();
let originalCameraPosition;

// Planet data with realistic relative speeds
const planetData = [
    { name: 'Mercury', color: 0x8B8B8B, size: 0.4, orbitRadius: 5, speed: 4 },
    { name: 'Venus', color: 0xE6C229, size: 0.6, orbitRadius: 7, speed: 1.6 },
    { name: 'Earth', color: 0x6B93D6, size: 0.6, orbitRadius: 9, speed: 1 },
    { name: 'Mars', color: 0x993D00, size: 0.5, orbitRadius: 11, speed: 0.5 },
    { name: 'Jupiter', color: 0xB07F35, size: 1.2, orbitRadius: 14, speed: 0.08 },
    { name: 'Saturn', color: 0xE5DCDC, size: 1.0, orbitRadius: 17, speed: 0.03, hasRing: true },
    { name: 'Uranus', color: 0xD1E7E7, size: 0.8, orbitRadius: 20, speed: 0.01 },
    { name: 'Neptune', color: 0x3E66F9, size: 0.8, orbitRadius: 23, speed: 0.006 }
];

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 30);
    originalCameraPosition = camera.position.clone();
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    
    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);
    
    // Create the Sun
    const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 1
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    
    // Create planets
    planetData.forEach((data, index) => {
        createPlanet(data, index);
    });
    
    // Create stars background
    createStars();
    
    // Add event listeners
    setupEventListeners();
    
    // Start animation loop
    animate();
}

// Create a planet with its orbit
function createPlanet(data, index) {
    // Planet
    const geometry = new THREE.SphereGeometry(data.size, 32, 32);
    const material = new THREE.MeshPhongMaterial({ 
        color: data.color,
        shininess: 5
    });
    const planet = new THREE.Mesh(geometry, material);
    
    // Orbit path
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];
    const orbitSegments = 64;
    
    for (let i = 0; i <= orbitSegments; i++) {
        const theta = (i / orbitSegments) * Math.PI * 2;
        orbitPoints.push(
            new THREE.Vector3(
                Math.cos(theta) * data.orbitRadius,
                0,
                Math.sin(theta) * data.orbitRadius
            )
        );
    }
    
    orbitGeometry.setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: 0x555555,
        transparent: true,
        opacity: 0.3
    });
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbit);
    
    // Position planet
    planet.position.x = data.orbitRadius;
    scene.add(planet);
    
    // Add ring for Saturn
    if (data.hasRing) {
        const ringGeometry = new THREE.RingGeometry(data.size * 1.3, data.size * 1.7, 32);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0xE5DCDC,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        planet.add(ring);
    }
    
    // Store planet data
    planets.push({
        mesh: planet,
        orbitRadius: data.orbitRadius,
        speed: data.speed,
        angle: Math.random() * Math.PI * 2,
        name: data.name
    });
}

// Create star background
function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true
    });
    
    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
}

// Setup event listeners
function setupEventListeners() {
    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Speed controls
    planetData.forEach((data, index) => {
        const slider = document.getElementById(`${data.name.toLowerCase()}-speed`);
        const valueDisplay = slider.previousElementSibling.querySelector('.speed-value');
        
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            planets[index].speed = value;
            valueDisplay.textContent = `${value.toFixed(2)}x`;
        });
    });
    
    // Pause button
    document.getElementById('pause-btn').addEventListener('click', () => {
        isPaused = !isPaused;
        document.getElementById('pause-btn').textContent = isPaused ? '▶ Resume' : '⏸ Pause';
    });
    
    // Dark mode toggle
    document.getElementById('dark-mode').addEventListener('click', () => {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode', darkMode);
        document.getElementById('dark-mode').textContent = darkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
    });
    
    // Reset view button
    document.getElementById('reset-view').addEventListener('click', () => {
        camera.position.copy(originalCameraPosition);
        controls.reset();
    });
    
    // Toggle controls visibility
    document.getElementById('toggle-controls').addEventListener('click', () => {
        const controlsPanel = document.getElementById('controls');
        controlsPanel.style.display = controlsPanel.style.display === 'none' ? 'block' : 'none';
    });
    
    // Tooltip on mouse move
    const tooltip = document.getElementById('tooltip');
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    window.addEventListener('mousemove', (event) => {
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the raycaster
        raycaster.setFromCamera(mouse, camera);
        
        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));
        
        if (intersects.length > 0) {
            const planet = planets.find(p => p.mesh === intersects[0].object);
            tooltip.textContent = planet.name;
            tooltip.style.left = `${event.clientX + 10}px`;
            tooltip.style.top = `${event.clientY + 10}px`;
            tooltip.style.opacity = '1';
        } else {
            tooltip.style.opacity = '0';
        }
    });
    
    // Auto-hide controls when mouse leaves
    const controlsPanel = document.getElementById('controls');
    let hideTimeout;
    
    controlsPanel.addEventListener('mouseenter', () => {
        clearTimeout(hideTimeout);
        controlsPanel.style.opacity = '1';
    });
    
    controlsPanel.addEventListener('mouseleave', () => {
        hideTimeout = setTimeout(() => {
            controlsPanel.style.opacity = '0.5';
        }, 2000);
    });
    
    // Initialize as semi-transparent
    controlsPanel.style.opacity = '0.5';
    controlsPanel.style.transition = 'opacity 0.3s ease';
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    if (!isPaused) {
        // Update planet positions
        planets.forEach(planet => {
            planet.angle += planet.speed * delta * 0.8;
            planet.mesh.position.x = Math.cos(planet.angle) * planet.orbitRadius;
            planet.mesh.position.z = Math.sin(planet.angle) * planet.orbitRadius;
            planet.mesh.rotation.y += delta * 0.5;
        });
    }
    
    controls.update();
    renderer.render(scene, camera);
}

// Start the application
init();
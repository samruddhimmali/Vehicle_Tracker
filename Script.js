console.log('Script loaded');
let locationData = {
    today: [ // Sangli to Kolhapur (~50 km, NH-160/NH-48)
        {lat: 16.8524, lng: 74.5817, timestamp: new Date("2025-07-14T11:00:00").getTime()},
        {lat: 16.8400, lng: 74.5700, timestamp: new Date("2025-07-14T11:05:00").getTime()},
        {lat: 16.8200, lng: 74.5500, timestamp: new Date("2025-07-14T11:10:00").getTime()},
        {lat: 16.7900, lng: 74.5200, timestamp: new Date("2025-07-14T11:20:00").getTime()},
        {lat: 16.7600, lng: 74.4900, timestamp: new Date("2025-07-14T11:30:00").getTime()},
        {lat: 16.7300, lng: 74.4600, timestamp: new Date("2025-07-14T11:40:00").getTime()},
        {lat: 16.7050, lng: 74.2433, timestamp: new Date("2025-07-14T11:50:00").getTime()}
    ],
    yesterday: [ // Sangli to Ichalkaranji (~25 km, SH-138)
        {lat: 16.8524, lng: 74.5817, timestamp: new Date("2025-07-13T11:00:00").getTime()},
        {lat: 16.8450, lng: 74.5700, timestamp: new Date("2025-07-13T11:05:00").getTime()},
        {lat: 16.8300, lng: 74.5550, timestamp: new Date("2025-07-13T11:10:00").getTime()},
        {lat: 16.8200, lng: 74.5400, timestamp: new Date("2025-07-13T11:15:00").getTime()},
        {lat: 16.8100, lng: 74.5250, timestamp: new Date("2025-07-13T11:20:00").getTime()},
        {lat: 16.6900, lng: 74.4600, timestamp: new Date("2025-07-13T11:25:00").getTime()}
    ],
    "this-week": [ // Sangli-Miraj-Vishrambag Loop (~15 km)
        {lat: 16.8524, lng: 74.5817, timestamp: new Date("2025-07-08T11:00:00").getTime()},
        {lat: 16.8400, lng: 74.5700, timestamp: new Date("2025-07-08T11:03:00").getTime()},
        {lat: 16.8450, lng: 74.5900, timestamp: new Date("2025-07-08T11:06:00").getTime()},
        {lat: 16.8600, lng: 74.5950, timestamp: new Date("2025-07-08T11:09:00").getTime()},
        {lat: 16.8650, lng: 74.5850, timestamp: new Date("2025-07-08T11:12:00").getTime()},
        {lat: 16.8524, lng: 74.5817, timestamp: new Date("2025-07-08T11:15:00").getTime()}
    ]
};
let currentData = locationData.today;
let index = 0;
let isPlaying = true;
let animationFrame;
let startTime;
let vehicleMarker;
let routePolyline;

console.log('locationData:', locationData);

// DOM elements
const positionElement = document.getElementById('position');
const elapsedTimeElement = document.getElementById('elapsed-time');
const speedElement = document.getElementById('speed');
const playPauseButton = document.getElementById('play-pause');
const resetButton = document.getElementById('reset');
const dropdownButton = document.getElementById('locationDropdown');
const dropdownItems = document.querySelectorAll('.dropdown-item');

// Initialize map
let map;
try {
    console.log('Creating map');
    map = L.map('map').setView([16.8524, 74.5817], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
} catch (error) {
    console.error('Map creation error:', error);
    positionElement.textContent = 'Error: Failed to load map';
}

// Custom vehicle icon
let vehicleIcon;
try {
    vehicleIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202003.png',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
} catch (error) {
    console.error('Icon creation error:', error);
    positionElement.textContent = 'Error: Failed to load vehicle icon';
}

// Initialize map with initial data
function initializeMap() {
    try {
        console.log('Initializing map with:', currentData[0]);
        vehicleMarker = L.marker([currentData[0].lat, currentData[0].lng], { icon: vehicleIcon }).addTo(map)
            .bindPopup('Vehicle Location');
        routePolyline = L.polyline([], { color: 'blue' }).addTo(map);
        positionElement.textContent = `Current Position: Lat ${currentData[0].lat.toFixed(4)}, Lng ${currentData[0].lng.toFixed(4)}`;
        elapsedTimeElement.textContent = 'Elapsed Time: 0s';
        speedElement.textContent = 'Speed: 0 km/h';
        map.setView([currentData[0].lat, currentData[0].lng], 10);
        map.invalidateSize();
        startTime = performance.now();
    } catch (error) {
        console.error('Map initialization error:', error);
        positionElement.textContent = 'Error: Failed to initialize map';
    }
}

// Calculate distance between two coordinates (in meters)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Reset simulation
function resetSimulation() {
    console.log('Resetting simulation');
    isPlaying = false;
    clearInterval(animationFrame);
    index = 0;
    startTime = performance.now();
    vehicleMarker.setLatLng([currentData[0].lat, currentData[0].lng]);
    routePolyline.setLatLngs([]);
    positionElement.textContent = `Current Position: Lat ${currentData[0].lat.toFixed(4)}, Lng ${currentData[0].lng.toFixed(4)}`;
    elapsedTimeElement.textContent = 'Elapsed Time: 0s';
    speedElement.textContent = 'Speed: 0 km/h';
    map.setView([currentData[0].lat, currentData[0].lng], 10);
    map.invalidateSize();
    playPauseButton.textContent = 'Play';
}

// Animation loop (simplified, no interpolation)
function animate() {
    console.log('Animating, index:', index, 'isPlaying:', isPlaying);
    if (!isPlaying || index >= currentData.length - 1) {
        console.log('Animation stopped');
        clearInterval(animationFrame);
        playPauseButton.textContent = 'Play';
        isPlaying = false;
        return;
    }
    animationFrame = setInterval(() => {
        try {
            const nextPoint = currentData[index + 1];
            vehicleMarker.setLatLng([nextPoint.lat, nextPoint.lng]);
            console.log('Moved to:', nextPoint.lat, nextPoint.lng);
            routePolyline.addLatLng([nextPoint.lat, nextPoint.lng]);
            map.setView([nextPoint.lat, nextPoint.lng], 10);
            map.invalidateSize();
            positionElement.textContent = `Current Position: Lat ${nextPoint.lat.toFixed(4)}, Lng ${nextPoint.lng.toFixed(4)}`;
            const elapsedSeconds = Math.floor((performance.now() - startTime) / 1000);
            elapsedTimeElement.textContent = `Elapsed Time: ${elapsedSeconds}s`;
            const distance = calculateDistance(currentData[index].lat, currentData[index].lng, nextPoint.lat, nextPoint.lng);
            const timeHours = (nextPoint.timestamp - currentData[index].timestamp) / (1000 * 3600);
            const speed = timeHours > 0 ? (distance / 1000) / timeHours : 0;
            speedElement.textContent = `Speed: ${speed.toFixed(2)} km/h`;
            index++;
            if (index >= currentData.length - 1) {
                clearInterval(animationFrame);
                playPauseButton.textContent = 'Play';
                isPlaying = false;
            }
        } catch (error) {
            console.error('Animation error:', error);
            positionElement.textContent = 'Error: Animation failed';
            clearInterval(animationFrame);
        }
    }, 1000); // Move every 1 second for visibility
}

// Play/Pause toggle
playPauseButton.addEventListener('click', () => {
    console.log('Play/Pause clicked, isPlaying:', isPlaying);
    isPlaying = !isPlaying;
    playPauseButton.textContent = isPlaying ? 'Pause' : 'Play';
    if (isPlaying) {
        startTime = performance.now() - (currentData[index].timestamp - currentData[0].timestamp);
        animate();
    } else {
        clearInterval(animationFrame);
    }
});

// Reset simulation
resetButton.addEventListener('click', resetSimulation);

// Dropdown selection
dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const period = e.target.dataset.period;
        currentData = locationData[period];
        dropdownButton.textContent = e.target.textContent;
        console.log('Selected period:', period);
        resetSimulation();
        isPlaying = true;
        playPauseButton.textContent = 'Pause';
        animate();
    });
});

// Start animation
try {
    console.log('Starting initialization');
    initializeMap();
    animate();
} catch (error) {
    console.error('Startup error:', error);
    positionElement.textContent = 'Error: Failed to start application';
}
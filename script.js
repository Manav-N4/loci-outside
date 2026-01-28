/*************************
 * CONFIG
 *************************/
const DEV_MODE = false; // set to false on real walk

/*************************
 * ZONES (define FIRST)
 *************************/
const zones = [
  {
    id: "A",
    name: "Arrival",
    latMin: 12.9710,
    latMax: 12.9715,
    lonMin: 77.7150,
    lonMax: 77.7155,
    audio: "audio/zoneA.mp3",
    played: false
  },
  {
    id: "B",
    name: "Curve",
    latMin: 12.9715,
    latMax: 12.9720,
    lonMin: 77.7155,
    lonMax: 77.7160,
    audio: "audio/zoneB.mp3",
    played: false
  },
  {
    id: "C",
    name: "Building",
    latMin: 12.9720,
    latMax: 12.9725,
    lonMin: 77.7160,
    lonMax: 77.7165,
    audio: "audio/zoneC.mp3",
    played: false
  },
  {
    id: "D",
    name: "Exit",
    latMin: 12.9725,
    latMax: 12.9730,
    lonMin: 77.7165,
    lonMax: 77.7170,
    audio: "audio/zoneD.mp3",
    played: false
  }
];

/*************************
 * UI
 *************************/
const statusEl = document.getElementById("status");

/*************************
 * AUDIO CONTROLLER
 *************************/
let currentAudio = null;

function playAudio(src) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = new Audio(src);
  currentAudio.play();
}

/*************************
 * ZONE CHECK
 *************************/
function isInsideZone(lat, lon, zone) {
  return (
    lat >= zone.latMin &&
    lat <= zone.latMax &&
    lon >= zone.lonMin &&
    lon <= zone.lonMax
  );
}

/*************************
 * CORE LOCATION HANDLER
 *************************/
function handleLocation(latitude, longitude, label = "") {
  statusEl.textContent =
    `${label} ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

  zones.forEach(zone => {
    if (!zone.played && isInsideZone(latitude, longitude, zone)) {
      zone.played = true;
      statusEl.textContent = `Loci: ${zone.name}`;
      playAudio(zone.audio);
    }
  });
}

/*************************
 * DEV MODE — SIMULATED WALK
 *************************/
if (DEV_MODE) {
  let step = 0;

  const fakePath = [
    { lat: 12.9711, lon: 77.7151 },
    { lat: 12.9716, lon: 77.7156 },
    { lat: 12.9721, lon: 77.7161 },
    { lat: 12.9726, lon: 77.7166 }
  ];

  statusEl.textContent = "DEV MODE: Simulating walk";

  setInterval(() => {
    const pos = fakePath[step % fakePath.length];
    handleLocation(pos.lat, pos.lon, "Simulating:");
    step++;
  }, 5000);

} else {

  /*************************
   * REAL GPS MODE
   *************************/
  if (!navigator.geolocation) {
    statusEl.textContent = "Geolocation not supported";
  } else {
    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleLocation(latitude, longitude, "Walking:");
      },
      () => {
        statusEl.textContent = "Location access needed for Loci";
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000
      }
    );
  }
}

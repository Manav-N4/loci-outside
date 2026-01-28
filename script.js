/*************************
 * CONFIG
 *************************/
const DEV_MODE = true; // false for real walk

/*************************
 * UI
 *************************/
const button = document.getElementById("walkButton");
const statusEl = document.getElementById("status");

/*************************
 * STATE
 *************************/
let isWalking = false;
let watchId = null;
let devInterval = null;
let currentAudio = null;

/*************************
 * ZONES
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
    name: "In-Between",
    latMin: 12.9715,
    latMax: 12.9720,
    lonMin: 77.7155,
    lonMax: 77.7160,
    audio: "audio/zoneB.mp3",
    played: false
  },
  {
    id: "C",
    name: "Institutional",
    latMin: 12.9720,
    latMax: 12.9725,
    lonMin: 77.7160,
    lonMax: 77.7165,
    audio: "audio/zoneC.mp3",
    played: false
  },
  {
    id: "D",
    name: "Release",
    latMin: 12.9725,
    latMax: 12.9730,
    lonMin: 77.7165,
    lonMax: 77.7170,
    audio: "audio/zoneD.mp3",
    played: false
  }
];

/*************************
 * HELPERS
 *************************/
function resetZones() {
  zones.forEach(z => (z.played = false));
}

function playAudio(src) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentAudio = new Audio(src);
  currentAudio.play();
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

function isInsideZone(lat, lon, zone) {
  return (
    lat >= zone.latMin &&
    lat <= zone.latMax &&
    lon >= zone.lonMin &&
    lon <= zone.lonMax
  );
}

function handleLocation(lat, lon, label = "") {
  statusEl.textContent = `${label} ${lat.toFixed(5)}, ${lon.toFixed(5)}`;

  zones.forEach(zone => {
    if (!zone.played && isInsideZone(lat, lon, zone)) {
      zone.played = true;
      playAudio(zone.audio);
    }
  });
}

/*************************
 * START / STOP WALK
 *************************/
function startWalk() {
  isWalking = true;
  button.textContent = "END WALK";
  button.classList.remove("idle");
  button.classList.add("walking");

  resetZones();
  statusEl.textContent = "Walking…";

  if (DEV_MODE) {
    let step = 0;
    const fakePath = [
      { lat: 12.9711, lon: 77.7151 },
      { lat: 12.9716, lon: 77.7156 },
      { lat: 12.9721, lon: 77.7161 },
      { lat: 12.9726, lon: 77.7166 }
    ];

    devInterval = setInterval(() => {
      const pos = fakePath[step % fakePath.length];
      handleLocation(pos.lat, pos.lon, "Simulating:");
      step++;
    }, 5000);

  } else {
    watchId = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        handleLocation(latitude, longitude, "Walking:");
      },
      () => {
        statusEl.textContent = "Location access needed";
      },
      { enableHighAccuracy: true }
    );
  }
}

function endWalk() {
  isWalking = false;
  button.textContent = "START WALK";
  button.classList.remove("walking");
  button.classList.add("idle");

  statusEl.textContent = "Walk ended";
  stopAudio();

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  if (devInterval !== null) {
    clearInterval(devInterval);
    devInterval = null;
  }
}

/*************************
 * BUTTON HANDLER
 *************************/
button.addEventListener("click", () => {
  if (!isWalking) {
    startWalk();
  } else {
    endWalk();
  }
});

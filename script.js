/*************************
 * CONFIG
 *************************/
const DEV_MODE = false; // false for real walk

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
let audioUnlocked = false;

/*************************
 * ZONES (CIRCULAR)
 *************************/
const zones = [
  {
    id: "A",
    name: "Threshold",
    lat: 12.968515,
    lon: 77.724438,
    radius: 30, // meters
    audio: "audio/zoneA.mp3",
    played: false
  },
  {
    id: "B",
    name: "In-Between",
    lat: 12.968289,
    lon: 77.724186,
    radius: 30,
    audio: "audio/zoneB.mp3",
    played: false
  },
  {
    id: "C",
    name: "Connector",
    lat: 12.968184,
    lon: 77.723790,
    radius: 30,
    audio: "audio/zoneC.mp3",
    played: false
  },
  {
    id: "D",
    name: "Institutional Edge",
    lat: 12.968360,
    lon: 77.723265,
    radius: 30,
    audio: "audio/zoneD.mp3",
    played: false
  },
  {
    id: "E",
    name: "Release",
    lat: 12.968690,
    lon: 77.722852,
    radius: 30,
    audio: "audio/zoneE.mp3",
    played: false
  }
];

/*************************
 * HELPERS
 *************************/
function resetZones() {
  zones.forEach(z => (z.played = false));
}

/* Mobile audio unlock */
function unlockAudio() {
  if (audioUnlocked) return;

  const silent = new Audio("audio/zoneA.mp3");
  silent.volume = 0;
  silent.play().then(() => {
    silent.pause();
    audioUnlocked = true;
  }).catch(() => {
    console.warn("Audio unlock failed");
  });
}

function playAudio(src) {
  if (!audioUnlocked) return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = new Audio(src);
  currentAudio.play().catch(err => {
    console.error("Audio play failed:", err);
  });
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

/*************************
 * DISTANCE CALC (meters)
 *************************/
function distanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = deg => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/*************************
 * CORE LOCATION HANDLER
 *************************/
function handleLocation(lat, lon, label = "") {
  statusEl.textContent = `${label} ${lat.toFixed(5)}, ${lon.toFixed(5)}`;

  zones.forEach(zone => {
    if (zone.played) return;

    const dist = distanceInMeters(lat, lon, zone.lat, zone.lon);

    if (dist <= zone.radius) {
      zone.played = true;
      statusEl.textContent = `Loci: ${zone.name}`;
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
  unlockAudio();
  statusEl.textContent = "Walking…";

  if (DEV_MODE) {
    let step = 0;
    const fakePath = [
      { lat: 12.968515, lon: 77.724438 },
      { lat: 12.968289, lon: 77.724186 },
      { lat: 12.968184, lon: 77.723790 },
      { lat: 12.968360, lon: 77.723265 },
      { lat: 12.968690, lon: 77.722852 }
    ];

    devInterval = setInterval(() => {
      const pos = fakePath[step % fakePath.length];
      handleLocation(pos.lat, pos.lon, "Simulating:");
      step++;
    }, 4000);

  } else {
    watchId = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        handleLocation(latitude, longitude, "Walking:");
      },
      () => {
        statusEl.textContent = "Location access needed";
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000
      }
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

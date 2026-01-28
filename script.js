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
 * ZONES
 *************************/
const zones = [
  {
    id: "A",
    name: "Threshold",
    latMin: 12.968515 - 0.00025,
    latMax: 12.968515 + 0.00025,
    lonMin: 77.724438 - 0.00025,
    lonMax: 77.724438 + 0.00025,
    audio: "audio/zoneA.mp3",
    played: false
  },
  {
    id: "B",
    name: "In-Between",
    latMin: 12.968289 - 0.00025,
    latMax: 12.968289 + 0.00025,
    lonMin: 77.724186 - 0.00025,
    lonMax: 77.724186 + 0.00025,
    audio: "audio/zoneB.mp3",
    played: false
  },
  {
    id: "C",
    name: "Connector",
    latMin: 12.968184 - 0.00025,
    latMax: 12.968184 + 0.00025,
    lonMin: 77.723790 - 0.00025,
    lonMax: 77.723790 + 0.00025,
    audio: "audio/zoneC.mp3",
    played: false
  },
  {
    id: "D",
    name: "Institutional Edge",
    latMin: 12.968360 - 0.00025,
    latMax: 12.968360 + 0.00025,
    lonMin: 77.723265 - 0.00025,
    lonMax: 77.723265 + 0.00025,
    audio: "audio/zoneD.mp3",
    played: false
  },
  {
    id: "E",
    name: "Release",
    latMin: 12.968690 - 0.00025,
    latMax: 12.968690 + 0.00025,
    lonMin: 77.722852 - 0.00025,
    lonMax: 77.722852 + 0.00025,
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

function unlockAudio() {
  if (audioUnlocked) return;

  const silent = new Audio();
  silent.src = "audio/zoneA.mp3"; // any valid file
  silent.volume = 0;
  silent.play().then(() => {
    silent.pause();
    audioUnlocked = true;
    console.log("Audio unlocked");
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

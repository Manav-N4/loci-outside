/*************************
 * CONFIG
 *************************/
const DEV_MODE = false; // keep false for real walk
const MAX_MISS_DISTANCE = 55; // meters (dead-zone fallback)

/*************************
 * UI
 *************************/
const robot = document.getElementById("robot");
const walkAction = document.getElementById("walkAction");
const statusEl = document.getElementById("status");

/*************************
 * STATE
 *************************/
let isWalking = false;
let watchId = null;
let devInterval = null;
let currentAudio = null;
let audioUnlocked = false;
let isPlayingZone = false;
let currentZoneIndex = 0;

/*************************
 * ROBOT STATE
 *************************/
function setRobotState(state) {
  robot.classList.remove("idle", "thinking", "speaking");
  robot.classList.add(state);
}

/*************************
 * ZONES — FINAL LOCK
 *************************/
const zones = [
  {
    id: "Z1",
    lat: 12.968667,
    lon: 77.722863,
    radius: 35,
    audio: "audio/zone1.mp3"
  },
  {
    id: "Z2",
    lat: 12.968514,
    lon: 77.723432,
    radius: 35,
    audio: "audio/zone2.mp3"
  },
  {
    id: "Z3",
    lat: 12.968140,
    lon: 77.723941,
    radius: 35,
    audio: "audio/zone3.mp3"
  }
];

/*************************
 * RESET
 *************************/
function resetWalkState() {
  currentZoneIndex = 0;
  isPlayingZone = false;
}

/*************************
 * AUDIO UNLOCK (MOBILE SAFE)
 *************************/
function unlockAudio() {
  if (audioUnlocked) return;

  const silent = new Audio("audio/zone1.mp3");
  silent.volume = 0;

  silent.play()
    .then(() => {
      silent.pause();
      audioUnlocked = true;
    })
    .catch(() => {
      console.warn("Audio unlock blocked");
    });
}

function playAudio(src) {
  if (!audioUnlocked || isPlayingZone) return;

  isPlayingZone = true;
  setRobotState("speaking");

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = new Audio(src);
  currentAudio.play().catch(console.error);

  currentAudio.onended = () => {
    isPlayingZone = false;
    setRobotState("idle");
  };
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  isPlayingZone = false;
  setRobotState("idle");
}

/*************************
 * DISTANCE (HAVERSINE)
 *************************/
function distanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/*************************
 * LOCATION HANDLER
 *************************/
function handleLocation(lat, lon, label = "") {
  statusEl.textContent = `${label} ${lat.toFixed(5)}, ${lon.toFixed(5)}`;

  if (currentZoneIndex >= zones.length) return;
  if (isPlayingZone) return;

  const zone = zones[currentZoneIndex];
  const dist = distanceInMeters(lat, lon, zone.lat, zone.lon);

  if (dist <= zone.radius || dist <= MAX_MISS_DISTANCE) {
    statusEl.textContent = `Loci: Zone ${currentZoneIndex + 1}`;
    playAudio(zone.audio);
    currentZoneIndex++;
  }
}

/*************************
 * START WALK
 *************************/
function startWalk() {
  isWalking = true;
  walkAction.textContent = "End walk";
  walkAction.classList.add("walking");

  resetWalkState();
  setRobotState("thinking");
  statusEl.textContent = "Walking…";

  watchId = navigator.geolocation.watchPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      handleLocation(latitude, longitude, "Walking:");
    },
    () => {
      statusEl.textContent = "Location access needed";
    },
    {
      enableHighAccuracy: false,
      maximumAge: 3000,
      timeout: 10000
    }
  );
}

/*************************
 * END WALK
 *************************/
function endWalk() {
  isWalking = false;
  walkAction.textContent = "Tap to start walk";
  walkAction.classList.remove("walking");

  stopAudio();
  setRobotState("idle");
  statusEl.textContent = "Walk ended";

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

/*************************
 * TAP HANDLER (CRITICAL)
 *************************/
walkAction.addEventListener("click", () => {
  unlockAudio(); // must be first

  if (!isWalking) {
    startWalk();
  } else {
    endWalk();
  }
});
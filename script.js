/*************************
 * CONFIG
 *************************/
const DEV_MODE = false; // true only for hostel testing

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

/*************************
 * ROBOT STATE
 *************************/
function setRobotState(state) {
  robot.classList.remove("idle", "thinking", "speaking");
  robot.classList.add(state);
}

/*************************
 * ZONES (CIRCULAR)
 *************************/
const zones = [
  {
    id: "A",
    name: "Threshold",
    lat: 12.968667,
    lon: 77.722863,
    radius: 30,
    audio: "audio/zone1.mp3",
    played: false
  },
  {
    id: "B",
    name: "In-Between",
    lat: 12.968514,
    lon: 77.723432,
    radius: 30,
    audio: "audio/zone2.mp3",
    played: false
  },
  {
    id: "C",
    name: "Release",
    lat: 12.968140,
    lon: 77.723941,
    radius: 25,
    audio: "audio/zone3.mp3",
    played: false
  }
];



/*************************
 * HELPERS
 *************************/
function resetZones() {
  zones.forEach(z => (z.played = false));
}

/* Unlock audio on user gesture (mobile safe) */
function unlockAudio() {
  if (audioUnlocked) return;

  const silent = new Audio("audio/zoneA.mp3");
  silent.volume = 0;

  silent.play()
    .then(() => {
      silent.pause();
      audioUnlocked = true;
    })
    .catch(() => {
      console.warn("Audio unlock failed");
    });
}

function playAudio(src) {
  if (!audioUnlocked) return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  setRobotState("speaking");

  currentAudio = new Audio(src);
  currentAudio.play().catch(console.error);

  currentAudio.onended = () => {
    setRobotState("idle");
  };
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  setRobotState("idle");
}

/*************************
 * DISTANCE (meters)
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
 * START / END WALK
 *************************/
function startWalk() {
  isWalking = true;
  walkAction.textContent = "End walk";
  walkAction.classList.add("walking");

  resetZones();
  unlockAudio();
  setRobotState("thinking");
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
  walkAction.textContent = "Tap to start walk";
  walkAction.classList.remove("walking");

  stopAudio();
  setRobotState("idle");
  statusEl.textContent = "Walk ended";

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
 * TAP HANDLER (TEXT = BUTTON)
 *************************/
walkAction.addEventListener("click", () => {
  if (!isWalking) {
    startWalk();
  } else {
    endWalk();
  }
});

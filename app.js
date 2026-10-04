// =========================================================
// ROAM — APP.JS
// Supabase + Roam planner
// =========================================================


// =========================================================
// SUPABASE CONNECTION
// =========================================================

const SUPABASE_URL =
  "https://vvbgksamdlhkkchyhlyl.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_WaNsM-y0X9VH8pgnAQYFkg_2o68bx6S";


// Make sure Supabase library loaded from index.html
const db =
  window.supabase &&
  SUPABASE_PUBLISHABLE_KEY &&
  !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_")
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
      )
    : null;


// =========================================================
// APP STATE
// =========================================================

const state = {
  roamName: "",
  location: "",
  lat: null,
  lon: null,

  groupSize: 4,

  selectedDates: [],
  selectedTimes: [],

  participantName: "",

  budget: null,
  averageBudget: null,

  activity: null,

  selectedTime: null,
  selectedPlace: null,

  places: [],

  roomId: null,
  roomCode: null,

  organizerToken: null,
  participantToken: null,

  joinedRoom: false
};


// =========================================================
// BASIC HELPERS
// =========================================================

function $(id) {
  return document.getElementById(id);
}


function showToast(message) {
  const toast = $("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}


function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const target = $(screenId);

  if (target) {
    target.classList.add("active");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  updateProgress();
}


function updateProgress() {
  // Keeps the app compatible with the current HTML.
  // If your progress bar exists, update it here.

  const screens = [
    "home",
    "details",
    "dates",
    "availability",
    "budget",
    "activity",
    "results",
    "places",
    "final"
  ];

  const activeScreen = document.querySelector(".screen.active");

  if (!activeScreen) return;

  const index = screens.indexOf(activeScreen.id);

  const percent =
    index >= 0
      ? Math.max(
          0,
          Math.min(100, (index / (screens.length - 1)) * 100)
        )
      : 0;

  const progress =
    $("progressBar") ||
    document.querySelector(".progress-fill");

  if (progress) {
    progress.style.width = `${percent}%`;
  }
}


// =========================================================
// SUPABASE CHECK
// =========================================================

function requireSupabase() {
  if (!db) {
    alert(
      "Roam is not connected to Supabase yet.\n\n" +
      "Open app.js and paste your Default Publishable Key into " +
      "SUPABASE_PUBLISHABLE_KEY."
    );

    return false;
  }

  return true;
}


// =========================================================
// START / RESET
// =========================================================

function startRoam() {
  resetRoam(false);

  showScreen("details");
}


function resetRoam(showHome = true) {
  state.roamName = "";
  state.location = "";
  state.lat = null;
  state.lon = null;

  state.groupSize = 4;

  state.selectedDates = [];
  state.selectedTimes = [];

  state.participantName = "";

  state.budget = null;
  state.averageBudget = null;

  state.activity = null;

  state.selectedTime = null;
  state.selectedPlace = null;
  state.places = [];

  state.roomId = null;
  state.roomCode = null;

  state.organizerToken = null;
  state.participantToken = null;

  state.joinedRoom = false;

  if (showHome) {
    showScreen("home");
  }
}


// =========================================================
// GROUP SIZE
// =========================================================

function changeGroupSize(amount) {
  state.groupSize += amount;

  if (state.groupSize < 2) {
    state.groupSize = 2;
  }

  if (state.groupSize > 50) {
    state.groupSize = 50;
  }

  const display = $("groupSizeDisplay");

  if (display) {
    display.textContent = state.groupSize;
  }
}


// =========================================================
// CREATE ROAM
// =========================================================

async function saveRoamDetails() {
  if (!requireSupabase()) return;

  const roamName = $("roamName")?.value.trim();
  const location = $("location")?.value.trim();

  if (!roamName) {
    showToast("Give your Roam a name.");
    return;
  }

  if (!location) {
    showToast("Add a location.");
    return;
  }

  state.roamName = roamName;
  state.location = location;

  state.organizerToken = generateToken();

  let code = null;

  // Make sure the room code is unique.
  for (let i = 0; i < 10; i++) {
    const possibleCode = generateRoomCode();

    const { data, error } = await db
      .from("rooms")
      .select("id")
      .eq("code", possibleCode)
      .maybeSingle();

    if (error) {
      console.error(error);
      showToast("Couldn't check the Roam code.");
      return;
    }

    if (!data) {
      code = possibleCode;
      break;
    }
  }

  if (!code) {
    showToast("Couldn't create a Roam code. Try again.");
    return;
  }

  state.roomCode = code;

  const { data, error } = await db
    .from("rooms")
    .insert({
      code: state.roomCode,
      name: state.roamName,
      location_text: state.location,
      lat: state.lat,
      lng: state.lon,
      group_size: state.groupSize,
      candidate_dates: [],
      activity: null,
      organizer_token: state.organizerToken
    })
    .select()
    .single();

  if (error) {
    console.error("Create room error:", error);

    showToast(
      error.message ||
      "Couldn't create your Roam."
    );

    return;
  }

  state.roomId = data.id;
  state.joinedRoom = false;

  showToast(`Your Roam code is ${state.roomCode}`);

  showScreen("dates");
}


// =========================================================
// ROOM CODE
// =========================================================

function generateRoomCode() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < 5; i++) {
    code += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return code;
}


function generateToken() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID() +
      "-" +
      Date.now();
  }

  return (
    Math.random().toString(36).substring(2) +
    Date.now().toString(36) +
    Math.random().toString(36).substring(2)
  );
}


// =========================================================
// DATES
// =========================================================

function buildDates() {
  const grid = $("dateGrid");

  if (!grid) return;

  grid.innerHTML = "";

  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);

    date.setDate(today.getDate() + i);

    const button = document.createElement("button");

    button.type = "button";
    button.className = "date-option";

    const weekday = date.toLocaleDateString(
      "en-US",
      { weekday: "short" }
    );

    const month = date.toLocaleDateString(
      "en-US",
      { month: "short" }
    );

    const day = date.getDate();

    const value =
      `${date.getFullYear()}-` +
      `${String(date.getMonth() + 1).padStart(2, "0")}-` +
      `${String(date.getDate()).padStart(2, "0")}`;

    button.dataset.date = value;

    button.innerHTML = `
      <span>${weekday}</span>
      <strong>${day}</strong>
      <small>${month}</small>
    `;

    button.addEventListener("click", () => {
      toggleDate(value, button);
    });

    grid.appendChild(button);
  }
}


function toggleDate(dateValue, button) {
  const index =
    state.selectedDates.indexOf(dateValue);

  if (index === -1) {
    state.selectedDates.push(dateValue);
    button.classList.add("selected");
  } else {
    state.selectedDates.splice(index, 1);
    button.classList.remove("selected");
  }
}


async function saveDates() {
  if (!requireSupabase()) return;

  if (!state.roomId) {
    showToast("Your Roam hasn't been created yet.");
    return;
  }

  if (state.selectedDates.length === 0) {
    showToast("Choose at least one date.");
    return;
  }

  const { error } = await db
    .from("rooms")
    .update({
      candidate_dates: state.selectedDates
    })
    .eq("id", state.roomId);

  if (error) {
    console.error("Save dates error:", error);
    showToast("Couldn't save the dates.");
    return;
  }

  buildTimes();

  showScreen("availability");
}


// =========================================================
// TIMES
// =========================================================

function buildTimes() {
  const grid = $("timeGrid");

  if (!grid) return;

  grid.innerHTML = "";

  const times = [
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
    "8:00 PM"
  ];

  times.forEach(time => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "time-option";
    button.textContent = time;

    button.addEventListener("click", () => {
      document
        .querySelectorAll(".time-option")
        .forEach(item => {
          item.classList.remove("selected");
        });

      button.classList.add("selected");

      state.selectedTimes = [time];
      state.selectedTime = time;
    });

    grid.appendChild(button);
  });
}


// =========================================================
// PARTICIPANT AVAILABILITY
// =========================================================

async function saveAvailability() {
  const name = $("participantName")?.value.trim();

  if (!name) {
    showToast("Enter your name.");
    return;
  }

  if (state.selectedTimes.length === 0) {
    showToast("Choose a time.");
    return;
  }

  state.participantName = name;

  showScreen("budget");
}


// =========================================================
// BUDGET
// =========================================================

function selectBudget(amount) {
  state.budget = amount;

  document
    .querySelectorAll(".budget-option, .budget-button")
    .forEach(button => {
      button.classList.remove("selected");
    });

  // Find button by onclick if possible.
  document
    .querySelectorAll("button")
    .forEach(button => {
      const text = button.textContent.trim();

      if (
        text.includes(`$${amount}`) ||
        text.includes(`${amount}`)
      ) {
        button.classList.add("selected");
      }
    });
}


async function finishBudget() {
  if (!requireSupabase()) return;

  if (!state.roomId) {
    showToast("Your Roam room is missing.");
    return;
  }

  if (!state.participantName) {
    showToast("Enter your name first.");
    showScreen("availability");
    return;
  }

  if (!state.budget) {
    showToast("Choose a budget.");
    return;
  }

  state.participantToken = generateToken();

  const availability = {
    dates: state.selectedDates,
    times: state.selectedTimes
  };

  const { data, error } = await db
    .from("participants")
    .insert({
      room_id: state.roomId,
      name: state.participantName,
      participant_token: state.participantToken,
      availability,
      budget: state.budget
    })
    .select()
    .single();

  if (error) {
    console.error("Participant insert error:", error);

    showToast(
      error.message ||
      "Couldn't save your information."
    );

    return;
  }

  await calculateAverageBudget();

  buildResults();

  showScreen("activity");
}


// =========================================================
// AVERAGE BUDGET
// =========================================================

async function calculateAverageBudget() {
  if (!requireSupabase()) return;

  if (!state.roomId) return;

  const { data, error } = await db.rpc(
    "get_room_average_budget",
    {
      room_uuid: state.roomId
    }
  );

  if (error) {
    console.error(
      "Average budget error:",
      error
    );

    state.averageBudget = null;
    return;
  }

  if (
    Array.isArray(data) &&
    data.length > 0
  ) {
    state.averageBudget =
      data[0].average_budget;
  } else {
    state.averageBudget = null;
  }
}


// =========================================================
// ACTIVITY
// =========================================================

async function selectActivity(activity) {
  state.activity = activity;

  document
    .querySelectorAll(".activity-option, .activity-card")
    .forEach(button => {
      button.classList.remove("selected");
    });

  document
    .querySelectorAll("button")
    .forEach(button => {
      const onclick = button.getAttribute("onclick") || "";

      if (
        onclick.includes(`'${activity}'`) ||
        onclick.includes(`"${activity}"`)
      ) {
        button.classList.add("selected");
      }
    });

  if (state.roomId && db) {
    const { error } = await db
      .from("rooms")
      .update({
        activity: state.activity
      })
      .eq("id", state.roomId);

    if (error) {
      console.error(
        "Activity update error:",
        error
      );
    }
  }

  buildResults();
}


// =========================================================
// RESULTS
// =========================================================

async function buildResults() {
  const results = $("resultsList");

  if (results) {
    results.innerHTML = "";

    const times =
      state.selectedTimes.length > 0
        ? state.selectedTimes
        : ["No time selected"];

    times.forEach(time => {
      const item =
        document.createElement("div");

      item.className = "result-item";

      item.innerHTML = `
        <div>
          <strong>${time}</strong>
          <span>Available time</span>
        </div>
        <button
          type="button"
          onclick="chooseTime('${escapeAttribute(time)}')"
        >
          Choose
        </button>
      `;

      results.appendChild(item);
    });
  }

  const average = $("averageBudget");

  if (average) {
    if (state.averageBudget !== null) {
      average.textContent =
        `$${Number(state.averageBudget).toFixed(2)}`;
    } else if (state.budget !== null) {
      average.textContent =
        `$${Number(state.budget).toFixed(2)}`;
    } else {
      average.textContent = "—";
    }
  }
}


// =========================================================
// PLACES
// =========================================================

async function showPlaces() {
  showScreen("places");

  const loading = $("placesLoading");

  if (loading) {
    loading.style.display = "block";
  }

  const list = $("placesList");

  if (list) {
    list.innerHTML = "";
  }

  try {
    await loadNearbyPlaces();
  } catch (error) {
    console.error(
      "Places error:",
      error
    );

    renderPlaces(
      fallbackPlaces()
    );
  }

  if (loading) {
    loading.style.display = "none";
  }
}


async function loadNearbyPlaces() {
  const latitude = state.lat;
  const longitude = state.lon;

  // If GPS isn't available, try the location text.
  if (
    latitude === null ||
    longitude === null
  ) {
    renderPlaces(
      fallbackPlaces()
    );

    return;
  }

  const places =
    await fetchOverpassPlaces(
      latitude,
      longitude,
      state.activity
    );

  if (!places.length) {
    renderPlaces(
      fallbackPlaces()
    );

    return;
  }

  state.places = places;

  renderPlaces(places);
}


// =========================================================
// OVERPASS
// =========================================================

async function fetchOverpassPlaces(
  lat,
  lon,
  activity
) {
  const radius = 5000;

  const queryParts =
    getOverpassQueries(activity);

  const query = `
    [out:json][timeout:25];
    (
      ${queryParts.join("\n")}
    );
    out center tags;
  `;

  const url =
    "https://overpass-api.de/api/interpreter";

  const response = await fetch(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded"
      },
      body:
        "data=" +
        encodeURIComponent(
          query.replace(
            /LAT/g,
            lat
          ).replace(
            /LON/g,
            lon
          ).replace(
            /RADIUS/g,
            radius
          )
        )
    }
  );

  if (!response.ok) {
    throw new Error(
      `Overpass HTTP ${response.status}`
    );
  }

  const json =
    await response.json();

  return (json.elements || [])
    .map(item => {
      const tags = item.tags || {};

      const itemLat =
        item.lat ??
        item.center?.lat ??
        lat;

      const itemLon =
        item.lon ??
        item.center?.lon ??
        lon;

      return {
        id:
          `${item.type}-${item.id}`,

        name:
          tags.name ||
          "Nearby place",

        category:
          getPlaceCategory(
            tags,
            activity
          ),

        lat: itemLat,
        lon: itemLon,

        address:
          formatAddress(tags),

        distance:
          calculateDistance(
            lat,
            lon,
            itemLat,
            itemLon
          ),

        tags
      };
    })
    .filter(
      place =>
        place.name &&
        place.name !== "Nearby place"
    )
    .sort(
      (a, b) =>
        a.distance - b.distance
    )
    .slice(0, 12);
}


function getOverpassQueries(activity) {
  const base = [
    "node(around:RADIUS,LAT,LON)"
  ];

  switch (activity) {
    case "eat":
      return [
        `${base[0]}[amenity=restaurant];`,
        `${base[0]}[amenity=fast_food];`,
        `${base[0]}[amenity=food_court];`
      ];

    case "movies":
      return [
        `${base[0]}[amenity=cinema];`
      ];

    case "bowling":
      return [
        `${base[0]}[leisure=bowling_alley];`
      ];

    case "coffee":
      return [
        `${base[0]}[amenity=cafe];`
      ];

    case "outdoors":
      return [
        `${base[0]}[leisure=park];`,
        `${base[0]}[leisure=garden];`,
        `${base[0]}[tourism=picnic_site];`,
        `${base[0]}[natural=beach];`
      ];

    case "arts":
      return [
        `${base[0]}[tourism=museum];`,
        `${base[0]}[tourism=gallery];`,
        `${base[0]}[amenity=arts_centre];`
      ];

    case "games":
      return [
        `${base[0]}[leisure=amusement_arcade];`,
        `${base[0]}[leisure=escape_game];`,
        `${base[0]}[amenity=game_centre];`
      ];

    default:
      return [
        `${base[0]}[amenity];`,
        `${base[0]}[leisure];`,
        `${base[0]}[shop];`
      ];
  }
}


// =========================================================
// PLACE HELPERS
// =========================================================

function getPlaceCategory(
  tags,
  activity
) {
  if (activity === "eat") {
    return "Food";
  }

  if (activity === "movies") {
    return "Movies";
  }

  if (activity === "bowling") {
    return "Bowling";
  }

  if (activity === "coffee") {
    return "Coffee";
  }

  if (activity === "outdoors") {
    return "Outdoors";
  }

  if (activity === "arts") {
    return "Arts";
  }

  if (activity === "games") {
    return "Games";
  }

  return (
    tags.amenity ||
    tags.leisure ||
    tags.tourism ||
    "Place"
  );
}


function formatAddress(tags) {
  const parts = [];

  if (tags["addr:housenumber"]) {
    parts.push(
      tags["addr:housenumber"]
    );
  }

  if (tags["addr:street"]) {
    parts.push(
      tags["addr:street"]
    );
  }

  if (tags["addr:city"]) {
    parts.push(
      tags["addr:city"]
    );
  }

  return parts.join(" ");
}


function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const R = 3958.8;

  const dLat =
    degreesToRadians(
      lat2 - lat1
    );

  const dLon =
    degreesToRadians(
      lon2 - lon1
    );

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      degreesToRadians(lat1)
    ) *
    Math.cos(
      degreesToRadians(lat2)
    ) *
    Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}


function degreesToRadians(value) {
  return value *
    (Math.PI / 180);
}


// =========================================================
// RENDER PLACES
// =========================================================

function renderPlaces(places) {
  const list = $("placesList");

  if (!list) return;

  list.innerHTML = "";

  if (!places.length) {
    list.innerHTML = `
      <div class="empty-state">
        <h3>No places found</h3>
        <p>Try another activity.</p>
      </div>
    `;

    return;
  }

  places.forEach(place => {
    const card =
      document.createElement("div");

    card.className = "place-card";

    const distance =
      place.distance !== undefined
        ? `${place.distance.toFixed(1)} mi`
        : "";

    card.innerHTML = `
      <div class="place-info">
        <span class="place-category">
          ${escapeHTML(place.category)}
        </span>

        <h3>
          ${escapeHTML(place.name)}
        </h3>

        <p>
          ${escapeHTML(
            place.address || "Nearby"
          )}
        </p>

        <small>
          ${distance}
        </small>
      </div>

      <button
        type="button"
        onclick="choosePlace('${escapeAttribute(place.id)}')"
      >
        Choose
      </button>
    `;

    list.appendChild(card);
  });
}


// =========================================================
// CHOOSE TIME
// =========================================================

function chooseTime(time) {
  state.selectedTime = time;

  buildFinalPlan();

  showPlaces();
}


// =========================================================
// CHOOSE PLACE
// =========================================================

function choosePlace(placeId) {
  const place =
    state.places.find(
      item => item.id === placeId
    );

  if (!place) return;

  state.selectedPlace = place;

  buildFinalPlan();

  showScreen("final");
}


// =========================================================
// FINAL PLAN
// =========================================================

function buildFinalPlan() {
  const finalDate = $("finalDate");
  const finalTime = $("finalTime");
  const finalActivity = $("finalActivity");
  const finalPlace = $("finalPlace");
  const finalPeople = $("finalPeople");
  const finalBudget = $("finalBudget");

  if (finalDate) {
    finalDate.textContent =
      formatDate(
        state.selectedDates[0]
      );
  }

  if (finalTime) {
    finalTime.textContent =
      state.selectedTime ||
      state.selectedTimes[0] ||
      "TBD";
  }

  if (finalActivity) {
    finalActivity.textContent =
      activityLabel(
        state.activity
      );
  }

  if (finalPlace) {
    finalPlace.textContent =
      state.selectedPlace?.name ||
      "Choose a place";
  }

  if (finalPeople) {
    finalPeople.textContent =
      state.groupSize;
  }

  if (finalBudget) {
    if (state.averageBudget !== null) {
      finalBudget.textContent =
        `$${Number(
          state.averageBudget
        ).toFixed(2)} avg`;
    } else if (state.budget !== null) {
      finalBudget.textContent =
        `$${Number(
          state.budget
        ).toFixed(2)}`;
    } else {
      finalBudget.textContent =
        "TBD";
    }
  }
}


// =========================================================
// ACTIVITY LABEL
// =========================================================

function activityLabel(activity) {
  const labels = {
    eat: "Food",
    movies: "Movies",
    bowling: "Bowling",
    coffee: "Coffee",
    outdoors: "Outdoors",
    arts: "Arts & Culture",
    games: "Games",
    other: "Something fun"
  };

  return (
    labels[activity] ||
    "Hangout"
  );
}


// =========================================================
// PLAN TEXT
// =========================================================

function makePlanText() {
  const date =
    formatDate(
      state.selectedDates[0]
    );

  const time =
    state.selectedTime ||
    state.selectedTimes[0] ||
    "TBD";

  const activity =
    activityLabel(
      state.activity
    );

  const place =
    state.selectedPlace?.name ||
    "TBD";

  const location =
    state.selectedPlace?.address ||
    state.location ||
    "";

  const budget =
    state.averageBudget !== null
      ? `$${Number(
          state.averageBudget
        ).toFixed(2)} average budget`
      : "Budget TBD";

  return (
    `Roam plan 🌅\n\n` +
    `${activity}\n` +
    `${place}\n` +
    `${location}\n\n` +
    `${date} at ${time}\n` +
    `${state.groupSize} people\n` +
    `${budget}`
  );
}


// =========================================================
// COPY PLAN
// =========================================================

async function copyPlan() {
  const text =
    makePlanText();

  try {
    await navigator.clipboard.writeText(
      text
    );

    showToast(
      "Plan copied!"
    );
  } catch (error) {
    console.error(error);

    // Fallback for browsers
    const textarea =
      document.createElement("textarea");

    textarea.value = text;

    document.body.appendChild(
      textarea
    );

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();

    showToast(
      "Plan copied!"
    );
  }
}


// =========================================================
// SHARE PLAN
// =========================================================

async function sharePlan() {
  const text =
    makePlanText();

  if (
    navigator.share
  ) {
    try {
      await navigator.share({
        title: "My Roam plan",
        text
      });

      return;
    } catch (error) {
      console.log(
        "Share cancelled."
      );
    }
  }

  await copyPlan();
}


// =========================================================
// USER LOCATION
// =========================================================

function getUserLocation() {
  if (!navigator.geolocation) {
    showToast(
      "Location isn't supported by this browser."
    );

    return;
  }

  showToast(
    "Finding your location..."
  );

  navigator.geolocation.getCurrentPosition(
    position => {
      state.lat =
        position.coords.latitude;

      state.lon =
        position.coords.longitude;

      showToast(
        "Location found!"
      );
    },

    error => {
      console.error(
        "Location error:",
        error
      );

      showToast(
        "Couldn't get your location. You can enter it manually."
      );
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }
  );
}


// =========================================================
// JOIN A ROAM
// =========================================================

async function showJoinMessage() {
  if (!requireSupabase()) return;

  const codeInput =
    window.prompt(
      "Enter the 5-character Roam code:"
    );

  if (!codeInput) {
    return;
  }

  const code =
    codeInput
      .trim()
      .toUpperCase();

  if (code.length !== 5) {
    showToast(
      "Roam codes are 5 characters."
    );

    return;
  }

  showToast(
    "Finding that Roam..."
  );

  const { data, error } =
    await db
      .from("rooms")
      .select("*")
      .eq("code", code)
      .maybeSingle();

  if (error) {
    console.error(
      "Join error:",
      error
    );

    showToast(
      "Couldn't find that Roam."
    );

    return;
  }

  if (!data) {
    showToast(
      "That Roam code doesn't exist."
    );

    return;
  }

  // Load the room into local state.
  state.roomId =
    data.id;

  state.roomCode =
    data.code;

  state.roamName =
    data.name;

  state.location =
    data.location_text;

  state.lat =
    data.lat;

  state.lon =
    data.lng;

  state.groupSize =
    data.group_size;

  state.selectedDates =
    Array.isArray(
      data.candidate_dates
    )
      ? data.candidate_dates
      : [];

  state.activity =
    data.activity;

  state.joinedRoom =
    true;

  state.participantToken =
    generateToken();

  // Show room information in the form.
  const roamName =
    $("roamName");

  if (roamName) {
    roamName.value =
      state.roamName;
  }

  const location =
    $("location");

  if (location) {
    location.value =
      state.location;
  }

  // Build dates/times for participant.
  buildTimes();

  showToast(
    `Joined ${state.roamName}!`
  );

  showScreen(
    "availability"
  );
}


// =========================================================
// FALLBACK PLACES
// =========================================================

function fallbackPlaces() {
  const activity =
    activityLabel(
      state.activity
    );

  return [
    {
      id: "fallback-1",
      name:
        `${activity} nearby`,
      category:
        activity,
      address:
        state.location ||
        "Your selected area",
      distance: 0
    },
    {
      id: "fallback-2",
      name:
        "Explore nearby options",
      category:
        activity,
      address:
        state.location ||
        "Your selected area",
      distance: 0
    }
  ];
}


// =========================================================
// DATE FORMATTING
// =========================================================

function formatDate(dateString) {
  if (!dateString) {
    return "TBD";
  }

  const date =
    new Date(
      `${dateString}T12:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return dateString;
  }

  return date.toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric"
    }
  );
}


// =========================================================
// SECURITY / DISPLAY HELPERS
// =========================================================

function escapeHTML(value) {
  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


function escapeAttribute(value) {
  return String(value)
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /'/g,
      "\\'"
    );
}


// =========================================================
// STARTUP
// =========================================================

function initializeRoam() {
  buildDates();
  buildTimes();

  const groupSize =
    $("groupSizeDisplay");

  if (groupSize) {
    groupSize.textContent =
      state.groupSize;
  }

  updateProgress();

  console.log(
    "Roam loaded."
  );

  if (db) {
    console.log(
      "Supabase client connected."
    );
  } else {
    console.warn(
      "Supabase is NOT connected. " +
      "Add your Publishable Key to app.js."
    );
  }
}


// =========================================================
// MAKE HTML ONCLICK FUNCTIONS AVAILABLE
// =========================================================

window.startRoam =
  startRoam;

window.resetRoam =
  resetRoam;

window.changeGroupSize =
  changeGroupSize;

window.saveRoamDetails =
  saveRoamDetails;

window.toggleDate =
  toggleDate;

window.saveDates =
  saveDates;

window.saveAvailability =
  saveAvailability;

window.selectBudget =
  selectBudget;

window.finishBudget =
  finishBudget;

window.selectActivity =
  selectActivity;

window.buildResults =
  buildResults;

window.showPlaces =
  showPlaces;

window.chooseTime =
  chooseTime;

window.choosePlace =
  choosePlace;

window.copyPlan =
  copyPlan;

window.sharePlan =
  sharePlan;

window.getUserLocation =
  getUserLocation;

window.showJoinMessage =
  showJoinMessage;


// =========================================================
// RUN APP
// =========================================================

if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initializeRoam
  );
} else {
  initializeRoam();
}

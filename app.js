const { createClient } = window.supabase || {};

let supabaseClient = null;

const state = {
  mode: "create",
  room: null,
  roomId: null,

  roomName: "",
  name: "",
  location: "",
  lat: null,
  lng: null,
  groupSize: 4,

  selectedDates: [],
  selectedTimes: [],
  budget: null,
  activity: null,

  places: [],
  selectedPlace: null,
  bestTimes: [],

  organizerToken: null,
  participantToken: null
};

const ACTIVITIES = [
  {
    id: "food",
    name: "Food & drinks",
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80",
    tags: ["restaurant", "cafe", "fast_food"]
  },
  {
    id: "coffee",
    name: "Coffee & dessert",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    tags: ["cafe", "bakery", "ice_cream"]
  },
  {
    id: "outdoors",
    name: "Outdoors",
    image:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80",
    tags: ["park", "garden"]
  },
  {
    id: "arts",
    name: "Arts & culture",
    image:
      "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=80",
    tags: ["museum", "gallery", "arts_centre", "theatre"]
  },
  {
    id: "games",
    name: "Games",
    image:
      "https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=900&q=80",
    tags: ["bowling_alley", "sports_centre", "game"]
  },
  {
    id: "shopping",
    name: "Shopping",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80",
    tags: ["mall", "marketplace", "department_store"]
  }
];

const TIMES = [
  "9:00 AM",
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

const BUDGETS = [
  { value: 10, label: "$0–20" },
  { value: 30, label: "$20–40" },
  { value: 50, label: "$40–60" },
  { value: 75, label: "$60–90" },
  { value: 100, label: "$90+" }
];

let DATE_OPTIONS = [];

document.addEventListener("DOMContentLoaded", init);

function init() {
  initializeSupabase();

  DATE_OPTIONS = getDateOptions();

  renderDates();
  renderTimes();
  renderBudgets();
  renderActivities();

  bindEvents();

  showScreen("home");
}

function initializeSupabase() {
  const config = window.ROAM_CONFIG;

  if (!config) {
    console.error("config.js was not loaded.");
    return;
  }

  if (
    !config.supabaseUrl ||
    !config.supabasePublishableKey ||
    config.supabasePublishableKey.includes(
      "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE"
    )
  ) {
    console.error("Supabase Publishable Key is missing.");
    return;
  }

  if (!createClient) {
    console.error("Supabase library did not load.");
    return;
  }

  supabaseClient = createClient(
    config.supabaseUrl,
    config.supabasePublishableKey
  );

  console.log("Roam connected to Supabase.");
}

function bindEvents() {
  const startBtn = document.getElementById("startBtn");

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      resetState();
      showScreen("create");
    });
  }

  const homeBtn = document.getElementById("homeBtn");

  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      resetState();
      showScreen("home");
    });
  }

  const joinNavBtn = document.getElementById("joinNavBtn");

  if (joinNavBtn) {
    joinNavBtn.addEventListener("click", () => {
      state.mode = "join";
      showScreen("join");
    });
  }

  document.querySelectorAll("[data-back]").forEach((button) => {
    button.addEventListener("click", () => {
      showScreen(button.dataset.back);
    });
  });

  document
    .getElementById("locateBtn")
    ?.addEventListener("click", locateUser);

  document
    .getElementById("createNext")
    ?.addEventListener("click", saveCreateDetails);

  document
    .getElementById("datesNext")
    ?.addEventListener("click", handleDatesNext);

  document
    .getElementById("datesBack")
    ?.addEventListener("click", () => {
      showScreen(state.mode === "join" ? "joinConfirm" : "create");
    });

  document
    .getElementById("timesNext")
    ?.addEventListener("click", handleTimesNext);

  document
    .getElementById("timesBack")
    ?.addEventListener("click", () => showScreen("dates"));

  document
    .getElementById("budgetNext")
    ?.addEventListener("click", handleBudgetNext);

  document
    .getElementById("budgetBack")
    ?.addEventListener("click", () => showScreen("times"));

  document
    .getElementById("activityNext")
    ?.addEventListener("click", handleActivityNext);

  document
    .getElementById("activityBack")
    ?.addEventListener("click", () => showScreen("budget"));

  document
    .getElementById("copyCode")
    ?.addEventListener("click", copyRoomCode);

  document
    .getElementById("viewRoam")
    ?.addEventListener("click", openRoam);

  document
    .getElementById("findRoam")
    ?.addEventListener("click", findRoom);

  document
    .getElementById("joinNext")
    ?.addEventListener("click", startJoinAvailability);

  document
    .getElementById("placesNext")
    ?.addEventListener("click", finishRoam);

  document
    .getElementById("placesBack")
    ?.addEventListener("click", () => showScreen("activity"));

  document
    .getElementById("copyPlan")
    ?.addEventListener("click", copyFinalPlan);

  document
    .getElementById("doneBtn")
    ?.addEventListener("click", () => {
      resetState();
      showScreen("home");
    });
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });

  const target = document.getElementById(id);

  if (!target) {
    console.error(`Screen not found: ${id}`);
    return;
  }

  target.classList.add("active");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function resetState() {
  state.mode = "create";
  state.room = null;
  state.roomId = null;
  state.roomName = "";
  state.name = "";
  state.location = "";
  state.lat = null;
  state.lng = null;
  state.groupSize = 4;
  state.selectedDates = [];
  state.selectedTimes = [];
  state.budget = null;
  state.activity = null;
  state.places = [];
  state.selectedPlace = null;
  state.bestTimes = [];

  const fields = [
    "roamName",
    "location",
    "organizerName",
    "joinCode",
    "joinName"
  ];

  fields.forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.value = "";
  });

  const groupSize = document.getElementById("groupSize");

  if (groupSize) {
    groupSize.value = "4";
  }

  const locationStatus =
    document.getElementById("locationStatus");

  if (locationStatus) {
    locationStatus.textContent = "";
  }

  renderDates();
  renderTimes();
  renderBudgets();
  renderActivities();
}

function saveCreateDetails() {
  const roomName = value("roamName");
  const location = value("location");
  const organizerName = value("organizerName");
  const groupSize = Number(value("groupSize"));

  if (!roomName) {
    toast("Give your Roam a name.");
    return;
  }

  if (!location) {
    toast("Add a location.");
    return;
  }

  if (!organizerName) {
    toast("Add your name.");
    return;
  }

  if (groupSize < 2 || groupSize > 50) {
    toast("Choose 2–50 people.");
    return;
  }

  state.roomName = roomName;
  state.location = location;
  state.name = organizerName;
  state.groupSize = groupSize;

  showScreen("dates");
}

function handleDatesNext() {
  if (!state.selectedDates.length) {
    toast("Pick at least one day.");
    return;
  }

  showScreen("times");
}

function handleTimesNext() {
  if (!state.selectedTimes.length) {
    toast("Pick at least one time.");
    return;
  }

  showScreen("budget");
}

function handleBudgetNext() {
  if (state.budget === null) {
    toast("Pick a budget.");
    return;
  }

  showScreen("activity");
}

async function handleActivityNext() {
  if (!state.activity) {
    toast("Pick an activity.");
    return;
  }

  if (state.mode === "create") {
    await createRoam();
  } else {
    await saveJoinedParticipant();
  }
}

function renderDates() {
  const grid = document.getElementById("dateGrid");

  if (!grid) return;

  grid.innerHTML = "";

  DATE_OPTIONS.forEach((date) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "date-card";

    if (state.selectedDates.includes(date.iso)) {
      button.classList.add("selected");
    }

    button.innerHTML = `
      <strong>${date.day}</strong>
      <span>${date.month}</span>
      <small>${date.weekday}</small>
    `;

    button.addEventListener("click", () => {
      if (state.selectedDates.includes(date.iso)) {
        state.selectedDates =
          state.selectedDates.filter(
            (item) => item !== date.iso
          );
      } else {
        state.selectedDates.push(date.iso);
      }

      renderDates();
    });

    grid.appendChild(button);
  });
}

function renderTimes() {
  const grid = document.getElementById("timeGrid");

  if (!grid) return;

  grid.innerHTML = "";

  TIMES.forEach((time) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "time-card";

    if (state.selectedTimes.includes(time)) {
      button.classList.add("selected");
    }

    button.textContent = time;

    button.addEventListener("click", () => {
      if (state.selectedTimes.includes(time)) {
        state.selectedTimes =
          state.selectedTimes.filter(
            (item) => item !== time
          );
      } else {
        state.selectedTimes.push(time);
      }

      renderTimes();
    });

    grid.appendChild(button);
  });
}

function renderBudgets() {
  const grid = document.getElementById("budgetGrid");

  if (!grid) return;

  grid.innerHTML = "";

  BUDGETS.forEach((budget) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "budget-card";

    if (state.budget === budget.value) {
      button.classList.add("selected");
    }

    button.innerHTML = `
      <strong>${budget.label}</strong>
      <span>per person</span>
    `;

    button.addEventListener("click", () => {
      state.budget = budget.value;

      document
        .getElementById("budgetNext")
        ?.removeAttribute("disabled");

      renderBudgets();
    });

    grid.appendChild(button);
  });
}

function renderActivities() {
  const grid = document.getElementById("activityGrid");

  if (!grid) return;

  grid.innerHTML = "";

  ACTIVITIES.forEach((activity) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "activity-card";

    button.innerHTML = `
      <img
        src="${activity.image}"
        alt="${activity.name}"
      >
      <span>${activity.name}</span>
    `;

    button.addEventListener("click", () => {
      state.activity = activity.id;

      document
        .querySelectorAll(".activity-card")
        .forEach((card) => {
          card.classList.remove("selected");
        });

      button.classList.add("selected");

      document
        .getElementById("activityNext")
        ?.removeAttribute("disabled");
    });

    grid.appendChild(button);
  });
}

async function createRoam() {
  if (!supabaseClient) {
    toast("Add your Supabase key in config.js.");
    return;
  }

  const button = document.getElementById("activityNext");

  loading(button, true);

  try {
    const organizerToken = createToken();

    state.organizerToken = organizerToken;

    const code = await generateCode();

    const { data: room, error } =
      await supabaseClient
        .from("rooms")
        .insert({
          code,
          name: state.roomName,
          location_text: state.location,
          lat: state.lat,
          lng: state.lng,
          group_size: state.groupSize,
          candidate_dates: state.selectedDates,
          activity: state.activity,
          organizer_token: organizerToken
        })
        .select()
        .single();

    if (error) throw error;

    state.room = room;
    state.roomId = room.id;

    const { error: participantError } =
      await supabaseClient
        .from("participants")
        .insert({
          room_id: room.id,
          name: state.name,
          participant_token: organizerToken,
          availability: {
            dates: state.selectedDates,
            times: state.selectedTimes
          },
          budget: state.budget
        });

    if (participantError) throw participantError;

    document.getElementById("roomCode").textContent =
      code;

    showScreen("code");
  } catch (error) {
    console.error(error);
    toast("Roam couldn't be created. Try again.");
  } finally {
    loading(button, false);
  }
}

async function generateCode() {
  const words = [
    "PEACH",
    "ORANGE",
    "SUNSET",
    "WANDER",
    "BREEZE",
    "CITRUS",
    "MANGO",
    "ROAM",
    "LAGOON",
    "GELATO",
    "VISTA",
    "BLOSSOM"
  ];

  for (let i = 0; i < 10; i++) {
    const word =
      words[Math.floor(Math.random() * words.length)];

    const { data, error } =
      await supabaseClient
        .from("rooms")
        .select("id")
        .eq("code", word)
        .maybeSingle();

    if (error) throw error;

    if (!data) return word;
  }

  return `ROAM${Math.floor(1000 + Math.random() * 9000)}`;
}

async function findRoom() {
  const code = value("joinCode").toUpperCase();

  if (!code) {
    toast("Enter your Roam code.");
    return;
  }

  if (!supabaseClient) {
    toast("Add your Supabase key in config.js.");
    return;
  }

  const button = document.getElementById("findRoam");

  loading(button, true);

  try {
    const { data: room, error } =
      await supabaseClient
        .from("rooms")
        .select("*")
        .eq("code", code)
        .maybeSingle();

    if (error) throw error;

    if (!room) {
      toast("We couldn't find that Roam.");
      return;
    }

    state.mode = "join";
    state.room = room;
    state.roomId = room.id;
    state.roomName = room.name;
    state.location = room.location_text;
    state.lat = room.lat;
    state.lng = room.lng;
    state.groupSize = room.group_size;
    state.activity = room.activity;

    document.getElementById("joinTitle").textContent =
      room.name;

    document.getElementById("joinLocation").textContent =
      room.location_text;

    document.getElementById("joinCodeDisplay").textContent =
      room.code;

    showScreen("joinConfirm");
  } catch (error) {
    console.error(error);
    toast("Couldn't load that Roam.");
  } finally {
    loading(button, false);
  }
}

function startJoinAvailability() {
  const name = value("joinName");

  if (!name) {
    toast("Add your name.");
    return;
  }

  state.name = name;

  const dates =
    state.room?.candidate_dates || [];

  state.selectedDates = [];
  state.selectedTimes = [];
  state.budget = null;

  renderJoinDates(dates);

  showScreen("dates");
}

function renderJoinDates(dates) {
  const grid = document.getElementById("dateGrid");

  if (!grid) return;

  grid.innerHTML = "";

  dates.forEach((iso) => {
    const info = DATE_OPTIONS.find(
      (date) => date.iso === iso
    );

    const button = document.createElement("button");

    button.type = "button";
    button.className = "date-card";

    button.innerHTML = info
      ? `
        <strong>${info.day}</strong>
        <span>${info.month}</span>
        <small>${info.weekday}</small>
      `
      : formatDate(iso);

    button.addEventListener("click", () => {
      if (state.selectedDates.includes(iso)) {
        state.selectedDates =
          state.selectedDates.filter(
            (item) => item !== iso
          );
      } else {
        state.selectedDates.push(iso);
      }

      renderJoinDates(dates);
    });

    if (state.selectedDates.includes(iso)) {
      button.classList.add("selected");
    }

    grid.appendChild(button);
  });
}

async function saveJoinedParticipant() {
  if (!state.roomId) return;

  if (!supabaseClient) {
    toast("Add your Supabase key in config.js.");
    return;
  }

  const button =
    document.getElementById("activityNext");

  loading(button, true);

  try {
    const token = createToken();

    state.participantToken = token;

    const { error } =
      await supabaseClient
        .from("participants")
        .insert({
          room_id: state.roomId,
          name: state.name,
          participant_token: token,
          availability: {
            dates: state.selectedDates,
            times: state.selectedTimes
          },
          budget: state.budget
        });

    if (error) throw error;

    await openRoam();
  } catch (error) {
    console.error(error);
    toast("Couldn't save your choices.");
  } finally {
    loading(button, false);
  }
}

async function openRoam() {
  showScreen("places");

  const subtitle =
    document.getElementById("placesSubtitle");

  subtitle.textContent =
    "Finding a few places nearby…";

  try {
    state.bestTimes =
      await calculateBestTimes();

    state.places =
      await findPlaces();

    renderPlaces();

    subtitle.textContent =
      state.places.length
        ? "A few places that fit your Roam."
        : "No automatic matches yet.";
  } catch (error) {
    console.error(error);

    state.places = [];

    renderPlaces();

    subtitle.textContent =
      "Your Roam is saved.";
  }
}

async function calculateBestTimes() {
  const { data, error } =
    await supabaseClient
      .from("participants")
      .select("availability")
      .eq("room_id", state.roomId);

  if (error) throw error;

  const scores = {};

  (data || []).forEach((participant) => {
    const availability =
      participant.availability || {};

    const dates =
      availability.dates || [];

    const times =
      availability.times || [];

    dates.forEach((date) => {
      times.forEach((time) => {
        const key = `${date}|${time}`;

        if (!scores[key]) {
          scores[key] = {
            date,
            time,
            count: 0
          };
        }

        scores[key].count++;
      });
    });
  });

  return Object.values(scores)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

async function findPlaces() {
  let lat = state.lat;
  let lng = state.lng;

  if (!lat || !lng) {
    const location =
      await geocode(state.location);

    if (location) {
      lat = location.lat;
      lng = location.lng;
    }
  }

  if (!lat || !lng) return [];

  const activity =
    ACTIVITIES.find(
      (item) => item.id === state.activity
    );

  if (!activity) return [];

  const filters = activity.tags
    .map(
      (tag) =>
        `nwr["amenity"="${tag}"](around:5000,${lat},${lng});`
    )
    .join("");

  const query = `
    [out:json][timeout:15];
    (
      ${filters}
    );
    out center tags;
  `;

  const response = await fetch(
    "https://overpass-api.de/api/interpreter",
    {
      method: "POST",
      body: query
    }
  );

  if (!response.ok) {
    throw new Error("Place search failed.");
  }

  const data = await response.json();

  return (data.elements || [])
    .map((item) => ({
      id: item.id,
      name:
        item.tags?.name ||
        item.tags?.brand ||
        "Nearby place",
      type:
        item.tags?.amenity ||
        "Place",
      address: [
        item.tags?.["addr:housenumber"],
        item.tags?.["addr:street"]
      ]
        .filter(Boolean)
        .join(" ")
    }))
    .filter((place) => place.name)
    .slice(0, 8);
}

async function geocode(location) {
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q: location,
      format: "json",
      limit: "1"
    });

  const response =
    await fetch(url);

  if (!response.ok) return null;

  const data =
    await response.json();

  if (!data.length) return null;

  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon)
  };
}

function renderPlaces() {
  const container =
    document.getElementById("placesList");

  const next =
    document.getElementById("placesNext");

  if (!container) return;

  container.innerHTML = "";

  state.selectedPlace = null;

  if (!state.places.length) {
    container.innerHTML = `
      <div class="empty-card">
        <strong>No automatic matches yet.</strong>
        <p>
          Your Roam is saved. You can choose a place nearby yourself.
        </p>
      </div>
    `;

    next.disabled = false;

    return;
  }

  state.places.forEach((place, index) => {
    const card =
      document.createElement("button");

    card.type = "button";
    card.className = "place-card";

    card.innerHTML = `
      <div class="place-number">
        ${index + 1}
      </div>

      <div class="place-info">
        <strong>${escapeHtml(place.name)}</strong>
        <span>${escapeHtml(
          formatType(place.type)
        )}</span>

        ${
          place.address
            ? `<small>${escapeHtml(
                place.address
              )}</small>`
            : ""
        }
      </div>

      <div class="place-check">
        ✓
      </div>
    `;

    card.addEventListener("click", () => {
      state.selectedPlace = place;

      document
        .querySelectorAll(".place-card")
        .forEach((item) =>
          item.classList.remove("selected")
        );

      card.classList.add("selected");

      next.disabled = false;
    });

    container.appendChild(card);

    if (index === 0) {
      state.selectedPlace = place;
      card.classList.add("selected");
      next.disabled = false;
    }
  });
}

function finishRoam() {
  renderFinalPlan();
  showScreen("final");
}

function renderFinalPlan() {
  const heading =
    document.getElementById("finalHeading");

  const plan =
    document.getElementById("finalPlan");

  const best =
    state.bestTimes[0];

  const when = best
    ? `${formatDate(best.date)} at ${best.time}`
    : "Your group's chosen time";

  const where =
    state.selectedPlace?.name ||
    state.location;

  const activity =
    ACTIVITIES.find(
      (item) => item.id === state.activity
    )?.name || "Hangout";

  const budget =
    BUDGETS.find(
      (item) => item.value === state.budget
    )?.label || "Flexible";

  heading.textContent =
    state.room?.name ||
    state.roomName ||
    "Your Roam";

  plan.innerHTML = `
    <div class="plan-row">
      <span>WHEN</span>
      <strong>${escapeHtml(when)}</strong>
    </div>

    <div class="plan-row">
      <span>WHERE</span>
      <strong>${escapeHtml(where)}</strong>
    </div>

    <div class="plan-row">
      <span>VIBE</span>
      <strong>${escapeHtml(activity)}</strong>
    </div>

    <div class="plan-row">
      <span>BUDGET</span>
      <strong>${escapeHtml(
        budget
      )} per person</strong>
    </div>

    <div class="plan-row">
      <span>ROAM CODE</span>
      <strong>${escapeHtml(
        state.room?.code || ""
      )}</strong>
    </div>
  `;
}

async function copyRoomCode() {
  const code =
    state.room?.code ||
    document.getElementById("roomCode")
      ?.textContent;

  await copy(code);

  toast("Code copied.");
}

async function copyFinalPlan() {
  const best =
    state.bestTimes[0];

  const when = best
    ? `${formatDate(best.date)} at ${best.time}`
    : "TBD";

  const where =
    state.selectedPlace?.name ||
    state.location;

  const activity =
    ACTIVITIES.find(
      (item) => item.id === state.activity
    )?.name || "Hangout";

  const budget =
    BUDGETS.find(
      (item) => item.value === state.budget
    )?.label || "Flexible";

  const text = `${state.room?.name || "Roam"}

WHEN: ${when}
WHERE: ${where}
VIBE: ${activity}
BUDGET: ${budget} per person

Roam code: ${state.room?.code || ""}`;

  await copy(text);

  toast("Plan copied.");
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea =
      document.createElement("textarea");

    textarea.value = text;

    document.body.appendChild(textarea);

    textarea.select();

    document.execCommand("copy");

    textarea.remove();
  }
}

function locateUser() {
  const status =
    document.getElementById(
      "locationStatus"
    );

  if (!navigator.geolocation) {
    toast("Location isn't available.");
    return;
  }

  status.textContent =
    "Finding you…";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      state.lat =
        position.coords.latitude;

      state.lng =
        position.coords.longitude;

      try {
        const location =
          await reverseGeocode(
            state.lat,
            state.lng
          );

        if (location) {
          state.location = location;

          document.getElementById(
            "location"
          ).value = location;
        }

        status.textContent =
          "Location found.";
      } catch {
        status.textContent =
          "Location found.";
      }
    },
    () => {
      status.textContent =
        "Couldn't access your location.";

      toast(
        "You can enter your location manually."
      );
    },
    {
      enableHighAccuracy: true,
      timeout: 10000
    }
  );
}

async function reverseGeocode(lat, lng) {
  const url =
    "https://nominatim.openstreetmap.org/reverse?" +
    new URLSearchParams({
      lat,
      lon: lng,
      format: "json"
    });

  const response =
    await fetch(url);

  if (!response.ok) return null;

  const data =
    await response.json();

  const address =
    data.address || {};

  return [
    address.road,
    address.city ||
      address.town ||
      address.village,
    address.state
  ]
    .filter(Boolean)
    .join(", ");
}

function getDateOptions() {
  const dates = [];

  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date =
      new Date(today);

    date.setDate(
      today.getDate() + i
    );

    dates.push({
      iso: toISO(date),
      day: date.getDate(),
      month: date.toLocaleDateString(
        "en-US",
        { month: "short" }
      ),
      weekday: date.toLocaleDateString(
        "en-US",
        { weekday: "short" }
      )
    });
  }

  return dates;
}

function toISO(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function formatDate(iso) {
  const [year, month, day] =
    iso.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric"
    }
  );
}

function formatType(type) {
  return String(type || "Place")
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) => letter.toUpperCase()
    );
}

function value(id) {
  return (
    document.getElementById(id)
      ?.value
      .trim() || ""
  );
}

function createToken() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return (
    "roam-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2)
  );
}

function loading(button, isLoading) {
  if (!button) return;

  if (isLoading) {
    button.dataset.original =
      button.textContent;

    button.textContent =
      "Saving…";

    button.disabled = true;
  } else {
    button.textContent =
      button.dataset.original ||
      button.textContent;

    button.disabled = false;
  }
}

function toast(message) {
  const element =
    document.getElementById("toast");

  if (!element) {
    alert(message);
    return;
  }

  element.textContent = message;

  element.classList.add("show");

  clearTimeout(
    window.roamToastTimer
  );

  window.roamToastTimer =
    setTimeout(() => {
      element.classList.remove(
        "show"
      );
    }, 3000);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

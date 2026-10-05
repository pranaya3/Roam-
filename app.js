const { createClient } = window.supabase || {};

let supabaseClient = null;

const state = {
  screen: "home",
  mode: "create",

  room: null,
  roomId: null,

  name: "",
  roomName: "",
  location: "",
  lat: null,
  lng: null,
  groupSize: 4,

  selectedDates: [],
  selectedTimes: [],
  budget: null,
  activity: null,

  places: [],
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
    tags: ["restaurant", "cafe", "bar", "fast_food"]
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
    tags: ["park", "garden", "pitch"]
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
    tags: ["bowling_alley", "leisure", "game", "sports_centre"]
  },
  {
    id: "shopping",
    name: "Shopping",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80",
    tags: ["mall", "marketplace", "department_store", "shop"]
  }
];

const DATE_OPTIONS = getDateOptions();

const TIME_OPTIONS = [
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

const BUDGET_OPTIONS = [
  { value: 10, label: "$0–20" },
  { value: 30, label: "$20–40" },
  { value: 50, label: "$40–60" },
  { value: 75, label: "$60–90" },
  { value: 100, label: "$90+" }
];

document.addEventListener("DOMContentLoaded", init);

function init() {
  initializeSupabase();
  renderActivities();
  renderDates();
  renderTimes();
  renderBudgets();
  bindEvents();
  showScreen("home");
}

function initializeSupabase() {
  const config = window.ROAM_CONFIG;

  if (!config || !config.supabaseUrl || !config.supabasePublishableKey) {
    console.error("Roam config is missing.");
    return;
  }

  if (
    config.supabasePublishableKey.includes(
      "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE"
    )
  ) {
    console.error("Roam still has the placeholder Supabase key.");
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
}

function bindEvents() {
  document.querySelectorAll("[data-screen]").forEach((button) => {
    button.addEventListener("click", () => {
      const screen = button.dataset.screen;
      showScreen(screen);
    });
  });

  const createButton = document.getElementById("createRoam");
  if (createButton) {
    createButton.addEventListener("click", startCreate);
  }

  const joinButton = document.getElementById("joinRoam");
  if (joinButton) {
    joinButton.addEventListener("click", () => {
      state.mode = "join";
      showScreen("join");
    });
  }

  const locateButton = document.getElementById("locateBtn");
  if (locateButton) {
    locateButton.addEventListener("click", locateUser);
  }

  const createNext = document.getElementById("createNext");
  if (createNext) {
    createNext.addEventListener("click", saveCreateDetails);
  }

  const datesNext = document.getElementById("datesNext");
  if (datesNext) {
    datesNext.addEventListener("click", handleDatesNext);
  }

  const datesBack = document.getElementById("datesBack");
  if (datesBack) {
    datesBack.addEventListener("click", () => showScreen("create"));
  }

  const timesNext = document.getElementById("timesNext");
  if (timesNext) {
    timesNext.addEventListener("click", handleTimesNext);
  }

  const timesBack = document.getElementById("timesBack");
  if (timesBack) {
    timesBack.addEventListener("click", () => showScreen("dates"));
  }

  const budgetNext = document.getElementById("budgetNext");
  if (budgetNext) {
    budgetNext.addEventListener("click", handleBudgetNext);
  }

  const budgetBack = document.getElementById("budgetBack");
  if (budgetBack) {
    budgetBack.addEventListener("click", () => showScreen("times"));
  }

  const activityNext = document.getElementById("activityNext");
  if (activityNext) {
    activityNext.addEventListener("click", handleActivityNext);
  }

  const activityBack = document.getElementById("activityBack");
  if (activityBack) {
    activityBack.addEventListener("click", () => showScreen("budget"));
  }

  const copyCode = document.getElementById("copyCode");
  if (copyCode) {
    copyCode.addEventListener("click", copyRoomCode);
  }

  const viewRoam = document.getElementById("viewRoam");
  if (viewRoam) {
    viewRoam.addEventListener("click", openRoam);
  }

  const findRoam = document.getElementById("findRoam");
  if (findRoam) {
    findRoam.addEventListener("click", findRoom);
  }

  const joinNext = document.getElementById("joinNext");
  if (joinNext) {
    joinNext.addEventListener("click", startJoinAvailability);
  }

  const placesNext = document.getElementById("placesNext");
  if (placesNext) {
    placesNext.addEventListener("click", finishRoam);
  }

  const placesBack = document.getElementById("placesBack");
  if (placesBack) {
    placesBack.addEventListener("click", () => showScreen("activity"));
  }

  const copyPlan = document.getElementById("copyPlan");
  if (copyPlan) {
    copyPlan.addEventListener("click", copyFinalPlan);
  }

  const doneButton = document.getElementById("doneBtn");
  if (doneButton) {
    doneButton.addEventListener("click", () => showScreen("home"));
  }
}

function showScreen(screenName) {
  state.screen = screenName;

  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });

  const target = document.getElementById(`screen-${screenName}`);

  if (target) {
    target.classList.add("active");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function startCreate() {
  state.mode = "create";

  resetCreateState();

  showScreen("create");
}

function resetCreateState() {
  state.room = null;
  state.roomId = null;
  state.name = "";
  state.roomName = "";
  state.location = "";
  state.lat = null;
  state.lng = null;
  state.groupSize = 4;
  state.selectedDates = [];
  state.selectedTimes = [];
  state.budget = null;
  state.activity = null;
  state.places = [];
  state.bestTimes = [];
  state.organizerToken = null;

  const fields = [
    ["roamName", ""],
    ["location", ""],
    ["organizerName", ""]
  ];

  fields.forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.value = value;
  });

  const groupSize = document.getElementById("groupSize");
  if (groupSize) {
    groupSize.value = "4";
  }

  const status = document.getElementById("locationStatus");
  if (status) {
    status.textContent = "";
  }

  renderDates();
  renderTimes();
  renderBudgets();
  renderActivities();
}

function saveCreateDetails() {
  const roomName = getValue("roamName");
  const location = getValue("location");
  const organizerName = getValue("organizerName");
  const groupSize = Number(getValue("groupSize"));

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

  if (!groupSize || groupSize < 2 || groupSize > 50) {
    toast("Choose a group size between 2 and 50.");
    return;
  }

  state.roomName = roomName;
  state.location = location;
  state.name = organizerName;
  state.groupSize = groupSize;

  showScreen("dates");
}

function handleDatesNext() {
  if (state.selectedDates.length === 0) {
    toast("Pick at least one day.");
    return;
  }

  showScreen("times");
}

function handleTimesNext() {
  if (state.selectedTimes.length === 0) {
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

function renderActivities() {
  const container = document.getElementById("activityGrid");

  if (!container) return;

  container.innerHTML = "";

  ACTIVITIES.forEach((activity) => {
    const card = document.createElement("button");

    card.type = "button";
    card.className = "activity-card";
    card.dataset.activity = activity.id;

    card.innerHTML = `
      <img src="${activity.image}" alt="${escapeHtml(activity.name)}">
      <span>${escapeHtml(activity.name)}</span>
    `;

    card.addEventListener("click", () => {
      state.activity = activity.id;

      document.querySelectorAll(".activity-card").forEach((item) => {
        item.classList.remove("selected");
      });

      card.classList.add("selected");
    });

    container.appendChild(card);
  });
}

function renderDates() {
  const container = document.getElementById("dateGrid");

  if (!container) return;

  container.innerHTML = "";

  DATE_OPTIONS.forEach((date) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "date-card";

    if (state.selectedDates.includes(date.iso)) {
      button.classList.add("selected");
    }

    button.innerHTML = `
      <strong>${escapeHtml(date.day)}</strong>
      <span>${escapeHtml(date.month)}</span>
      <small>${escapeHtml(date.weekday)}</small>
    `;

    button.addEventListener("click", () => {
      if (state.selectedDates.includes(date.iso)) {
        state.selectedDates = state.selectedDates.filter(
          (value) => value !== date.iso
        );
      } else {
        state.selectedDates.push(date.iso);
      }

      renderDates();
    });

    container.appendChild(button);
  });
}

function renderTimes() {
  const container = document.getElementById("timeGrid");

  if (!container) return;

  container.innerHTML = "";

  TIME_OPTIONS.forEach((time) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "time-card";

    if (state.selectedTimes.includes(time)) {
      button.classList.add("selected");
    }

    button.textContent = time;

    button.addEventListener("click", () => {
      if (state.selectedTimes.includes(time)) {
        state.selectedTimes = state.selectedTimes.filter(
          (value) => value !== time
        );
      } else {
        state.selectedTimes.push(time);
      }

      renderTimes();
    });

    container.appendChild(button);
  });
}

function renderBudgets() {
  const container = document.getElementById("budgetGrid");

  if (!container) return;

  container.innerHTML = "";

  BUDGET_OPTIONS.forEach((budget) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "budget-card";

    if (state.budget === budget.value) {
      button.classList.add("selected");
    }

    button.innerHTML = `
      <strong>${escapeHtml(budget.label)}</strong>
      <span>per person</span>
    `;

    button.addEventListener("click", () => {
      state.budget = budget.value;
      renderBudgets();
    });

    container.appendChild(button);
  });
}

async function createRoam() {
  if (!supabaseClient) {
    toast("Roam needs your Supabase key in config.js.");
    return;
  }

  const button = document.getElementById("activityNext");

  setButtonLoading(button, true);

  try {
    state.organizerToken = getOrCreateToken("roam_organizer_token");

    const code = await generateUniqueCode();

    const roomPayload = {
      code,
      name: state.roomName,
      location_text: state.location,
      lat: state.lat,
      lng: state.lng,
      group_size: state.groupSize,
      candidate_dates: state.selectedDates,
      activity: state.activity,
      organizer_token: state.organizerToken
    };

    const { data: room, error: roomError } = await supabaseClient
      .from("rooms")
      .insert(roomPayload)
      .select()
      .single();

    if (roomError) {
      throw roomError;
    }

    state.room = room;
    state.roomId = room.id;

    const { error: participantError } = await supabaseClient
      .from("participants")
      .insert({
        room_id: room.id,
        name: state.name,
        participant_token: state.organizerToken,
        availability: {
          dates: state.selectedDates,
          times: state.selectedTimes
        },
        budget: state.budget
      });

    if (participantError) {
      throw participantError;
    }

    const codeElement = document.getElementById("roomCode");

    if (codeElement) {
      codeElement.textContent = code;
    }

    showScreen("code");
  } catch (error) {
    console.error("Create Roam error:", error);

    if (error?.code === "23505") {
      toast("That Roam code was taken. Try again.");
    } else {
      toast("Roam couldn't save that yet. Check your connection and try again.");
    }
  } finally {
    setButtonLoading(button, false);
  }
}

async function generateUniqueCode() {
  const words = [
    "PEACH",
    "ORANGE",
    "SUNSET",
    "WANDER",
    "GROVE",
    "BREEZE",
    "PICNIC",
    "CITRUS",
    "BLOSSOM",
    "MANGO",
    "SUNNY",
    "ROAM",
    "OLIVE",
    "LAGOON",
    "CANAL",
    "GELATO",
    "TERRACE",
    "VISTA",
    "PALM",
    "SPRITZ"
  ];

  for (let attempt = 0; attempt < 10; attempt++) {
    const word = words[Math.floor(Math.random() * words.length)];

    const { data, error } = await supabaseClient
      .from("rooms")
      .select("id")
      .eq("code", word)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return word;
    }
  }

  return `ROAM${Math.floor(1000 + Math.random() * 9000)}`;
}

async function findRoom() {
  const input = document.getElementById("joinCode");

  if (!input) return;

  const code = input.value.trim().toUpperCase();

  if (!code) {
    toast("Enter a Roam code.");
    return;
  }

  if (!supabaseClient) {
    toast("Roam needs your Supabase key in config.js.");
    return;
  }

  const button = document.getElementById("findRoam");

  setButtonLoading(button, true);

  try {
    const { data: room, error } = await supabaseClient
      .from("rooms")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      throw error;
    }

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
    state.selectedDates = [];
    state.selectedTimes = [];
    state.budget = null;
    state.name = "";

    document.getElementById("joinTitle").textContent = room.name;
    document.getElementById("joinLocation").textContent =
      room.location_text;
    document.getElementById("joinCodeDisplay").textContent = room.code;

    showScreen("join-confirm");
  } catch (error) {
    console.error("Find Roam error:", error);
    toast("We couldn't load that Roam. Check your connection.");
  } finally {
    setButtonLoading(button, false);
  }
}

function startJoinAvailability() {
  const name = getValue("joinName");

  if (!name) {
    toast("Add your name.");
    return;
  }

  state.name = name;

  const candidateDates = Array.isArray(state.room?.candidate_dates)
    ? state.room.candidate_dates
    : [];

  if (candidateDates.length) {
    state.selectedDates = [];
    renderJoinDates(candidateDates);
  } else {
    state.selectedDates = [];
    renderDates();
  }

  showScreen("dates");
}

function renderJoinDates(candidateDates) {
  const container = document.getElementById("dateGrid");

  if (!container) return;

  container.innerHTML = "";

  candidateDates.forEach((iso) => {
    const date = DATE_OPTIONS.find((item) => item.iso === iso);

    const button = document.createElement("button");

    button.type = "button";
    button.className = "date-card";

    if (state.selectedDates.includes(iso)) {
      button.classList.add("selected");
    }

    if (date) {
      button.innerHTML = `
        <strong>${escapeHtml(date.day)}</strong>
        <span>${escapeHtml(date.month)}</span>
        <small>${escapeHtml(date.weekday)}</small>
      `;
    } else {
      button.textContent = formatDate(iso);
    }

    button.addEventListener("click", () => {
      if (state.selectedDates.includes(iso)) {
        state.selectedDates = state.selectedDates.filter(
          (value) => value !== iso
        );
      } else {
        state.selectedDates.push(iso);
      }

      renderJoinDates(candidateDates);
    });

    container.appendChild(button);
  });
}

async function saveJoinedParticipant() {
  if (!state.roomId) {
    toast("Your Roam isn't loaded.");
    return;
  }

  if (!supabaseClient) {
    toast("Roam needs your Supabase key in config.js.");
    return;
  }

  if (state.selectedDates.length === 0) {
    toast("Pick at least one day.");
    return;
  }

  if (state.selectedTimes.length === 0) {
    toast("Pick at least one time.");
    return;
  }

  if (state.budget === null) {
    toast("Pick a budget.");
    return;
  }

  const button = document.getElementById("activityNext");

  setButtonLoading(button, true);

  try {
    state.participantToken = createToken();

    const { error } = await supabaseClient.from("participants").insert({
      room_id: state.roomId,
      name: state.name,
      participant_token: state.participantToken,
      availability: {
        dates: state.selectedDates,
        times: state.selectedTimes
      },
      budget: state.budget
    });

    if (error) {
      throw error;
    }

    await openRoam();

  } catch (error) {
    console.error("Join Roam error:", error);
    toast("Roam couldn't save your choices. Try again.");
  } finally {
    setButtonLoading(button, false);
  }
}

async function openRoam() {
  if (!state.roomId || !state.room) {
    toast("Your Roam isn't ready yet.");
    return;
  }

  showScreen("places");

  const subtitle = document.getElementById("placesSubtitle");

  if (subtitle) {
    subtitle.textContent = "Finding a good spot nearby…";
  }

  const placesList = document.getElementById("placesList");

  if (placesList) {
    placesList.innerHTML = `
      <div class="loading-card">
        <span>Looking around ${escapeHtml(state.location)}…</span>
      </div>
    `;
  }

  try {
    state.bestTimes = await calculateBestTimes();
    state.places = await findPlaces();

    renderPlaces();

    if (subtitle) {
      subtitle.textContent =
        state.places.length > 0
          ? "A few places that fit the vibe."
          : "We couldn't find a nearby spot automatically.";
    }
  } catch (error) {
    console.error("Open Roam error:", error);

    state.places = [];

    renderPlaces();

    if (subtitle) {
      subtitle.textContent =
        "Pick a place nearby that fits your plans.";
    }
  }
}

async function calculateBestTimes() {
  const { data: participants, error } = await supabaseClient
    .from("participants")
    .select("availability")
    .eq("room_id", state.roomId);

  if (error) {
    throw error;
  }

  if (!participants || participants.length === 0) {
    return [];
  }

  const scores = {};

  participants.forEach((participant) => {
    const availability = participant.availability || {};
    const dates = Array.isArray(availability.dates)
      ? availability.dates
      : [];
    const times = Array.isArray(availability.times)
      ? availability.times
      : [];

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

        scores[key].count += 1;
      });
    });
  });

  return Object.values(scores)
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return `${a.date}${a.time}`.localeCompare(
        `${b.date}${b.time}`
      );
    })
    .slice(0, 3);
}

async function findPlaces() {
  let lat = state.lat;
  let lng = state.lng;

  if (!lat || !lng) {
    const geocoded = await geocodeLocation(state.location);

    if (geocoded) {
      lat = geocoded.lat;
      lng = geocoded.lng;
    }
  }

  if (!lat || !lng) {
    return [];
  }

  const activity = ACTIVITIES.find(
    (item) => item.id === state.activity
  );

  if (!activity) {
    return [];
  }

  const radius = 5000;

  const filters = activity.tags
    .map(
      (tag) =>
        `nwr["amenity"="${tag}"](around:${radius},${lat},${lng});`
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
      headers: {
        "Content-Type": "text/plain;charset=UTF-8"
      },
      body: query
    }
  );

  if (!response.ok) {
    throw new Error("Place search failed.");
  }

  const data = await response.json();

  const places = (data.elements || [])
    .map((item) => {
      const tags = item.tags || {};

      return {
        id: item.id,
        name:
          tags.name ||
          tags.brand ||
          tags.operator ||
          "Nearby place",
        type:
          tags.amenity ||
          tags.shop ||
          "Place",
        lat:
          item.lat ??
          item.center?.lat ??
          null,
        lng:
          item.lon ??
          item.center?.lon ??
          null,
        address: buildAddress(tags)
      };
    })
    .filter((place) => place.name)
    .filter(
      (place, index, array) =>
        index ===
        array.findIndex(
          (other) =>
            other.name.toLowerCase() === place.name.toLowerCase()
        )
    )
    .slice(0, 8);

  return places;
}

async function geocodeLocation(location) {
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q: location,
      format: "json",
      limit: "1"
    });

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  if (!data.length) {
    return null;
  }

  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon)
  };
}

function renderPlaces() {
  const container = document.getElementById("placesList");

  if (!container) return;

  container.innerHTML = "";

  if (state.places.length === 0) {
    container.innerHTML = `
      <div class="empty-card">
        <strong>No automatic matches yet.</strong>
        <p>
          Your Roam is saved. You can still choose a nearby place yourself.
        </p>
      </div>
    `;

    return;
  }

  state.places.forEach((place, index) => {
    const card = document.createElement("button");

    card.type = "button";
    card.className = "place-card";

    if (index === 0) {
      card.classList.add("selected");
      state.selectedPlace = place;
    }

    card.innerHTML = `
      <div class="place-number">${index + 1}</div>

      <div class="place-info">
        <strong>${escapeHtml(place.name)}</strong>
        <span>${escapeHtml(formatPlaceType(place.type))}</span>
        ${
          place.address
            ? `<small>${escapeHtml(place.address)}</small>`
            : ""
        }
      </div>

      <div class="place-check">✓</div>
    `;

    card.addEventListener("click", () => {
      state.selectedPlace = place;

      document.querySelectorAll(".place-card").forEach((item) => {
        item.classList.remove("selected");
      });

      card.classList.add("selected");
    });

    container.appendChild(card);
  });
}

function finishRoam() {
  const place = state.selectedPlace || state.places[0] || null;

  state.selectedPlace = place;

  renderFinalPlan();

  showScreen("final");
}

function renderFinalPlan() {
  const heading = document.getElementById("finalHeading");
  const plan = document.getElementById("finalPlan");

  if (!plan) return;

  const room = state.room;

  const best = state.bestTimes[0];

  const when = best
    ? `${formatDate(best.date)} at ${best.time}`
    : "Your group's chosen time";

  const where = state.selectedPlace
    ? state.selectedPlace.name
    : state.location;

  const activityName =
    ACTIVITIES.find((item) => item.id === state.activity)?.name ||
    "Hangout";

  const budget =
    BUDGET_OPTIONS.find((item) => item.value === state.budget)
      ?.label || "Flexible";

  if (heading) {
    heading.textContent = room?.name || state.roomName || "Your Roam";
  }

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
      <strong>${escapeHtml(activityName)}</strong>
    </div>

    <div class="plan-row">
      <span>BUDGET</span>
      <strong>${escapeHtml(budget)} per person</strong>
    </div>

    <div class="plan-row">
      <span>ROAM CODE</span>
      <strong>${escapeHtml(room?.code || "")}</strong>
    </div>
  `;
}

async function copyRoomCode() {
  const code = state.room?.code;

  if (!code) return;

  await copyText(code);

  toast("Roam code copied.");
}

async function copyFinalPlan() {
  const room = state.room;

  const best = state.bestTimes[0];

  const when = best
    ? `${formatDate(best.date)} at ${best.time}`
    : "TBD";

  const where = state.selectedPlace
    ? state.selectedPlace.name
    : state.location;

  const activityName =
    ACTIVITIES.find((item) => item.id === state.activity)?.name ||
    "Hangout";

  const budget =
    BUDGET_OPTIONS.find((item) => item.value === state.budget)
      ?.label || "Flexible";

  const text = `${room?.name || "Roam"}

WHEN: ${when}
WHERE: ${where}
VIBE: ${activityName}
BUDGET: ${budget} per person

Roam code: ${room?.code || ""}`;

  await copyText(text);

  toast("Plan copied.");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);

    textarea.select();

    document.execCommand("copy");

    textarea.remove();
  }
}

function locateUser() {
  const status = document.getElementById("locationStatus");

  if (!navigator.geolocation) {
    toast("Location isn't available in this browser.");
    return;
  }

  if (status) {
    status.textContent = "Finding you…";
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      state.lat = position.coords.latitude;
      state.lng = position.coords.longitude;

      try {
        const location = await reverseGeocode(
          state.lat,
          state.lng
        );

        if (location) {
          state.location = location;

          const input = document.getElementById("location");

          if (input) {
            input.value = location;
          }

          if (status) {
            status.textContent = "Location found.";
          }
        } else {
          if (status) {
            status.textContent = "Location found.";
          }
        }
      } catch {
        if (status) {
          status.textContent = "Location found.";
        }
      }
    },
    () => {
      if (status) {
        status.textContent = "Couldn't access your location.";
      }

      toast("You can enter your location manually.");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
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

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  if (!data || !data.address) {
    return null;
  }

  const address = data.address;

  const parts = [
    address.road,
    address.city ||
      address.town ||
      address.village ||
      address.municipality,
    address.state
  ].filter(Boolean);

  return parts.join(", ");
}

function getDateOptions() {
  const options = [];

  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);

    date.setDate(today.getDate() + i);

    const iso = toISODate(date);

    options.push({
      iso,
      day: date.getDate(),
      month: date.toLocaleDateString("en-US", {
        month: "short"
      }),
      weekday: date.toLocaleDateString("en-US", {
        weekday: "short"
      })
    });
  }

  return options;
}

function formatDate(iso) {
  if (!iso) return "";

  const [year, month, day] = iso.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildAddress(tags) {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"]
  ].filter(Boolean);

  return parts.join(" ");
}

function formatPlaceType(type) {
  if (!type) return "Nearby place";

  return type
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getValue(id) {
  const element = document.getElementById(id);

  return element ? element.value.trim() : "";
}

function createToken() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return (
    "roam-" +
    Date.now() +
    "-" +
    Math.random().toString(36).slice(2)
  );
}

function getOrCreateToken(key) {
  const existing = localStorage.getItem(key);

  if (existing && existing.length >= 20) {
    return existing;
  }

  const token = createToken();

  localStorage.setItem(key, token);

  return token;
}

function setButtonLoading(button, loading) {
  if (!button) return;

  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = "Saving…";
    button.disabled = true;
  } else {
    button.textContent =
      button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function toast(message) {
  const element = document.getElementById("toast");

  if (!element) {
    alert(message);
    return;
  }

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(window.roamToastTimer);

  window.roamToastTimer = setTimeout(() => {
    element.classList.remove("show");
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

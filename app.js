/* =========================================================
   ROAM — APP.JS
   ========================================================= */

/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL =
  "https://vvbgksamdlhkkchyhlyl.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_WaNsM-y0X9VH8pgnAQYFkg_2o68bx6S";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =========================================================
   STATE
   ========================================================= */

const state = {
  roomId: null,
  roomCode: null,

  organizerToken: null,
  participantToken: null,
  participantId: null,

  joinedRoom: false,

  roamName: "",
  location: "",
  latitude: null,
  longitude: null,

  groupSize:
    Number(localStorage.getItem("roamGroupSize")) || 4,

  selectedDates: [],
  selectedTimes: [],

  participantName: "",
  budget: null,

  activity: null,

  selectedTime: null,
  selectedPlace: null,

  results: []
};


/* =========================================================
   TIME OPTIONS
   ========================================================= */

const TIME_OPTIONS = [
  "10:00 AM",
  "12:00 PM",
  "2:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
  "11:00 PM"
];


/* =========================================================
   5-WORD ROAM CODES
   ========================================================= */

const codeWords = [
  [
    "HAPPY",
    "SUNNY",
    "COZY",
    "CHILL",
    "BRIGHT",
    "SWEET",
    "WILD",
    "GOLDEN",
    "LAZY",
    "FRESH",
    "FUN",
    "GOOD"
  ],
  [
    "SUNSET",
    "SUNRISE",
    "WEEKEND",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
    "MOON",
    "STAR",
    "SUMMER",
    "AUTUMN",
    "SPRING",
    "WINTER"
  ],
  [
    "PIZZA",
    "TACOS",
    "PASTA",
    "PEACH",
    "COOKIE",
    "COFFEE",
    "CAKE",
    "BURGER",
    "NOODLES",
    "WAFFLE",
    "DONUT",
    "SUSHI"
  ],
  [
    "MUSIC",
    "MOVIE",
    "DANCE",
    "GAME",
    "PARK",
    "BEACH",
    "CAFE",
    "PICNIC",
    "HIKE",
    "SHOPPING",
    "DINNER",
    "ADVENTURE"
  ],
  [
    "FRIENDS",
    "VIBES",
    "FUN",
    "LAUGHS",
    "MEMORIES",
    "HANGOUT",
    "PLANS",
    "ROAM",
    "GOODTIMES",
    "SMILES",
    "STORIES",
    "CHILL"
  ]
];


function generateRoomCode() {
  return codeWords
    .map(words => {
      return words[
        Math.floor(Math.random() * words.length)
      ];
    })
    .join(" · ");
}


function normalizeInvitePhrase(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*[·•|,/]+\s*/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(word => word.toUpperCase())
    .join(" · ");
}


function displayInvitePhrase(value) {
  return normalizeInvitePhrase(value);
}


function isValidInvitePhrase(value) {
  const normalized = normalizeInvitePhrase(value);

  if (!normalized) {
    return false;
  }

  const words = normalized
    .split(" · ")
    .filter(Boolean);

  return words.length === 5;
}


/* =========================================================
   TOKEN
   ========================================================= */

function generateToken() {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}


/* =========================================================
   ACTIVITIES
   ========================================================= */

const ACTIVITY_DATA = {
  eat: {
    label: "Food",
    tags: ["restaurant", "cafe", "fast_food"]
  },

  movies: {
    label: "Movies",
    tags: ["cinema"]
  },

  bowling: {
    label: "Bowling",
    tags: ["bowling_alley"]
  },

  coffee: {
    label: "Coffee",
    tags: ["cafe"]
  },

  outdoors: {
    label: "Outdoors",
    tags: ["park", "garden", "nature_reserve"]
  },

  arts: {
    label: "Arts & culture",
    tags: ["museum", "gallery", "arts_centre"]
  },

  games: {
    label: "Games",
    tags: ["amusement_arcade", "bowling_alley"]
  },

  other: {
    label: "Something else",
    tags: ["attraction", "community_centre"]
  }
};


/* =========================================================
   SCREEN NAVIGATION
   ========================================================= */

const SCREEN_PROGRESS = {
  home: 0,
  details: 1,
  created: 1,
  dates: 2,
  availability: 3,
  budget: 4,
  activity: 5,
  results: 6,
  places: 7,
  final: 8,

  join: 0,
  joinConfirm: 1
};


function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const screen = document.getElementById(screenId);

  if (screen) {
    screen.classList.add("active");
  }

  updateProgress(screenId);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function updateProgress(screenId) {
  const progress = document.getElementById("progress");
  const progressText =
    document.getElementById("progressText");

  if (!progress || !progressText) {
    return;
  }

  const step = SCREEN_PROGRESS[screenId];

  if (step === undefined) {
    progress.style.width = "0%";
    progressText.textContent = "";
    return;
  }

  if (screenId === "home") {
    progress.style.width = "0%";
    progressText.textContent = "";
    return;
  }

  if (screenId === "created") {
    progress.style.width = "15%";
    progressText.textContent = "Your Roam is ready";
    return;
  }

  if (screenId === "join" || screenId === "joinConfirm") {
    progress.style.width =
      `${Math.max(10, step * 25)}%`;

    progressText.textContent = "Join a Roam";
    return;
  }

  const percent = Math.min(
    100,
    Math.round((step / 8) * 100)
  );

  progress.style.width = `${percent}%`;

  const labels = {
    details: "Start your Roam",
    dates: "Pick some dates",
    availability: "Find a time",
    budget: "Set a budget",
    activity: "Choose an activity",
    results: "Best matches",
    places: "Pick a place",
    final: "Your Roam"
  };

  progressText.textContent =
    labels[screenId] || "";
}


/* =========================================================
   START ROAM
   ========================================================= */

function startRoam() {
  state.roomId = null;
  state.roomCode = null;
  state.organizerToken = generateToken();
  state.participantToken = generateToken();
  state.participantId = null;

  state.joinedRoom = false;

  state.roamName = "";
  state.location = "";
  state.latitude = null;
  state.longitude = null;

  state.selectedDates = [];
  state.selectedTimes = [];

  state.participantName = "";
  state.budget = null;
  state.activity = null;

  state.selectedTime = null;
  state.selectedPlace = null;
  state.results = [];

  localStorage.removeItem("roamCode");
  localStorage.removeItem("roamRoomId");

  const nameInput =
    document.getElementById("roamName");

  const locationInput =
    document.getElementById("location");

  if (nameInput) {
    nameInput.value = "";
  }

  if (locationInput) {
    locationInput.value = "";
  }

  const participantInput =
    document.getElementById("participantName");

  if (participantInput) {
    participantInput.value = "";
  }

  document
    .querySelectorAll(".budget-card")
    .forEach(card => {
      card.classList.remove("selected");
    });

  renderDates();

  showScreen("details");
}


/* =========================================================
   CREATE ROAM
   ========================================================= */

async function saveRoamDetails() {
  const nameInput =
    document.getElementById("roamName");

  const locationInput =
    document.getElementById("location");

  const name =
    nameInput?.value.trim() || "";

  const locationText =
    locationInput?.value.trim() ||
    state.location ||
    "";

  if (!name) {
    showToast("Give your Roam a name.");
    return;
  }

  if (!locationText && !state.latitude) {
    showToast("Add a location for your Roam.");
    return;
  }

  state.roamName = name;
  state.location = locationText;

  if (!state.organizerToken) {
    state.organizerToken = generateToken();
  }

  try {
    showToast("Creating your Roam...");

    const code =
      await createUniqueRoomCode();

    const insertData = {
      code,
      name: state.roamName,
      location_text:
        state.location || "Current location",
      lat: state.latitude,
      lng: state.longitude,
      group_size: state.groupSize,
      candidate_dates: [],
      activity: null,
      organizer_token: state.organizerToken
    };

    const { data, error } =
      await db
        .from("rooms")
        .insert(insertData)
        .select()
        .single();

    if (error) {
      throw error;
    }

    state.roomId = data.id;
    state.roomCode = data.code;

    localStorage.setItem(
      "roamCode",
      state.roomCode
    );

    localStorage.setItem(
      "roamRoomId",
      state.roomId
    );

    setMiniCode(state.roomCode);

    const invitePhrase =
      document.getElementById("invitePhrase");

    if (invitePhrase) {
      invitePhrase.textContent =
        displayInvitePhrase(state.roomCode);
    }

    showScreen("created");

  } catch (error) {
    console.error(
      "Could not create Roam:",
      error
    );

    const details =
      error?.message ||
      error?.details ||
      error?.hint ||
      "Unknown Supabase error.";

    showToast(
      `Could not create Roam: ${details}`
    );
  }
}


/* =========================================================
   UNIQUE 5-WORD CODE
   ========================================================= */

async function createUniqueRoomCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code =
      normalizeInvitePhrase(
        generateRoomCode()
      );

    if (!isValidInvitePhrase(code)) {
      continue;
    }

    const {
      data,
      error
    } = await db
      .from("rooms")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return code;
    }
  }

  throw new Error(
    "Could not create a unique 5-word Roam code."
  );
}


/* =========================================================
   CREATED SCREEN
   ========================================================= */

function setMiniCode(code) {
  const mini =
    document.getElementById("roamCodeMiniText");

  if (mini) {
    mini.textContent =
      displayInvitePhrase(code);
  }

  const miniWrap =
    document.getElementById("roamCodeMini");

  if (miniWrap) {
    miniWrap.style.display = "flex";
  }
}


async function copyRoamCode() {
  if (!state.roomCode) {
    showToast("No Roam code yet.");
    return;
  }

  try {
    await navigator.clipboard.writeText(
      displayInvitePhrase(state.roomCode)
    );

    showToast("Roam code copied!");
  } catch {
    showToast(
      displayInvitePhrase(state.roomCode)
    );
  }
}


async function shareRoamCode() {
  if (!state.roomCode) {
    return;
  }

  const code =
    displayInvitePhrase(state.roomCode);

  const text =
    `Join my Roam: ${code}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Join my Roam",
        text
      });

      return;
    } catch {
      // User closed share menu.
    }
  }

  await copyRoamCode();
}


function continueAfterCreate() {
  renderDates();
  showScreen("dates");
}


/* =========================================================
   DATES
   ========================================================= */

function renderDates() {
  const container =
    document.getElementById("dateGrid");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  const today = new Date();

  for (let i = 0; i < 10; i++) {
    const date = new Date(today);

    date.setDate(
      today.getDate() + i
    );

    const iso =
      date.toISOString().split("T")[0];

    const weekday =
      date.toLocaleDateString(
        "en-US",
        { weekday: "short" }
      );

    const month =
      date.toLocaleDateString(
        "en-US",
        { month: "short" }
      );

    const day =
      date.getDate();

    const card =
      document.createElement("button");

    card.type = "button";
    card.className = "date-card";

    if (
      state.selectedDates.includes(iso)
    ) {
      card.classList.add("selected");
    }

    card.innerHTML = `
      <span>${weekday}</span>
      <strong>${day}</strong>
      <small>${month}</small>
    `;

    card.addEventListener(
      "click",
      () => toggleDate(iso, card)
    );

    container.appendChild(card);
  }
}


function toggleDate(iso, element) {
  if (
    state.selectedDates.includes(iso)
  ) {
    state.selectedDates =
      state.selectedDates.filter(
        date => date !== iso
      );

    element.classList.remove("selected");

  } else {
    state.selectedDates.push(iso);

    element.classList.add("selected");
  }
}


async function saveDates() {
  if (
    state.selectedDates.length === 0
  ) {
    showToast(
      "Pick at least one date."
    );
    return;
  }

  if (
    !state.joinedRoom &&
    state.roomId
  ) {
    const {
      error
    } = await db
      .from("rooms")
      .update({
        candidate_dates:
          state.selectedDates
      })
      .eq("id", state.roomId);

    if (error) {
      console.error(error);
      showToast(
        "Could not save your dates."
      );
      return;
    }
  }

  renderTimes();
  showScreen("availability");
}


/* =========================================================
   TIMES
   ========================================================= */

function renderTimes() {
  const container =
    document.getElementById("timeGrid");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  state.selectedTimes = [];

  TIME_OPTIONS.forEach(time => {
    const button =
      document.createElement("button");

    button.type = "button";
    button.className = "time-card";

    button.textContent = time;

    button.addEventListener(
      "click",
      () => toggleTime(time, button)
    );

    container.appendChild(button);
  });
}


function toggleTime(time, element) {
  if (
    state.selectedTimes.includes(time)
  ) {
    state.selectedTimes =
      state.selectedTimes.filter(
        value => value !== time
      );

    element.classList.remove("selected");

  } else {
    state.selectedTimes.push(time);

    element.classList.add("selected");
  }
}


/* =========================================================
   AVAILABILITY
   ========================================================= */

function saveAvailability() {
  const input =
    document.getElementById(
      "participantName"
    );

  const name =
    input?.value.trim() || "";

  if (!name) {
    showToast(
      "Enter your name first."
    );
    return;
  }

  if (
    state.selectedTimes.length === 0
  ) {
    showToast(
      "Pick at least one time."
    );
    return;
  }

  state.participantName = name;

  showScreen("budget");
}


/* =========================================================
   BUDGET
   ========================================================= */

function selectBudget(amount, element) {
  state.budget = amount;

  document
    .querySelectorAll(".budget-card")
    .forEach(card => {
      card.classList.remove("selected");
    });

  if (element) {
    element.classList.add("selected");
  }
}


async function finishBudget() {
  if (state.budget === null) {
    showToast(
      "Choose a budget first."
    );
    return;
  }

  if (!state.roomId) {
    showToast(
      "Your Roam is not ready yet."
    );
    return;
  }

  try {
    const availability = {
      dates: state.selectedDates,
      times: state.selectedTimes
    };

    const participantData = {
      room_id: state.roomId,
      name: state.participantName,
      participant_token:
        state.participantToken ||
        generateToken(),
      availability,
      budget: state.budget
    };

    state.participantToken =
      participantData.participant_token;

    const {
      data,
      error
    } = await db
      .from("participants")
      .insert(participantData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    state.participantId = data.id;

    if (state.joinedRoom) {
      const room =
        await getCurrentRoom();

      if (room?.activity) {
        state.activity =
          room.activity;

        await generateResults();
        showScreen("results");
      } else {
        showToast(
          "You're in! Waiting for the organizer to choose an activity."
        );
      }

      return;
    }

    showScreen("activity");

  } catch (error) {
    console.error(
      "Could not save participant:",
      error
    );

    showToast(
      error?.message ||
      "Could not save your availability."
    );
  }
}


/* =========================================================
   CURRENT ROOM
   ========================================================= */

async function getCurrentRoom() {
  if (!state.roomId) {
    return null;
  }

  const {
    data,
    error
  } = await db
    .from("rooms")
    .select("*")
    .eq("id", state.roomId)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}


/* =========================================================
   ACTIVITY
   ========================================================= */

async function selectActivity(activity) {
  if (!ACTIVITY_DATA[activity]) {
    return;
  }

  state.activity = activity;

  try {
    if (
      !state.joinedRoom &&
      state.roomId
    ) {
      const {
        error
      } = await db
        .from("rooms")
        .update({
          activity
        })
        .eq("id", state.roomId);

      if (error) {
        throw error;
      }
    }

    await generateResults();

    showScreen("results");

  } catch (error) {
    console.error(
      "Could not select activity:",
      error
    );

    showToast(
      error?.message ||
      "Could not save activity."
    );
  }
}


/* =========================================================
   RESULTS
   ========================================================= */

async function generateResults() {
  if (!state.roomId) {
    return;
  }

  try {
    const {
      data: participants,
      error
    } = await db
      .from("participants")
      .select(
        "id,name,availability,budget"
      )
      .eq(
        "room_id",
        state.roomId
      );

    if (error) {
      throw error;
    }

    const scores = {};

    participants.forEach(participant => {
      const availability =
        participant.availability || {};

      const dates =
        availability.dates || [];

      const times =
        availability.times || [];

      dates.forEach(date => {
        times.forEach(time => {
          const key =
            `${date}|${time}`;

          if (!scores[key]) {
            scores[key] = {
              date,
              time,
              count: 0,
              people: []
            };
          }

          scores[key].count += 1;

          scores[key].people.push(
            participant.name
          );
        });
      });
    });

    let results =
      Object.values(scores)
        .sort(
          (a, b) =>
            b.count - a.count ||
            a.date.localeCompare(
              b.date
            )
        )
        .slice(0, 3);

    if (results.length === 0) {
      const fallbackDate =
        state.selectedDates[0];

      const fallbackTime =
        state.selectedTimes[0];

      if (
        fallbackDate &&
        fallbackTime
      ) {
        results = [
          {
            date: fallbackDate,
            time: fallbackTime,
            count: 1,
            people: []
          }
        ];
      }
    }

    state.results = results;
    state.selectedTime =
      results[0] || null;

    renderResults(results);

    await loadAverageBudget();

  } catch (error) {
    console.error(
      "Could not generate results:",
      error
    );

    showToast(
      error?.message ||
      "Could not calculate the best times."
    );
  }
}


function renderResults(results) {
  const container =
    document.getElementById(
      "resultsList"
    );

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!results.length) {
    container.innerHTML = `
      <div class="result-card">
        <strong>No matches yet</strong>
        <p>
          Add more availability to find
          the best time.
        </p>
      </div>
    `;

    return;
  }

  results.forEach(
    (result, index) => {
      const card =
        document.createElement("button");

      card.type = "button";
      card.className = "result-card";

      if (index === 0) {
        card.classList.add("best");
      }

      const date =
        new Date(
          `${result.date}T12:00:00`
        );

      const dateText =
        date.toLocaleDateString(
          "en-US",
          {
            weekday: "long",
            month: "long",
            day: "numeric"
          }
        );

      card.innerHTML = `
        <div>
          <span class="match-badge">
            ${index === 0 ? "Best match" : `Option ${index + 1}`}
          </span>

          <h3>${dateText}</h3>

          <p>
            ${escapeHtml(result.time)}
          </p>
        </div>

        <strong>
          ${result.count}
          ${result.count === 1 ? "person" : "people"}
        </strong>
      `;

      card.addEventListener(
        "click",
        () => {
          state.selectedTime = result;

          document
            .querySelectorAll(".result-card")
            .forEach(item => {
              item.classList.remove(
                "selected"
              );
            });

          card.classList.add(
            "selected"
          );
        }
      );

      container.appendChild(card);
    }
  );
}


/* =========================================================
   AVERAGE BUDGET
   ========================================================= */

async function loadAverageBudget() {
  const element =
    document.getElementById(
      "averageBudget"
    );

  if (!element || !state.roomId) {
    return;
  }

  try {
    const {
      data,
      error
    } = await db.rpc(
      "get_room_average_budget",
      {
        room_uuid: state.roomId
      }
    );

    if (error) {
      throw error;
    }

    const average =
      Array.isArray(data)
        ? data[0]?.average_budget
        : data?.average_budget;

    if (
      average !== null &&
      average !== undefined
    ) {
      element.textContent =
        `$${Number(average).toFixed(2)}`;
    } else {
      element.textContent =
        "No budget yet";
    }

  } catch (error) {
    console.error(
      "Average budget error:",
      error
    );

    element.textContent =
      "Budget unavailable";
  }
}


/* =========================================================
   CONTINUE TO PLACES
   ========================================================= */

async function continueToPlaces() {
  if (!state.selectedTime) {
    state.selectedTime =
      state.results[0] || null;
  }

  if (!state.selectedTime) {
    showToast(
      "Choose a time first."
    );
    return;
  }

  showScreen("places");

  await showPlaces();
}


/* =========================================================
   PLACES
   ========================================================= */

async function showPlaces() {
  const loading =
    document.getElementById(
      "placesLoading"
    );

  const list =
    document.getElementById(
      "placesList"
    );

  const subtitle =
    document.getElementById(
      "placesSubtitle"
    );

  if (loading) {
    loading.style.display = "flex";
  }

  if (list) {
    list.innerHTML = "";
  }

  if (subtitle) {
    subtitle.textContent =
      state.activity &&
      ACTIVITY_DATA[state.activity]
        ? `Places for ${ACTIVITY_DATA[state.activity].label.toLowerCase()} near you`
        : "Places near you";
  }

  try {
    let lat = state.latitude;
    let lng = state.longitude;

    if (
      lat === null ||
      lng === null
    ) {
      const coords =
        await geocodeLocation(
          state.location
        );

      if (coords) {
        lat = coords.lat;
        lng = coords.lng;

        state.latitude = lat;
        state.longitude = lng;
      }
    }

    if (
      lat === null ||
      lng === null
    ) {
      renderFallbackPlaces();
      return;
    }

    const places =
      await findNearbyPlaces(
        lat,
        lng
      );

    renderPlaces(places);

  } catch (error) {
    console.error(
      "Places error:",
      error
    );

    renderFallbackPlaces();

  } finally {
    if (loading) {
      loading.style.display = "none";
    }
  }
}


async function findNearbyPlaces(
  lat,
  lng
) {
  const activity =
    ACTIVITY_DATA[state.activity] ||
    ACTIVITY_DATA.other;

  const tags =
    activity.tags || [];

  const queries =
    tags.map(
      tag =>
        `nwr(around:7000,${lat},${lng})[amenity=${tag}];`
    ).join("\n");

  const query = `
    [out:json][timeout:25];
    (
      ${queries}
    );
    out center tags;
  `;

  const response =
    await fetch(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },
        body:
          `data=${encodeURIComponent(query)}`
      }
    );

  if (!response.ok) {
    throw new Error(
      "Nearby places could not be loaded."
    );
  }

  const data =
    await response.json();

  return cleanPlaces(
    data.elements || [],
    lat,
    lng
  );
}


/* =========================================================
   CLEAN PLACES
   ========================================================= */

function cleanPlaces(
  elements,
  userLat,
  userLng
) {
  const seen = new Set();

  return elements
    .map(element => {
      const tags =
        element.tags || {};

      const lat =
        element.lat ??
        element.center?.lat;

      const lng =
        element.lon ??
        element.center?.lon;

      if (
        lat === undefined ||
        lng === undefined
      ) {
        return null;
      }

      const name =
        tags.name ||
        tags["name:en"];

      if (!name) {
        return null;
      }

      const key =
        name.toLowerCase();

      if (seen.has(key)) {
        return null;
      }

      seen.add(key);

      return {
        id:
          `${element.type}-${element.id}`,

        name,

        category:
          formatCategory(
            tags.amenity ||
            tags.tourism ||
            tags.leisure ||
            "Place"
          ),

        lat,
        lng,

        distance:
          calculateDistance(
            userLat,
            userLng,
            lat,
            lng
          ),

        address:
          tags["addr:street"]
            ? `${tags["addr:housenumber"] || ""} ${tags["addr:street"]}`
                .trim()
            : "",

        website:
          tags.website ||
          tags["contact:website"] ||
          "",

        phone:
          tags.phone ||
          tags["contact:phone"] ||
          ""
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        a.distance - b.distance
    )
    .slice(0, 12);
}


/* =========================================================
   RENDER PLACES
   ========================================================= */

function renderPlaces(places) {
  const container =
    document.getElementById(
      "placesList"
    );

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!places.length) {
    renderFallbackPlaces();
    return;
  }

  places.forEach(place => {
    const card =
      document.createElement("div");

    card.className = "place-card";

    const image =
      getPlaceImage(
        state.activity
      );

    card.innerHTML = `
      <div
        class="place-image"
        style="background-image:url('${image}')"
      ></div>

      <div class="place-content">
        <div class="place-info">
          <h3>
            ${escapeHtml(place.name)}
          </h3>

          <p>
            ${escapeHtml(place.category)}
          </p>

          <small>
            ${place.distance.toFixed(1)} miles away
          </small>

          ${
            place.address
              ? `<small>${escapeHtml(place.address)}</small>`
              : ""
          }
        </div>

        <button
          type="button"
          class="place-action"
        >
          Choose
        </button>
      </div>
    `;

    const button =
      card.querySelector(
        ".place-action"
      );

    button.addEventListener(
      "click",
      () => choosePlace(place)
    );

    container.appendChild(card);
  });
}


function renderFallbackPlaces() {
  const container =
    document.getElementById(
      "placesList"
    );

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="place-card">
      <div class="place-content">
        <div class="place-info">
          <h3>Find a nearby place</h3>

          <p>
            We couldn't load nearby places right now.
          </p>
        </div>

        <button
          type="button"
          class="place-action"
          onclick="openMapsSearch()"
        >
          Open Maps
        </button>
      </div>
    </div>
  `;
}


function getPlaceImage(activity) {
  const images = {
    eat:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",

    movies:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80",

    bowling:
      "https://images.unsplash.com/photo-1529678407585-55ac0053aa47?auto=format&fit=crop&w=900&q=80",

    coffee:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",

    outdoors:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80",

    arts:
      "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=80",

    games:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80",

    other:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80"
  };

  return (
    images[activity] ||
    images.other
  );
}


/* =========================================================
   CHOOSE PLACE
   ========================================================= */

function choosePlace(place) {
  state.selectedPlace = place;

  buildFinalPlan();

  showScreen("final");
}


function buildFinalPlan() {
  const selected =
    state.selectedTime ||
    state.results[0];

  const finalDate =
    document.getElementById(
      "finalDate"
    );

  const finalTime =
    document.getElementById(
      "finalTime"
    );

  const finalActivity =
    document.getElementById(
      "finalActivity"
    );

  const finalPlace =
    document.getElementById(
      "finalPlace"
    );

  const finalPeople =
    document.getElementById(
      "finalPeople"
    );

  const finalBudget =
    document.getElementById(
      "finalBudget"
    );

  if (selected && finalDate) {
    const date =
      new Date(
        `${selected.date}T12:00:00`
      );

    finalDate.textContent =
      date.toLocaleDateString(
        "en-US",
        {
          weekday: "long",
          month: "long",
          day: "numeric"
        }
      );
  }

  if (
    selected &&
    finalTime
  ) {
    finalTime.textContent =
      selected.time;
  }

  if (
    finalActivity
  ) {
    finalActivity.textContent =
      ACTIVITY_DATA[state.activity]
        ?.label ||
      "Hangout";
  }

  if (
    finalPlace
  ) {
    finalPlace.textContent =
      state.selectedPlace?.name ||
      "Your chosen place";
  }

  if (
    finalPeople
  ) {
    finalPeople.textContent =
      `${state.groupSize} people`;
  }

  if (
    finalBudget
  ) {
    if (state.budget !== null) {
      finalBudget.textContent =
        `$${Number(state.budget).toFixed(0)} / person`;
    } else {
      finalBudget.textContent =
        "Flexible";
    }
  }
}


/* =========================================================
   FINAL PLAN TEXT
   ========================================================= */

function getPlanText() {
  const selected =
    state.selectedTime ||
    state.results[0];

  let dateText = "";

  if (selected?.date) {
    const date =
      new Date(
        `${selected.date}T12:00:00`
      );

    dateText =
      date.toLocaleDateString(
        "en-US",
        {
          weekday: "long",
          month: "long",
          day: "numeric"
        }
      );
  }

  const activity =
    ACTIVITY_DATA[state.activity]
      ?.label ||
    "Hangout";

  const place =
    state.selectedPlace?.name ||
    "our chosen place";

  const people =
    state.groupSize || "the group";

  const budgetText =
    state.budget !== null
      ? `Budget: about $${Number(state.budget).toFixed(0)} per person.`
      : "";

  return `
Roam plan 🌿

${state.roamName || "Our Roam"}

${dateText}
${selected?.time || ""}
${activity}
${place}

${people} people

${budgetText}

Roam code:
${displayInvitePhrase(
  state.roomCode || ""
)}
  `.trim();
}


async function copyPlan() {
  try {
    await navigator.clipboard.writeText(
      getPlanText()
    );

    showToast(
      "Plan copied!"
    );

  } catch {
    showToast(
      "Couldn't copy the plan."
    );
  }
}


async function sharePlan() {
  const text =
    getPlanText();

  if (navigator.share) {
    try {
      await navigator.share({
        title:
          state.roamName ||
          "Roam plan",
        text
      });

      return;

    } catch {
      // User closed share menu.
    }
  }

  await copyPlan();
}


function startOver() {
  startRoam();
}


/* =========================================================
   LOCATION
   ========================================================= */

function getUserLocation() {
  const input =
    document.getElementById(
      "location"
    );

  const status =
    document.getElementById(
      "locationStatus"
    );

  if (status) {
    status.textContent =
      "Finding your location...";
  }

  if (!navigator.geolocation) {
    if (status) {
      status.textContent =
        "Location isn't available.";
    }

    showToast(
      "Your browser doesn't support location."
    );

    return;
  }

  navigator.geolocation.getCurrentPosition(
    async position => {
      state.latitude =
        position.coords.latitude;

      state.longitude =
        position.coords.longitude;

      try {
        const address =
          await reverseGeocode(
            state.latitude,
            state.longitude
          );

        if (address) {
          state.location =
            address;

          if (input) {
            input.value =
              address;
          }
        }

        if (status) {
          status.textContent =
            "Location found.";
        }

      } catch {
        if (status) {
          status.textContent =
            "Location found.";
        }
      }
    },

    error => {
      console.error(
        "Geolocation error:",
        error
      );

      if (status) {
        status.textContent =
          "Couldn't access your location.";
      }

      showToast(
        "Couldn't access your location."
      );
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }
  );
}


async function reverseGeocode(
  lat,
  lng
) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(
      lng
    )}`;

  const response =
    await fetch(url, {
      headers: {
        Accept:
          "application/json"
      }
    });

  if (!response.ok) {
    throw new Error(
      "Reverse geocoding failed."
    );
  }

  const data =
    await response.json();

  const address =
    data.address || {};

  return (
    address.city ||
    address.town ||
    address.village ||
    address.suburb ||
    address.county ||
    data.display_name ||
    ""
  );
}


async function geocodeLocation(
  locationText
) {
  if (!locationText) {
    return null;
  }

  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
      locationText
    )}`;

  const response =
    await fetch(url, {
      headers: {
        Accept:
          "application/json"
      }
    });

  if (!response.ok) {
    throw new Error(
      "Location search failed."
    );
  }

  const data =
    await response.json();

  if (!data.length) {
    return null;
  }

  return {
    lat:
      Number(data[0].lat),

    lng:
      Number(data[0].lon)
  };
}


/* =========================================================
   GOOGLE MAPS EXTERNAL SEARCH
   ========================================================= */

function openMapsSearch() {
  const query =
    [
      ACTIVITY_DATA[state.activity]
        ?.label || "places",
      state.location || ""
    ]
      .filter(Boolean)
      .join(" ");

  const url =
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      query
    )}`;

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}


/* =========================================================
   JOIN FLOW
   ========================================================= */

function openJoinScreen() {
  const input =
    document.getElementById(
      "joinCode"
    );

  const savedCode =
    localStorage.getItem(
      "roamCode"
    );

  if (
    input &&
    savedCode
  ) {
    input.value =
      displayInvitePhrase(
        savedCode
      );
  }

  showScreen("join");
}


async function joinRoam() {
  const input =
    document.getElementById(
      "joinCode"
    );

  const raw =
    input?.value.trim() || "";

  const code =
    normalizeInvitePhrase(raw);

  if (!isValidInvitePhrase(code)) {
    showToast(
      "Enter all 5 words of the Roam code."
    );
    return;
  }

  try {
    showToast(
      "Finding your Roam..."
    );

    const {
      data,
      error
    } = await db
      .from("rooms")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      showToast(
        "We couldn't find that Roam."
      );
      return;
    }

    loadRoomIntoState(data);

    const roomName =
      document.getElementById(
        "joinRoomName"
      );

    const roomCode =
      document.getElementById(
        "joinRoomCode"
      );

    const roomLocation =
      document.getElementById(
        "joinRoomLocation"
      );

    if (roomName) {
      roomName.textContent =
        data.name;
    }

    if (roomCode) {
      roomCode.textContent =
        displayInvitePhrase(
          data.code
        );
    }

    if (roomLocation) {
      roomLocation.textContent =
        data.location_text ||
        "Location not specified";
    }

    showScreen("joinConfirm");

  } catch (error) {
    console.error(
      "Join error:",
      error
    );

    showToast(
      error?.message ||
      "Couldn't join that Roam."
    );
  }
}


function loadRoomIntoState(room) {
  state.roomId =
    room.id;

  state.roomCode =
    room.code;

  state.roamName =
    room.name;

  state.location =
    room.location_text || "";

  state.latitude =
    room.lat;

  state.longitude =
    room.lng;

  state.groupSize =
    room.group_size ||
    4;

  state.selectedDates =
    Array.isArray(
      room.candidate_dates
    )
      ? room.candidate_dates
      : [];

  state.activity =
    room.activity ||
    null;

  state.joinedRoom = true;

  state.participantToken =
    generateToken();

  localStorage.setItem(
    "roamCode",
    room.code
  );

  localStorage.setItem(
    "roamRoomId",
    room.id
  );
}


function continueJoin() {
  state.joinedRoom = true;

  state.participantName = "";
  state.budget = null;

  const input =
    document.getElementById(
      "participantName"
    );

  if (input) {
    input.value = "";
  }

  renderDates();
  renderTimes();

  showScreen("availability");
}


/* =========================================================
   FORMAT CATEGORY
   ========================================================= */

function formatCategory(value) {
  if (!value) {
    return "Place";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, letter =>
      letter.toUpperCase()
    );
}


/* =========================================================
   DISTANCE
   ========================================================= */

function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const earthRadius = 3958.8;

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

  return earthRadius * c;
}


function degreesToRadians(value) {
  return (
    value *
    Math.PI /
    180
  );
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
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


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {
  const toast =
    document.getElementById(
      "toast"
    );

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  clearTimeout(
    showToast.timeout
  );

  showToast.timeout =
    setTimeout(() => {
      toast.classList.remove(
        "show"
      );
    }, 3500);
}


/* =========================================================
   STARTUP
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    renderDates();

    const savedCode =
      localStorage.getItem(
        "roamCode"
      );

    const joinInput =
      document.getElementById(
        "joinCode"
      );

    if (
      joinInput &&
      savedCode
    ) {
      joinInput.value =
        displayInvitePhrase(
          savedCode
        );
    }

    const locationInput =
      document.getElementById(
        "location"
      );

    if (locationInput) {
      locationInput.addEventListener(
        "input",
        event => {
          state.location =
            event.target.value;
        }
      );
    }
  }
);


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */
window.showScreen = showScreen;

window.showJoinMessage = openJoinScreen;

window.startRoam =
  startRoam;

window.saveRoamDetails =
  saveRoamDetails;

window.copyRoamCode =
  copyRoamCode;

window.shareRoamCode =
  shareRoamCode;

window.continueAfterCreate =
  continueAfterCreate;

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

window.continueToPlaces =
  continueToPlaces;

window.choosePlace =
  choosePlace;

window.copyPlan =
  copyPlan;

window.sharePlan =
  sharePlan;

window.startOver =
  startOver;

window.getUserLocation =
  getUserLocation;

window.openJoinScreen =
  openJoinScreen;

window.joinRoam =
  joinRoam;

window.continueJoin =
  continueJoin;

window.openMapsSearch =
  openMapsSearch;

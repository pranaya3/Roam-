
/* =========================================================
   ROAM — APP.JS
   ========================================================= */

/* ---------------------------------------------------------
   SUPABASE
   --------------------------------------------------------- */

const SUPABASE_URL =
  "https://vvbgksamdlhkkchyhlyl.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_WaNsM-y0X9VH8pgnAQYFkg_2o68bx6S";

let db = null;

if (
  window.supabase &&
  typeof window.supabase.createClient === "function"
) {
  db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );
}


/* ---------------------------------------------------------
   STATE
   --------------------------------------------------------- */

const state = {
  roomId: null,
  roomCode: null,

  roamName: "",
  location: "",

  lat: null,
  lon: null,

  groupSize: 4,

  selectedDates: [],

  availability: [],

  budget: null,

  activity: null,

  selectedPlace: null,

  organizerToken: null,
  participantToken: null,

  joinedRoom: false
};


/* ---------------------------------------------------------
   HELPERS
   --------------------------------------------------------- */

function $(id) {
  return document.getElementById(id);
}


function showToast(message) {
  const toast = $("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.__roamToastTimer);

  window.__roamToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}


function generateToken() {
  if (
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ) {
    return window.crypto.randomUUID() +
      "-" +
      Date.now();
  }

  return (
    Math.random().toString(36).substring(2) +
    Date.now() +
    Math.random().toString(36).substring(2)
  );
}


function generateRoomCode() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < 5; i++) {
    code += characters[
      Math.floor(
        Math.random() * characters.length
      )
    ];
  }

  return code;
}


function requireSupabase() {
  if (!db) {
    console.error(
      "Supabase client was not created."
    );

    showToast(
      "Roam couldn't connect to the database."
    );

    return false;
  }

  return true;
}


function formatMoney(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return "$" + Number(value).toFixed(0);
}


/* ---------------------------------------------------------
   SCREEN NAVIGATION
   --------------------------------------------------------- */

function showScreen(screenName) {
  const screens =
    document.querySelectorAll(".screen");

  screens.forEach((screen) => {
    screen.classList.remove("active");
  });

  const target =
    $("screen-" + screenName);

  if (target) {
    target.classList.add("active");
  }

  const progress =
    $("progressText");

  if (progress) {
    progress.textContent =
      screenName.toUpperCase();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* ---------------------------------------------------------
   GROUP SIZE
   --------------------------------------------------------- */

function updateGroupSize(amount) {
  state.groupSize += amount;

  if (state.groupSize < 2) {
    state.groupSize = 2;
  }

  if (state.groupSize > 50) {
    state.groupSize = 50;
  }

  const display =
    $("groupSizeDisplay");

  if (display) {
    display.textContent =
      state.groupSize;
  }
}


/* ---------------------------------------------------------
   CREATE ROAM
   --------------------------------------------------------- */

async function saveRoamDetails() {
  if (!requireSupabase()) {
    return;
  }

  const nameInput =
    $("roamName");

  const locationInput =
    $("location");

  state.roamName =
    nameInput
      ? nameInput.value.trim()
      : "";

  state.location =
    locationInput
      ? locationInput.value.trim()
      : "";

  if (!state.roamName) {
    showToast(
      "Give your Roam a name."
    );

    return;
  }

  if (!state.location) {
    showToast(
      "Add a location."
    );

    return;
  }

  state.organizerToken =
    generateToken();

  let code = generateRoomCode();

  /*
    Make a few attempts in case the random code
    already exists.
  */

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data } =
      await db
        .from("rooms")
        .select("id")
        .eq("code", code)
        .maybeSingle();

    if (!data) {
      break;
    }

    code = generateRoomCode();
  }

  const { data, error } =
    await db
      .from("rooms")
      .insert({
        code: code,
        name: state.roamName,
        location_text: state.location,
        lat: state.lat,
        lng: state.lon,
        group_size: state.groupSize,
        candidate_dates: [],
        activity: null,
        organizer_token:
          state.organizerToken
      })
      .select()
      .single();

  if (error) {
    console.error(
      "Create Roam error:",
      error
    );

    showToast(
      "Couldn't create your Roam."
    );

    return;
  }

  state.roomId = data.id;
  state.roomCode = data.code;

  showToast(
    `Your Roam code is ${state.roomCode}`
  );

  showScreen("dates");
}


/* ---------------------------------------------------------
   DATES
   --------------------------------------------------------- */

function buildDateGrid() {
  const grid =
    $("dateGrid");

  if (!grid) {
    return;
  }

  grid.innerHTML = "";

  const today =
    new Date();

  for (let i = 0; i < 14; i++) {
    const date =
      new Date(today);

    date.setDate(
      today.getDate() + i
    );

    const value =
      date.toISOString()
        .split("T")[0];

    const button =
      document.createElement("button");

    button.type = "button";
    button.className = "date-option";

    button.dataset.date =
      value;

    button.innerHTML = `
      <span>
        ${date.toLocaleDateString(
          "en-US",
          { weekday: "short" }
        )}
      </span>
      <strong>
        ${date.getDate()}
      </strong>
      <small>
        ${date.toLocaleDateString(
          "en-US",
          { month: "short" }
        )}
      </small>
    `;

    button.addEventListener(
      "click",
      () => {
        button.classList.toggle(
          "selected"
        );

        const selected =
          [...grid.querySelectorAll(
            ".date-option.selected"
          )]
            .map(
              (item) =>
                item.dataset.date
            );

        state.selectedDates =
          selected;
      }
    );

    grid.appendChild(button);
  }
}


async function saveDates() {
  if (!state.roomId) {
    showToast(
      "Create or join a Roam first."
    );

    return;
  }

  if (
    state.selectedDates.length === 0
  ) {
    showToast(
      "Choose at least one date."
    );

    return;
  }

  if (!requireSupabase()) {
    return;
  }

  const { error } =
    await db
      .from("rooms")
      .update({
        candidate_dates:
          state.selectedDates
      })
      .eq(
        "id",
        state.roomId
      );

  if (error) {
    console.error(
      "Save dates error:",
      error
    );

    showToast(
      "Couldn't save the dates."
    );

    return;
  }

  buildTimes();

  showScreen(
    "availability"
  );
}


/* ---------------------------------------------------------
   TIMES
   --------------------------------------------------------- */

function buildTimes() {
  const grid =
    $("timeGrid");

  if (!grid) {
    return;
  }

  grid.innerHTML = "";

  const times = [
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
    "8:00 PM",
    "9:00 PM"
  ];

  times.forEach((time) => {
    const button =
      document.createElement("button");

    button.type = "button";
    button.className = "time-option";

    button.textContent =
      time;

    button.dataset.time =
      time;

    if (
      state.availability.includes(
        time
      )
    ) {
      button.classList.add(
        "selected"
      );
    }

    button.addEventListener(
      "click",
      () => {
        button.classList.toggle(
          "selected"
        );

        state.availability =
          [
            ...grid.querySelectorAll(
              ".time-option.selected"
            )
          ].map(
            (item) =>
              item.dataset.time
          );
      }
    );

    grid.appendChild(button);
  });
}


function saveAvailability() {
  const nameInput =
    $("participantName");

  const name =
    nameInput
      ? nameInput.value.trim()
      : "";

  if (!name) {
    showToast(
      "Enter your name."
    );

    return;
  }

  if (
    state.availability.length === 0
  ) {
    showToast(
      "Choose at least one time."
    );

    return;
  }

  state.participantName =
    name;

  showScreen(
    "budget"
  );
}


/* ---------------------------------------------------------
   BUDGET
   --------------------------------------------------------- */

function selectBudget(amount) {
  state.budget =
    Number(amount);

  document
    .querySelectorAll(
      ".budget-option"
    )
    .forEach((button) => {
      button.classList.remove(
        "selected"
      );

      if (
        Number(button.dataset.budget) ===
        Number(amount)
      ) {
        button.classList.add(
          "selected"
        );
      }
    });

  document
    .querySelectorAll(
      "[onclick^='selectBudget']"
    )
    .forEach((button) => {
      const match =
        button
          .getAttribute("onclick")
          ?.match(
            /selectBudget\((\d+)\)/
          );

      if (
        match &&
        Number(match[1]) ===
          Number(amount)
      ) {
        button.classList.add(
          "selected"
        );
      }
    });
}


async function finishBudget() {
  if (!requireSupabase()) {
    return;
  }

  if (
    !state.participantName
  ) {
    showToast(
      "Enter your name first."
    );

    showScreen(
      "availability"
    );

    return;
  }

  if (
    state.budget === null
  ) {
    showToast(
      "Choose your budget."
    );

    return;
  }

  if (!state.roomId) {
    showToast(
      "No Roam is connected."
    );

    return;
  }

  state.participantToken =
    state.participantToken ||
    generateToken();

  const { error } =
    await db
      .from("participants")
      .insert({
        room_id:
          state.roomId,

        name:
          state.participantName,

        participant_token:
          state.participantToken,

        availability: {
          dates:
            state.selectedDates,

          times:
            state.availability
        },

        budget:
          state.budget
      });

  if (error) {
    console.error(
      "Participant save error:",
      error
    );

    showToast(
      "Couldn't save your response."
    );

    return;
  }

  showScreen(
    "activity"
  );
}


/* ---------------------------------------------------------
   ACTIVITY
   --------------------------------------------------------- */

function selectActivity(activity) {
  state.activity =
    activity;

  document
    .querySelectorAll(
      ".activity-option"
    )
    .forEach((button) => {
      button.classList.remove(
        "selected"
      );

      if (
        button.dataset.activity ===
        activity
      ) {
        button.classList.add(
          "selected"
        );
      }
    });

  document
    .querySelectorAll(
      "[onclick^='selectActivity']"
    )
    .forEach((button) => {
      const match =
        button
          .getAttribute("onclick")
          ?.match(
            /selectActivity\('([^']+)'\)/
          );

      if (
        match &&
        match[1] === activity
      ) {
        button.classList.add(
          "selected"
        );
      }
    });

  finishActivity();
}


async function finishActivity() {
  if (!state.roomId) {
    return;
  }

  if (!requireSupabase()) {
    return;
  }

  const { error } =
    await db
      .from("rooms")
      .update({
        activity:
          state.activity
      })
      .eq(
        "id",
        state.roomId
      );

  if (error) {
    console.error(
      "Activity update error:",
      error
    );
  }

  await loadResults();
}


/* ---------------------------------------------------------
   RESULTS
   --------------------------------------------------------- */

async function loadResults() {
  if (!requireSupabase()) {
    return;
  }

  showScreen(
    "results"
  );

  const resultsList =
    $("resultsList");

  if (resultsList) {
    resultsList.innerHTML = `
      <div class="result-card">
        <strong>Finding the best time...</strong>
        <p>Roam is checking everyone's availability.</p>
      </div>
    `;
  }

  const {
    data: participants,
    error
  } =
    await db
      .from("participants")
      .select("*")
      .eq(
        "room_id",
        state.roomId
      );

  if (error) {
    console.error(
      "Results error:",
      error
    );

    if (resultsList) {
      resultsList.innerHTML = `
        <div class="result-card">
          <strong>Couldn't load the group yet.</strong>
          <p>Please try again.</p>
        </div>
      `;
    }

    return;
  }

  const timeScores = {};

  participants.forEach(
    (participant) => {
      const availability =
        participant.availability || {};

      const times =
        Array.isArray(
          availability.times
        )
          ? availability.times
          : [];

      times.forEach((time) => {
        timeScores[time] =
          (timeScores[time] || 0) + 1;
      });
    }
  );

  const rankedTimes =
    Object.entries(timeScores)
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .slice(0, 3);

  if (rankedTimes.length === 0) {
    rankedTimes.push([
      "No shared time yet",
      0
    ]);
  }

  if (resultsList) {
    resultsList.innerHTML =
      rankedTimes
        .map(
          ([time, count], index) => `
            <div class="result-card">
              <span class="result-rank">
                ${index + 1}
              </span>
              <div>
                <strong>${time}</strong>
                <p>
                  ${count}
                  ${count === 1 ? "person" : "people"}
                  available
                </p>
              </div>
            </div>
          `
        )
        .join("");
  }

  await loadAverageBudget();

  state.bestTime =
    rankedTimes[0][0];

  if (
    state.selectedDates.length > 0
  ) {
    state.bestDate =
      state.selectedDates[0];
  }

  await loadPlaces();
}


async function loadAverageBudget() {
  const averageElement =
    $("averageBudget");

  if (
    !averageElement ||
    !state.roomId ||
    !requireSupabase()
  ) {
    return;
  }

  const {
    data,
    error
  } =
    await db.rpc(
      "get_room_average_budget",
      {
        room_uuid:
          state.roomId
      }
    );

  if (error) {
    console.error(
      "Average budget error:",
      error
    );

    averageElement.textContent =
      "—";

    return;
  }

  const average =
    Array.isArray(data)
      ? data[0]?.average_budget
      : data?.average_budget;

  averageElement.textContent =
    formatMoney(average);
}


/* ---------------------------------------------------------
   PLACES
   --------------------------------------------------------- */

const activityLabels = {
  eat: "Food",
  movies: "Movies",
  bowling: "Bowling",
  coffee: "Coffee",
  outdoors: "Outdoors",
  arts: "Arts",
  games: "Games",
  other: "Things to do"
};


const activityQueries = {
  eat: [
    "restaurant"
  ],

  movies: [
    "cinema"
  ],

  bowling: [
    "bowling_alley"
  ],

  coffee: [
    "cafe"
  ],

  outdoors: [
    "park",
    "garden",
    "nature_reserve"
  ],

  arts: [
    "museum",
    "art_gallery",
    "arts_centre"
  ],

  games: [
    "bowling_alley",
    "leisure"
  ],

  other: [
    "attraction",
    "community_centre",
    "arts_centre"
  ]
};


async function loadPlaces() {
  const placesList =
    $("placesList");

  const loading =
    $("placesLoading");

  if (loading) {
    loading.style.display =
      "block";
  }

  if (placesList) {
    placesList.innerHTML = "";
  }

  showScreen(
    "places"
  );

  if (
    state.lat === null ||
    state.lon === null
  ) {
    if (loading) {
      loading.style.display =
        "none";
    }

    renderFallbackPlaces();

    return;
  }

  const types =
    activityQueries[
      state.activity
    ] ||
    activityQueries.other;

  const radius =
    5000;

  const queries =
    types
      .map(
        (type) => `
          nwr[
            amenity=${type}
          ](
            around:${radius},
            ${state.lat},
            ${state.lon}
          );
        `
      )
      .join("");

  const overpassQuery = `
    [out:json][timeout:20];
    (
      ${queries}
    );
    out center tags;
  `;

  try {
    const response =
      await fetch(
        "https://overpass-api.de/api/interpreter",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "text/plain"
          },

          body:
            overpassQuery
        }
      );

    if (!response.ok) {
      throw new Error(
        "Overpass request failed"
      );
    }

    const json =
      await response.json();

    const places =
      (json.elements || [])
        .filter(
          (place) =>
            place.tags &&
            place.tags.name
        )
        .slice(0, 12)
        .map((place) => {
          const lat =
            place.lat ??
            place.center?.lat;

          const lon =
            place.lon ??
            place.center?.lon;

          return {
            name:
              place.tags.name,

            type:
              place.tags.amenity ||
              place.tags.tourism ||
              place.tags.leisure ||
              "Place",

            lat,
            lon
          };
        });

    if (loading) {
      loading.style.display =
        "none";
    }

    if (places.length === 0) {
      renderFallbackPlaces();

      return;
    }

    renderPlaces(
      places
    );

  } catch (error) {
    console.error(
      "Places error:",
      error
    );

    if (loading) {
      loading.style.display =
        "none";
    }

    renderFallbackPlaces();
  }
}


function renderPlaces(places) {
  const list =
    $("placesList");

  if (!list) {
    return;
  }

  list.innerHTML =
    places
      .map(
        (place, index) => `
          <button
            type="button"
            class="place-card"
            onclick="selectPlace(${index})"
          >
            <span class="place-number">
              ${index + 1}
            </span>

            <span class="place-info">
              <strong>
                ${escapeHtml(place.name)}
              </strong>

              <small>
                ${escapeHtml(
                  activityLabels[
                    state.activity
                  ] ||
                  "Nearby"
                )}
              </small>
            </span>

            <span class="place-arrow">
              →
            </span>
          </button>
        `
      )
      .join("");

  state.places =
    places;
}


function renderFallbackPlaces() {
  const list =
    $("placesList");

  if (!list) {
    return;
  }

  const activity =
    activityLabels[
      state.activity
    ] ||
    "Things to do";

  list.innerHTML = `
    <div class="result-card">
      <strong>
        Find ${escapeHtml(activity.toLowerCase())} nearby
      </strong>

      <p>
        Roam couldn't load nearby places right now.
        Try again or use the location button first.
      </p>
    </div>
  `;
}


function selectPlace(index) {
  if (
    !state.places ||
    !state.places[index]
  ) {
    return;
  }

  state.selectedPlace =
    state.places[index];

  buildFinalPlan();

  showScreen(
    "final"
  );
}


function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* ---------------------------------------------------------
   FINAL PLAN
   --------------------------------------------------------- */

function buildFinalPlan() {
  const dateElement =
    $("finalDate");

  const timeElement =
    $("finalTime");

  const activityElement =
    $("finalActivity");

  const placeElement =
    $("finalPlace");

  const peopleElement =
    $("finalPeople");

  const budgetElement =
    $("finalBudget");

  if (dateElement) {
    dateElement.textContent =
      formatDate(
        state.bestDate ||
        state.selectedDates[0]
      );
  }

  if (timeElement) {
    timeElement.textContent =
      state.bestTime ||
      "Time TBD";
  }

  if (activityElement) {
    activityElement.textContent =
      activityLabels[
        state.activity
      ] ||
      "Hangout";
  }

  if (placeElement) {
    placeElement.textContent =
      state.selectedPlace?.name ||
      "Place TBD";
  }

  if (peopleElement) {
    peopleElement.textContent =
      state.groupSize;
  }

  if (budgetElement) {
    budgetElement.textContent =
      state.averageBudget
        ? formatMoney(
            state.averageBudget
          )
        : "Group budget";
  }
}


function formatDate(dateString) {
  if (!dateString) {
    return "Date TBD";
  }

  const date =
    new Date(
      dateString + "T00:00:00"
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


function createPlanText() {
  const date =
    formatDate(
      state.bestDate ||
      state.selectedDates[0]
    );

  const time =
    state.bestTime ||
    "Time TBD";

  const activity =
    activityLabels[
      state.activity
    ] ||
    "hangout";

  const place =
    state.selectedPlace?.name ||
    "a nearby spot";

  const people =
    state.groupSize ||
    "the group";

  return `
Roam plan ✦

${state.roamName || "Hangout"}

${date}
${time}

${activity}
${place}

Group: ${people} people

Roam code: ${state.roomCode || "—"}
`.trim();
}


async function copyPlan() {
  const text =
    createPlanText();

  try {
    await navigator.clipboard.writeText(
      text
    );

    showToast(
      "Plan copied!"
    );

  } catch (error) {
    console.error(
      "Clipboard error:",
      error
    );

    window.prompt(
      "Copy your Roam plan:",
      text
    );
  }
}


async function sharePlan() {
  const text =
    createPlanText();

  if (
    navigator.share
  ) {
    try {
      await navigator.share({
        title:
          state.roamName ||
          "Roam plan",

        text
      });

      return;

    } catch (error) {
      if (
        error.name ===
        "AbortError"
      ) {
        return;
      }
    }
  }

  await copyPlan();
}


/* ---------------------------------------------------------
   LOCATION
   --------------------------------------------------------- */

function getUserLocation() {
  if (
    !navigator.geolocation
  ) {
    showToast(
      "Location isn't supported here."
    );

    return;
  }

  showToast(
    "Finding your location..."
  );

  navigator.geolocation.getCurrentPosition(
    (position) => {
      state.lat =
        position.coords.latitude;

      state.lon =
        position.coords.longitude;

      showToast(
        "Location found!"
      );
    },

    (error) => {
      console.error(
        "Location error:",
        error
      );

      showToast(
        "Couldn't get your location."
      );
    },

    {
      enableHighAccuracy:
        true,

      timeout:
        10000,

      maximumAge:
        60000
    }
  );
}


/* ---------------------------------------------------------
   JOIN A RO
```

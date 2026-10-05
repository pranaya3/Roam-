/* =========================================================
   ROAM — APP.JS
   Supabase + Free OpenStreetMap / Overpass Places
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://vvbgksamdlhkkchyhlyl.supabase.co";

// Paste your Supabase Publishable key here.
const SUPABASE_KEY =
  "sb_publishable_WaNsM-y0X9VH8pgnAQYFkg_2o68bx6S";

const supabaseClient =
  window.supabase &&
  SUPABASE_KEY !== "sb_publishable_WaNsM-y0X9VH8pgnAQYFkg_2o68bx6S"
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      )
    : null;


/* =========================================================
   STATE
========================================================= */

const state = {
  currentScreen: "home",

  roamName: "",
  location: "",
  lat: null,
  lng: null,

  groupSize: 4,

  selectedDates: [],
  participantName: "",
  selectedTimes: [],

  budget: null,
  averageBudget: null,

  activity: "",
  selectedTime: null,
  selectedPlace: null,

  places: [],

  roomId: null,
  roomCode: null,

  organizerToken: null,
  participantToken: null,

  participantSaved: false
};


/* =========================================================
   ACTIVITY DATA
========================================================= */

const activityData = {

  food: {
    label: "Food",
    icon: "🍴",
    queries: [
      ["amenity", "restaurant"],
      ["amenity", "fast_food"]
    ]
  },

  coffee: {
    label: "Coffee",
    icon: "☕",
    queries: [
      ["amenity", "cafe"]
    ]
  },

  movies: {
    label: "Movies",
    icon: "🎬",
    queries: [
      ["amenity", "cinema"]
    ]
  },

  bowling: {
    label: "Bowling",
    icon: "🎳",
    queries: [
      ["leisure", "bowling_alley"]
    ]
  },

  outdoors: {
    label: "Outdoors",
    icon: "🌳",
    queries: [
      ["leisure", "park"],
      ["leisure", "garden"],
      ["leisure", "nature_reserve"]
    ]
  },

  arts: {
    label: "Arts",
    icon: "🎨",
    queries: [
      ["tourism", "museum"],
      ["amenity", "arts_centre"],
      ["amenity", "theatre"],
      ["tourism", "gallery"]
    ]
  },

  games: {
    label: "Games",
    icon: "🎮",
    queries: [
      ["leisure", "amusement_arcade"],
      ["leisure", "escape_game"],
      ["leisure", "adult_gaming_centre"],
      ["amenity", "billiards"]
    ]
  },

  other: {
    label: "Something else",
    icon: "✨",
    queries: [
      ["tourism", "attraction"],
      ["leisure", "pitch"],
      ["leisure", "sports_centre"]
    ]
  }
};


/* =========================================================
   ROAM WORDS
========================================================= */

const roamWords = [
  "SUNSET",
  "PEACH",
  "CANAL",
  "GONDOLA",
  "LAGOON",
  "PALAZZO",
  "BRIDGE",
  "BREEZE",
  "GELATO",
  "CARNIVAL",
  "VISTA",
  "ORANGE",
  "VENICE",
  "ROSE",
  "MARINA",
  "WANDER",
  "TERRACE",
  "SUNNY",
  "SAIL",
  "MOSAIC",
  "CITRUS",
  "RIVIERA",
  "LIMONE",
  "FRESCO",
  "BLOSSOM",
  "PICNIC",
  "STROLL",
  "SUNRISE",
  "VIOLET",
  "SEASIDE"
];


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  state.organizerToken =
    getToken("roam_organizer_token");

  state.participantToken =
    getToken("roam_participant_token");


  if (!state.organizerToken) {

    state.organizerToken =
      createToken();

    localStorage.setItem(
      "roam_organizer_token",
      state.organizerToken
    );
  }


  if (!state.participantToken) {

    state.participantToken =
      createToken();

    localStorage.setItem(
      "roam_participant_token",
      state.participantToken
    );
  }


  setupGroupSize();

  buildDates();

  updateProgress();

  showScreen("home");
});


/* =========================================================
   TOKEN HELPERS
========================================================= */

function createToken() {

  if (
    window.crypto &&
    crypto.randomUUID
  ) {
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


function getToken(key) {

  return localStorage.getItem(key);
}


/* =========================================================
   SCREEN NAVIGATION
========================================================= */

function showScreen(screenId) {

  document
    .querySelectorAll(".screen")
    .forEach(screen => {

      screen.classList.remove("active");

    });


  const screen =
    document.getElementById(screenId);


  if (!screen) {

    console.warn(
      "Screen not found:",
      screenId
    );

    return;
  }


  screen.classList.add("active");

  state.currentScreen =
    screenId;


  updateProgress();


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function goHome() {

  showScreen("home");
}


function openCreate() {

  showScreen("create");
}


function openJoin() {

  showScreen("join");
}


function goBack(screenId) {

  showScreen(screenId);
}


/* =========================================================
   PROGRESS BAR
========================================================= */

function updateProgress() {

  const progress =
    document.getElementById("progress");


  if (!progress) return;


  const steps = {

    home: 0,

    create: 15,

    dates: 30,

    availability: 45,

    budget: 60,

    activity: 72,

    results: 82,

    places: 91,

    final: 100,

    join: 20,

    "join-confirm": 40
  };


  progress.style.width =
    `${steps[state.currentScreen] || 0}%`;
}


/* =========================================================
   GROUP SIZE
========================================================= */

function setupGroupSize() {

  const input =
    document.getElementById(
      "groupSize"
    );


  if (!input) return;


  input.value =
    state.groupSize;


  input.addEventListener(
    "change",
    () => {

      let value =
        parseInt(
          input.value,
          10
        );


      if (Number.isNaN(value)) {

        value = 4;
      }


      value =
        Math.max(
          2,
          Math.min(
            50,
            value
          )
        );


      state.groupSize =
        value;

      input.value =
        value;
    }
  );
}


function changeGroupSize(amount) {

  const input =
    document.getElementById(
      "groupSize"
    );


  if (!input) return;


  let value =
    parseInt(
      input.value,
      10
    ) || 4;


  value += amount;


  value =
    Math.max(
      2,
      Math.min(
        50,
        value
      )
    );


  input.value =
    value;

  state.groupSize =
    value;
}


/* =========================================================
   CREATE ROAM
========================================================= */

function saveRoamDetails() {

  const nameInput =
    document.getElementById(
      "roamName"
    );

  const locationInput =
    document.getElementById(
      "location"
    );

  const groupInput =
    document.getElementById(
      "groupSize"
    );


  if (
    !nameInput ||
    !locationInput
  ) {
    return;
  }


  const name =
    nameInput.value.trim();

  const location =
    locationInput.value.trim();


  if (!name) {

    showToast(
      "Give your Roam a name."
    );

    nameInput.focus();

    return;
  }


  if (!location) {

    showToast(
      "Add a starting location."
    );

    locationInput.focus();

    return;
  }


  state.roamName =
    name;

  state.location =
    location;


  if (groupInput) {

    state.groupSize =
      Math.max(
        2,
        Math.min(
          50,
          parseInt(
            groupInput.value,
            10
          ) || 4
        )
      );
  }


  showScreen("dates");
}


/* =========================================================
   DATE BUILDER
========================================================= */

function buildDates() {

  const grid =
    document.getElementById(
      "dateGrid"
    );


  if (!grid) return;


  grid.innerHTML = "";


  const today =
    new Date();


  for (
    let i = 1;
    i <= 14;
    i++
  ) {

    const date =
      new Date(today);


    date.setDate(
      today.getDate() + i
    );


    const dayName =
      date.toLocaleDateString(
        "en-US",
        {
          weekday: "short"
        }
      );


    const monthName =
      date.toLocaleDateString(
        "en-US",
        {
          month: "short"
        }
      );


    const dayNumber =
      date.getDate();


    const isoDate =
      date
        .toISOString()
        .split("T")[0];


    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";

    button.className =
      "date-option";

    button.dataset.date =
      isoDate;


    button.innerHTML = `
      <strong>${dayName}</strong>
      <span>${monthName} ${dayNumber}</span>
    `;


    button.addEventListener(
      "click",
      () => {

        if (
          state.selectedDates
            .includes(isoDate)
        ) {

          state.selectedDates =
            state.selectedDates.filter(
              date =>
                date !== isoDate
            );

          button.classList.remove(
            "selected"
          );

        } else {

          state.selectedDates.push(
            isoDate
          );

          button.classList.add(
            "selected"
          );
        }
      }
    );


    grid.appendChild(button);
  }
}


/* =========================================================
   SAVE DATES
========================================================= */

function saveDates() {

  if (
    state.selectedDates.length === 0
  ) {

    showToast(
      "Pick at least one date."
    );

    return;
  }


  state.selectedDates.sort();


  buildTimes();


  showScreen(
    "availability"
  );
}


/* =========================================================
   TIME BUILDER
========================================================= */

function buildTimes() {

  const grid =
    document.getElementById(
      "timeGrid"
    );


  if (!grid) return;


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


  state.selectedTimes =
    [];


  times.forEach(
    time => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";

      button.className =
        "time-option";

      button.textContent =
        time;


      button.addEventListener(
        "click",
        () => {

          if (
            state.selectedTimes
              .includes(time)
          ) {

            state.selectedTimes =
              state.selectedTimes.filter(
                selected =>
                  selected !== time
              );

            button.classList.remove(
              "selected"
            );

          } else {

            state.selectedTimes.push(
              time
            );

            button.classList.add(
              "selected"
            );
          }
        }
      );


      grid.appendChild(button);
    }
  );
}


/* =========================================================
   SAVE AVAILABILITY
========================================================= */

function saveAvailability() {

  const input =
    document.getElementById(
      "participantName"
    );


  const name =
    input
      ? input.value.trim()
      : "";


  if (!name) {

    showToast(
      "Add your name."
    );

    input?.focus();

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


  state.participantName =
    name;


  showScreen("budget");
}


/* =========================================================
   BUDGET
========================================================= */

function selectBudget(amount) {

  const numericAmount =
    Number(amount);


  if (
    !Number.isFinite(
      numericAmount
    )
  ) {
    return;
  }


  state.budget =
    numericAmount;


  document
    .querySelectorAll(
      ".budget-option"
    )
    .forEach(button => {

      const buttonAmount =
        Number(
          button.dataset.budget
        );


      button.classList.toggle(
        "selected",
        buttonAmount ===
          numericAmount
      );
    });
}


async function saveBudget() {

  if (!state.budget) {

    showToast(
      "Pick a budget."
    );

    return;
  }


  showScreen(
    "activity"
  );
}


/* =========================================================
   ACTIVITY
========================================================= */

function selectActivity(
  element,
  activity
) {

  if (
    !activityData[activity]
  ) {
    return;
  }


  state.activity =
    activity;


  document
    .querySelectorAll(
      ".activity-card"
    )
    .forEach(card => {

      card.classList.remove(
        "selected"
      );
    });


  if (element) {

    element.classList.add(
      "selected"
    );
  }


  buildResults();
}


/* =========================================================
   BUILD RESULTS
========================================================= */

async function buildResults() {

  if (!state.activity) {

    showToast(
      "Choose an activity."
    );

    return;
  }


  showScreen(
    "results"
  );


  const list =
    document.getElementById(
      "resultsList"
    );


  if (list) {

    list.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        Finding the best times...
      </div>
    `;
  }


  /*
    The room must exist before the participant
    can be saved.
  */

  const roomId =
    await saveRoom();


  if (!roomId) {

    /*
      If Supabase is not configured,
      continue locally.
    */
  }


  /*
    Save the organizer as the first
    participant after the room exists.
  */

  await saveParticipant();


  await calculateAverageBudget();


  const bestTimes =
    calculateBestTimes();


  renderBestTimes(
    bestTimes
  );
}


/* =========================================================
   FIND BEST TIMES
========================================================= */

function calculateBestTimes() {

  if (
    !state.selectedTimes.length
  ) {
    return [];
  }


  const sorted =
    [
      ...state.selectedTimes
    ].sort(
      (a, b) =>
        convertTimeToMinutes(a) -
        convertTimeToMinutes(b)
    );


  return sorted.slice(
    0,
    3
  );
}


function convertTimeToMinutes(
  time
) {

  const match =
    time.match(
      /^(\d+):(\d+)\s*(AM|PM)$/i
    );


  if (!match) {
    return 0;
  }


  let hours =
    parseInt(
      match[1],
      10
    );


  const minutes =
    parseInt(
      match[2],
      10
    );


  const period =
    match[3].toUpperCase();


  if (
    period === "PM" &&
    hours !== 12
  ) {
    hours += 12;
  }


  if (
    period === "AM" &&
    hours === 12
  ) {
    hours = 0;
  }


  return (
    hours * 60 +
    minutes
  );
}


/* =========================================================
   RENDER BEST TIMES
========================================================= */

function renderBestTimes(
  times
) {

  const list =
    document.getElementById(
      "resultsList"
    );


  if (!list) return;


  if (!times.length) {

    list.innerHTML = `
      <div class="loading-state">
        No times found.
      </div>
    `;

    return;
  }


  list.innerHTML =
    "";


  times.forEach(
    (time, index) => {

      const date =
        state.selectedDates[
          index %
          state.selectedDates.length
        ];


      const card =
        document.createElement(
          "button"
        );


      card.type =
        "button";

      card.className =
        "result-card";


      card.innerHTML = `
        <div>
          <strong>
            ${formatDate(date)}
          </strong>

          <span>
            ${escapeHtml(time)}
          </span>
        </div>

        <div class="result-arrow">
          →
        </div>
      `;


      card.addEventListener(
        "click",
        () => {

          state.selectedTime = {
            date,
            time
          };


          loadNearbyPlaces();
        }
      );


      list.appendChild(
        card
      );
    }
  );
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
  isoDate
) {

  if (!isoDate) {
    return "";
  }


  const date =
    new Date(
      `${isoDate}T12:00:00`
    );


  return date.toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric"
    }
  );
}


/* =========================================================
   SUPABASE — SAVE ROOM
========================================================= */

async function saveRoom() {

  if (!supabaseClient) {

    console.warn(
      "Supabase is not configured. Add your Publishable key to app.js."
    );

    return null;
  }


  if (state.roomId) {

    return state.roomId;
  }


  try {

    const code =
      await generateUniqueRoamCode();


    const roomPayload = {

      code,

      name:
        state.roamName,

      location_text:
        state.location,

      lat:
        state.lat,

      lng:
        state.lng,

      group_size:
        state.groupSize,

      candidate_dates:
        state.selectedDates,

      activity:
        state.activity,

      organizer_token:
        state.organizerToken
    };


    const {
      data,
      error
    } =
      await supabaseClient
        .from("rooms")
        .insert(
          roomPayload
        )
        .select()
        .single();


    if (error) {

      console.error(
        "Supabase room error:",
        error
      );

      showToast(
        "Could not save your Roam."
      );

      return null;
    }


    state.roomId =
      data.id;

    state.roomCode =
      data.code;


    return data.id;

  } catch (error) {

    console.error(
      error
    );


    showToast(
      "Something went wrong saving your Roam."
    );


    return null;
  }
}


/* =========================================================
   GENERATE UNIQUE ROAM CODE
========================================================= */

async function generateUniqueRoamCode() {

  if (!supabaseClient) {

    return randomRoamWord();
  }


  for (
    let attempt = 0;
    attempt < 15;
    attempt++
  ) {

    const code =
      randomRoamWord();


    const {
      data,
      error
    } =
      await supabaseClient
        .from("rooms")
        .select("id")
        .eq(
          "code",
          code
        )
        .limit(1);


    if (error) {

      console.warn(
        "Could not check code:",
        error
      );


      return code;
    }


    if (
      !data ||
      data.length === 0
    ) {

      return code;
    }
  }


  /*
    Very unlikely fallback.
    Keeps the code readable while
    making it unique.
  */

  return (
    randomRoamWord() +
    Math.floor(
      Math.random() * 100
    )
  );
}


function randomRoamWord() {

  return roamWords[
    Math.floor(
      Math.random() *
      roamWords.length
    )
  ];
}


/* =========================================================
   SAVE PARTICIPANT
========================================================= */

async function saveParticipant() {

  if (
    !supabaseClient ||
    !state.roomId
  ) {

    return;
  }


  /*
    Prevent accidentally saving the
    same participant multiple times
    during the same flow.
  */

  if (
    state.participantSaved
  ) {

    return;
  }


  const availability = {

    dates:
      state.selectedDates,

    times:
      state.selectedTimes
  };


  try {

    const {
      error
    } =
      await supabaseClient
        .from("participants")
        .insert({

          room_id:
            state.roomId,

          name:
            state.participantName,

          participant_token:
            state.participantToken,

          availability,

          budget:
            state.budget
        });


    if (error) {

      /*
        A participant might already exist
        if the user refreshes/re-enters.
      */

      if (
        error.code === "23505"
      ) {

        console.warn(
          "Participant already exists."
        );

      } else {

        console.error(
          "Participant save error:",
          error
        );
      }

      return;
    }


    state.participantSaved =
      true;

  } catch (error) {

    console.error(
      "Participant save failed:",
      error
    );
  }
}


/* =========================================================
   AVERAGE BUDGET
========================================================= */

async function calculateAverageBudget() {

  if (
    !supabaseClient ||
    !state.roomId
  ) {

    state.averageBudget =
      state.budget ||
      null;


    updateAverageBudget();

    return;
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .rpc(
          "get_room_average_budget",
          {
            room_uuid:
              state.roomId
          }
        );


    if (error) {

      console.error(
        "Budget average error:",
        error
      );


      state.averageBudget =
        state.budget ||
        null;

    } else {

      state.averageBudget =
        data?.[0]?.average_budget ??
        state.budget;
    }

  } catch (error) {

    console.error(
      error
    );


    state.averageBudget =
      state.budget ||
      null;
  }


  updateAverageBudget();
}


function updateAverageBudget() {

  const element =
    document.getElementById(
      "averageBudget"
    );


  if (!element) {
    return;
  }


  if (
    !state.averageBudget
  ) {

    element.textContent =
      "—";

    return;
  }


  element.textContent =
    `$${Math.round(
      Number(
        state.averageBudget
      )
    )}`;
}


/* =========================================================
   PLACES — MAIN ENTRY
========================================================= */

async function loadNearbyPlaces() {

  showScreen(
    "places"
  );


  const subtitle =
    document.getElementById(
      "placesSubtitle"
    );


  const list =
    document.getElementById(
      "placesList"
    );


  const activity =
    activityData[
      state.activity
    ];


  if (
    subtitle &&
    activity
  ) {

    subtitle.textContent =
      `Nearby ${activity.label.toLowerCase()} spots.`;
  }


  if (list) {

    list.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        Finding nearby ${
          (
            activity?.label ||
            "places"
          ).toLowerCase()
        }...
      </div>
    `;
  }


  try {

    await ensureCoordinates();


    if (
      state.lat === null ||
      state.lng === null
    ) {

      throw new Error(
        "Location is unavailable."
      );
    }


    const places =
      await fetchCategoryPlaces(
        state.lat,
        state.lng,
        state.activity
      );


    state.places =
      places;


    renderPlaces(
      places
    );

  } catch (error) {

    console.error(
      "Place search error:",
      error
    );


    if (list) {

      list.innerHTML = `
        <div class="loading-state">
          We couldn't find nearby places right now.
          Try using your location button and try again.
        </div>
      `;
    }
  }
}


/* =========================================================
   LOCATION
========================================================= */

function getUserLocation() {

  const status =
    document.getElementById(
      "locationStatus"
    );


  if (
    !navigator.geolocation
  ) {

    if (status) {

      status.textContent =
        "Location is not supported by this browser.";
    }


    showToast(
      "Your browser does not support location."
    );


    return;
  }


  if (status) {

    status.textContent =
      "Finding your location...";
  }


  navigator.geolocation.getCurrentPosition(

    async position => {

      state.lat =
        position.coords.latitude;

      state.lng =
        position.coords.longitude;


      if (status) {

        status.textContent =
          "Location found.";
      }


      try {

        const location =
          await reverseGeocode(
            state.lat,
            state.lng
          );


        if (location) {

          state.location =
            location;


          const input =
            document.getElementById(
              "location"
            );


          if (input) {

            input.value =
              location;
          }
        }

      } catch (error) {

        console.warn(
          "Reverse geocoding failed:",
          error
        );
      }
    },


    error => {

      console.error(
        error
      );


      if (status) {

        status.textContent =
          "Couldn't get your location.";
      }


      showToast(
        "Please allow location access."
      );
    },


    {
      enableHighAccuracy:
        true,

      timeout:
        10000,

      maximumAge:
        300000
    }
  );
}


/* =========================================================
   ENSURE COORDINATES
========================================================= */

async function ensureCoordinates() {

  if (
    state.lat !== null &&
    state.lng !== null
  ) {

    return;
  }


  if (!state.location) {

    return;
  }


  try {

    const result =
      await geocodeLocation(
        state.location
      );


    if (!result) {

      return;
    }


    state.lat =
      result.lat;

    state.lng =
      result.lng;

  } catch (error) {

    console.error(
      "Geocoding failed:",
      error
    );
  }
}


/* =========================================================
   NOMINATIM REVERSE GEOCODE
========================================================= */

async function reverseGeocode(
  lat,
  lng
) {

  const url =
    "https://nominatim.openstreetmap.org/reverse" +
    `?format=jsonv2` +
    `&lat=${encodeURIComponent(lat)}` +
    `&lon=${encodeURIComponent(lng)}`;


  const response =
    await fetch(
      url,
      {
        headers: {
          Accept:
            "application/json"
        }
      }
    );


  if (!response.ok) {

    throw new Error(
      `Reverse geocode failed: ${response.status}`
    );
  }


  const data =
    await response.json();


  return (
    data.display_name ||
    ""
  );
}


/* =========================================================
   NOMINATIM GEOCODE
========================================================= */

async function geocodeLocation(
  query
) {

  const url =
    "https://nominatim.openstreetmap.org/search" +
    `?format=jsonv2` +
    `&q=${encodeURIComponent(query)}` +
    `&limit=1`;


  const response =
    await fetch(
      url,
      {
        headers: {
          Accept:
            "application/json"
        }
      }
    );


  if (!response.ok) {

    throw new Error(
      `Geocode failed: ${response.status}`
    );
  }


  const data =
    await response.json();


  if (!data.length) {

    return null;
  }


  return {

    lat:
      Number(
        data[0].lat
      ),

    lng:
      Number(
        data[0].lon
      ),

    displayName:
      data[0].display_name
  };
}


/* =========================================================
   CATEGORY-SPECIFIC OVERPASS SEARCH
========================================================= */

async function fetchCategoryPlaces(
  lat,
  lng,
  activity
) {

  const config =
    activityData[
      activity
    ];


  if (!config) {

    return [];
  }


  /*
    Search radius:
    10 km / approximately 6.2 miles.
  */

  const radius =
    10000;


  const selectors =
    config.queries
      .map(
        ([key, value]) =>
          `nwr["${key}"="${value}"](around:${radius},${lat},${lng});`
      )
      .join("\n");


  const query = `
    [out:json][timeout:25];
    (
      ${selectors}
    );
    out center tags;
  `;


  /*
    Try two public Overpass servers.
  */

  const endpoints = [

    "https://overpass-api.de/api/interpreter",

    "https://overpass.kumi.systems/api/interpreter"
  ];


  let lastError =
    null;


  for (
    const endpoint of endpoints
  ) {

    try {

      const response =
        await fetch(
          endpoint,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded"
            },

            body:
              `data=${encodeURIComponent(
                query
              )}`
          }
        );


      if (!response.ok) {

        throw new Error(
          `Overpass error: ${response.status}`
        );
      }


      const data =
        await response.json();


      return cleanPlaces(
        data.elements ||
          [],
        lat,
        lng
      );

    } catch (error) {

      lastError =
        error;


      console.warn(
        "Overpass endpoint failed:",
        endpoint,
        error
      );
    }
  }


  throw (
    lastError ||
    new Error(
      "Place search failed."
    )
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

  const seen =
    new Set();


  const places =
    [];


  elements.forEach(
    element => {

      const tags =
        element.tags ||
        {};


      const name =
        tags.name ||
        tags["name:en"];


      if (!name) {

        return;
      }


      const lat =
        element.lat ??
        element.center?.lat;


      const lng =
        element.lon ??
        element.center?.lon;


      if (
        typeof lat !==
          "number" ||
        typeof lng !==
          "number"
      ) {

        return;
      }


      const key =
        `${name.toLowerCase()}|${lat.toFixed(5)}|${lng.toFixed(5)}`;


      if (
        seen.has(key)
      ) {

        return;
      }


      seen.add(key);


      const distance =
        calculateDistance(
          userLat,
          userLng,
          lat,
          lng
        );


      places.push({

        id:
          element.id,

        name,

        lat,

        lng,

        distance,

        address:
          buildAddress(
            tags
          ),

        category:
          getPlaceCategory(
            tags
          ),

        googleMapsUrl:
          createMapsLink(
            name,
            lat,
            lng
          )
      });
    }
  );


  places.sort(
    (a, b) =>
      a.distance -
      b.distance
  );


  return places.slice(
    0,
    10
  );
}


/* =========================================================
   PLACE CATEGORY
========================================================= */

function getPlaceCategory(
  tags
) {

  if (
    tags.amenity ===
    "restaurant"
  ) {

    return "Restaurant";
  }


  if (
    tags.amenity ===
    "fast_food"
  ) {

    return "Food";
  }


  if (
    tags.amenity ===
    "cafe"
  ) {

    return "Cafe";
  }


  if (
    tags.amenity ===
    "cinema"
  ) {

    return "Cinema";
  }


  if (
    tags.leisure ===
    "bowling_alley"
  ) {

    return "Bowling";
  }


  if (
    tags.leisure ===
    "park"
  ) {

    return "Park";
  }


  if (
    tags.leisure ===
    "garden"
  ) {

    return "Garden";
  }


  if (
    tags.leisure ===
    "nature_reserve"
  ) {

    return "Nature Reserve";
  }


  if (
    tags.tourism ===
    "museum"
  ) {

    return "Museum";
  }


  if (
    tags.tourism ===
    "gallery"
  ) {

    return "Gallery";
  }


  if (
    tags.amenity ===
    "arts_centre"
  ) {

    return "Arts Center";
  }


  if (
    tags.amenity ===
    "theatre"
  ) {

    return "Theater";
  }


  if (
    tags.leisure ===
    "amusement_arcade"
  ) {

    return "Arcade";
  }


  if (
    tags.leisure ===
    "escape_game"
  ) {

    return "Escape Room";
  }


  if (
    tags.amenity ===
    "billiards"
  ) {

    return "Billiards";
  }


  if (
    tags.leisure ===
    "sports_centre"
  ) {

    return "Sports Center";
  }


  return "Place";
}


/* =========================================================
   ADDRESS
========================================================= */

function buildAddress(
  tags
) {

  const parts =
    [];


  if (
    tags["addr:housenumber"]
  ) {

    parts.push(
      tags["addr:housenumber"]
    );
  }


  if (
    tags["addr:street"]
  ) {

    parts.push(
      tags["addr:street"]
    );
  }


  if (
    tags["addr:city"]
  ) {

    parts.push(
      tags["addr:city"]
    );
  }


  return parts.join(
    " "
  );
}


/* =========================================================
   DISTANCE
========================================================= */

function calculateDistance(
  lat1,
  lng1,
  lat2,
  lng2
) {

  const earthRadius =
    3958.8;


  const dLat =
    degreesToRadians(
      lat2 - lat1
    );


  const dLng =
    degreesToRadians(
      lng2 - lng1
    );


  const a =
    Math.sin(
      dLat / 2
    ) ** 2 +

    Math.cos(
      degreesToRadians(
        lat1
      )
    ) *

    Math.cos(
      degreesToRadians(
        lat2
      )
    ) *

    Math.sin(
      dLng / 2
    ) ** 2;


  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );


  return (
    earthRadius *
    c
  );
}


function degreesToRadians(
  degrees
) {

  return (
    degrees *
    Math.PI /
    180
  );
}


/* =========================================================
   RENDER PLACES
========================================================= */

function renderPlaces(
  places
) {

  const list =
    document.getElementById(
      "placesList"
    );


  if (!list) return;


  list.innerHTML =
    "";


  if (
    !places.length
  ) {

    list.innerHTML = `
      <div class="loading-state">
        No nearby places were found for this activity.
        Try another activity or location.
      </div>
    `;

    return;
  }


  places.forEach(
    place => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";

      button.className =
        "place-card";


      button.innerHTML = `
        <div class="place-icon">
          ${
            activityData[
              state.activity
            ]?.icon ||
            "📍"
          }
        </div>

        <div class="place-info">

          <strong>
            ${escapeHtml(
              place.name
            )}
          </strong>

          <span>
            ${escapeHtml(
              place.address ||
              place.category ||
              "Nearby"
            )}
          </span>

        </div>

        <div class="place-distance">
          ${formatDistance(
            place.distance
          )}
        </div>
      `;


      button.addEventListener(
        "click",
        () =>
          choosePlace(
            place
          )
      );


      list.appendChild(
        button
      );
    }
  );
}


/* =========================================================
   CHOOSE PLACE
========================================================= */

function choosePlace(
  place
) {

  if (!place) {
    return;
  }


  state.selectedPlace =
    place;


  buildFinalPlan();


  showScreen(
    "final"
  );
}


/* =========================================================
   FINAL PLAN
========================================================= */

function buildFinalPlan() {

  const container =
    document.getElementById(
      "finalPlan"
    );


  if (!container) {
    return;
  }


  const activity =
    activityData[
      state.activity
    ];


  const place =
    state.selectedPlace;


  if (!place) {

    container.innerHTML =
      "";

    return;
  }


  const date =
    state.selectedTime?.date ||
    state.selectedDates[0];


  const time =
    state.selectedTime?.time ||
    state.selectedTimes[0] ||
    "";


  container.innerHTML = `

    <div class="final-card">

      <div class="final-card-header">

        <h3>
          ${escapeHtml(
            state.roamName ||
            "Your Roam"
          )}
        </h3>

      </div>


      <div class="final-detail">

        <small>
          Activity
        </small>

        <strong>
          ${
            activity?.icon ||
            "✨"
          }

          ${escapeHtml(
            activity?.label ||
            "Hangout"
          )}
        </strong>

      </div>


      <div class="final-detail">

        <small>
          When
        </small>

        <strong>

          ${escapeHtml(
            formatDate(date)
          )}

          ·

          ${escapeHtml(
            time
          )}

        </strong>

      </div>


      <div class="final-detail">

        <small>
          Where
        </small>

        <strong>
          ${escapeHtml(
            place.name
          )}
        </strong>

      </div>


      <div class="final-detail">

        <small>
          Roam code
        </small>

        <strong>
          ${escapeHtml(
            state.roomCode ||
            "—"
          )}
        </strong>

      </div>

    </div>


    <div class="final-actions">

      <button
        class="primary-button"
        type="button"
        onclick="copyPlan()"
      >
        Copy plan
      </button>


      <button
        class="secondary-button"
        type="button"
        onclick="sharePlan()"
      >
        Share
      </button>

    </div>
  `;
}


/* =========================================================
   PLAN TEXT
========================================================= */

function makePlanText() {

  const activity =
    activityData[
      state.activity
    ];


  const place =
    state.selectedPlace;


  const date =
    state.selectedTime?.date ||
    state.selectedDates[0];


  const time =
    state.selectedTime?.time ||
    state.selectedTimes[0] ||
    "";


  return [

    `${state.roamName || "Roam"}`,

    "",

    `${activity?.icon || ""} ${
      activity?.label ||
      "Hangout"
    }`,

    `📅 ${formatDate(date)}`,

    `🕐 ${time}`,

    `📍 ${place?.name || ""}`,

    "",

    `Roam code: ${
      state.roomCode || ""
    }`

  ].join("\n");
}


/* =========================================================
   COPY PLAN
========================================================= */

async function copyPlan() {

  const text =
    makePlanText();


  try {

    await navigator.clipboard
      .writeText(text);


    showToast(
      "Plan copied."
    );

  } catch (error) {

    console.error(
      error
    );


    showToast(
      "Couldn't copy. Try selecting the text."
    );
  }
}


/* =========================================================
   SHARE PLAN
========================================================= */

async function sharePlan() {

  const text =
    makePlanText();


  if (
    navigator.share
  ) {

    try {

      await navigator.share({

        title:
          state.roamName ||
          "Roam",

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


/* =========================================================
   JOIN ROAM
========================================================= */

async function startParticipantFlow() {

  const input =
    document.getElementById(
      "joinCode"
    );


  if (!input) {
    return;
  }


  const code =
    input.value
      .trim()
      .toUpperCase();


  if (!code) {

    showToast(
      "Enter a Roam code."
    );

    input.focus();

    return;
  }


  if (!supabaseClient) {

    showToast(
      "Add your Supabase Publishable key first."
    );

    return;
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("rooms")
        .select("*")
        .eq(
          "code",
          code
        )
        .limit(1);


    if (error) {

      console.error(
        error
      );


      showToast(
        "Couldn't find that Roam."
      );

      return;
    }


    if (
      !data ||
      data.length === 0
    ) {

      showToast(
        "No Roam found with that code."
      );

      return;
    }


    const room =
      data[0];


    /*
      Reset participant state
      for a new joined Roam.
    */

    state.participantSaved =
      false;

    state.budget =
      null;

    state.selectedTimes =
      [];


    state.roomId =
      room.id;

    state.roomCode =
      room.code;

    state.roamName =
      room.name;

    state.location =
      room.location_text;

    state.lat =
      room.lat;

    state.lng =
      room.lng;

    state.groupSize =
      room.group_size;


    state.selectedDates =
      Array.isArray(
        room.candidate_dates
      )
        ? room.candidate_dates
        : [];


    state.activity =
      room.activity ||
      "";


    const roomName =
      document.getElementById(
        "joinRoomName"
      );


    const roomLocation =
      document.getElementById(
        "joinRoomLocation"
      );


    const roomCode =
      document.getElementById(
        "joinRoomCode"
      );


    if (roomName) {

      roomName.textContent =
        room.name;
    }


    if (roomLocation) {

      roomLocation.textContent =
        room.location_text;
    }


    if (roomCode) {

      roomCode.textContent =
        room.code;
    }


    showScreen(
      "join-confirm"
    );

  } catch (error) {

    console.error(
      error
    );


    showToast(
      "Something went wrong."
    );
  }
}


/* =========================================================
   JOIN CONFIRMATION
========================================================= */

function continueJoining() {

  if (!state.roomId) {

    showToast(
      "Find a Roam first."
    );

    return;
  }


  state.selectedTimes =
    [];


  state.participantSaved =
    false;


  const nameInput =
    document.getElementById(
      "participantName"
    );


  if (nameInput) {

    nameInput.value =
      "";
  }


  buildTimes();


  showScreen(
    "availability"
  );
}


/* =========================================================
   FORMAT DISTANCE
========================================================= */

function formatDistance(
  miles
) {

  if (
    !Number.isFinite(
      miles
    )
  ) {

    return "";
  }


  if (
    miles < 0.1
  ) {

    return "< 0.1 mi";
  }


  return (
    `${miles.toFixed(1)} mi`
  );
}


/* =========================================================
   GOOGLE MAPS EXTERNAL LINK
   No API key required.
========================================================= */

function createMapsLink(
  name,
  lat,
  lng
) {

  return (
    "https://www.google.com/maps/search/?api=1" +
    `&query=${encodeURIComponent(
      `${name} ${lat},${lng}`
    )}`
  );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


/* =========================================================
   TOAST
========================================================= */

let toastTimer =
  null;


function showToast(
  message
) {

  const toast =
    document.getElementById(
      "toast"
    );


  if (!toast) {

    alert(
      message
    );

    return;
  }


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2800
    );
}


/* =========================================================
   EXPOSE FUNCTIONS
   Needed because index.html uses onclick=""
========================================================= */

window.goHome =
  goHome;

window.openCreate =
  openCreate;

window.openJoin =
  openJoin;

window.saveRoamDetails =
  saveRoamDetails;

window.saveDates =
  saveDates;

window.saveAvailability =
  saveAvailability;

window.selectBudget =
  selectBudget;

window.saveBudget =
  saveBudget;

window.selectActivity =
  selectActivity;

window.getUserLocation =
  getUserLocation;

window.startParticipantFlow =
  startParticipantFlow;

window.continueJoining =
  continueJoining;

window.copyPlan =
  copyPlan;

window.sharePlan =
  sharePlan;

window.changeGroupSize =
  changeGroupSize;

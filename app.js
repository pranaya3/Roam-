/* =========================================================
   ROAM — APP.JS
   Supabase + OpenStreetMap + Overpass
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://vvbgksamdlhkkchyhlyl.supabase.co";

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
   APP STATE
========================================================= */

const state = {
  currentScreen: "home",

  room: null,

  roomId: null,

  participant: null,

  participantSaved: false,

  selectedDates: [],

  availability: {},

  budget: null,

  activity: null,

  places: [],

  selectedPlace: null,

  userLocation: {
    lat: null,
    lng: null
  },

  candidateTimes: [],

  selectedTime: null
};


/* =========================================================
   SCREEN MANAGEMENT
========================================================= */

const screenOrder = [
  "home",
  "create",
  "dates",
  "availability",
  "budget",
  "activity",
  "results",
  "places",
  "final",
  "join",
  "join-confirm"
];


function showScreen(screenId) {

  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const target = document.getElementById(screenId);

  if (!target) {
    console.error(`Screen not found: ${screenId}`);
    return;
  }

  target.classList.add("active");

  state.currentScreen = screenId;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  updateProgress();
}


/* =========================================================
   PROGRESS BAR
========================================================= */

function updateProgress() {

  const progress = document.getElementById("progress");

  if (!progress) {
    return;
  }

  const flowScreens = [
    "create",
    "dates",
    "availability",
    "budget",
    "activity",
    "results",
    "places",
    "final"
  ];

  const index = flowScreens.indexOf(state.currentScreen);

  if (index === -1) {
    progress.style.width = "0%";
    return;
  }

  const percentage =
    ((index + 1) / flowScreens.length) * 100;

  progress.style.width = `${percentage}%`;
}


/* =========================================================
   HOME
========================================================= */

function goHome() {

  resetFlow();

  showScreen("home");
}


function startRoam() {

  resetFlow();

  showScreen("create");
}


function resetFlow() {

  state.room = null;
  state.roomId = null;

  state.participant = null;
  state.participantSaved = false;

  state.selectedDates = [];
  state.availability = {};

  state.budget = null;
  state.activity = null;

  state.places = [];
  state.selectedPlace = null;

  state.candidateTimes = [];
  state.selectedTime = null;

  document
    .querySelectorAll(".activity-card")
    .forEach(card => {
      card.classList.remove("selected");
    });

  document
    .querySelectorAll(".budget-card")
    .forEach(card => {
      card.classList.remove("selected");
    });

  const dateList =
    document.getElementById("selectedDates");

  if (dateList) {
    dateList.innerHTML = "";
  }
}


/* =========================================================
   CREATE ROAM
========================================================= */

function continueCreate() {

  const name =
    document.getElementById("roamName").value.trim();

  const location =
    document.getElementById("roamLocation").value.trim();

  const groupSize =
    Number(document.getElementById("groupSize").value);


  if (!name) {
    showToast("Give your Roam a name first.");
    return;
  }

  if (!location) {
    showToast("Add a starting location.");
    return;
  }

  if (
    !groupSize ||
    groupSize < 2 ||
    groupSize > 50
  ) {
    showToast("Group size must be between 2 and 50.");
    return;
  }


  state.room = {
    name,
    location_text: location,
    group_size: groupSize
  };


  showScreen("dates");
}


/* =========================================================
   LOCATION
========================================================= */

function getUserLocation() {

  if (!navigator.geolocation) {
    showToast("Location isn't available in this browser.");
    return;
  }

  showToast("Finding your location...");


  navigator.geolocation.getCurrentPosition(
    async position => {

      const lat =
        position.coords.latitude;

      const lng =
        position.coords.longitude;


      state.userLocation = {
        lat,
        lng
      };


      try {

        const location =
          await reverseGeocode(lat, lng);

        const input =
          document.getElementById("roamLocation");

        if (input) {
          input.value = location;
        }

        showToast("Location found.");

      } catch (error) {

        console.error(error);

        const input =
          document.getElementById("roamLocation");

        if (input) {
          input.value =
            `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }

        showToast("Location found.");
      }
    },

    error => {

      console.error(error);

      showToast(
        "Couldn't access your location. Enter it manually."
      );
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}


/* =========================================================
   REVERSE GEOCODING
========================================================= */

async function reverseGeocode(lat, lng) {

  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;

  const response =
    await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

  if (!response.ok) {
    throw new Error("Reverse geocoding failed.");
  }

  const data =
    await response.json();

  return (
    data.display_name ||
    `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  );
}


/* =========================================================
   DATES
========================================================= */

function addDate() {

  const picker =
    document.getElementById("datePicker");

  if (!picker || !picker.value) {
    showToast("Choose a date first.");
    return;
  }

  const date =
    picker.value;


  if (state.selectedDates.includes(date)) {
    showToast("That date is already added.");
    return;
  }


  if (state.selectedDates.length >= 7) {
    showToast("You can choose up to 7 dates.");
    return;
  }


  state.selectedDates.push(date);

  state.selectedDates.sort();

  renderSelectedDates();

  picker.value = "";
}


function removeDate(date) {

  state.selectedDates =
    state.selectedDates.filter(
      item => item !== date
    );

  renderSelectedDates();
}


function renderSelectedDates() {

  const container =
    document.getElementById("selectedDates");

  if (!container) {
    return;
  }

  container.innerHTML = "";


  state.selectedDates.forEach(date => {

    const chip =
      document.createElement("div");

    chip.className = "date-chip";

    const formatted =
      formatDate(date);

    chip.innerHTML = `
      <span>${formatted}</span>
      <button
        type="button"
        onclick="removeDate('${date}')"
        aria-label="Remove ${formatted}"
      >
        ×
      </button>
    `;

    container.appendChild(chip);
  });
}


function formatDate(dateString) {

  const date =
    new Date(`${dateString}T12:00:00`);

  return date.toLocaleDateString(
    undefined,
    {
      weekday: "short",
      month: "short",
      day: "numeric"
    }
  );
}


function continueDates() {

  if (state.selectedDates.length === 0) {
    showToast("Choose at least one date.");
    return;
  }

  renderAvailability();

  showScreen("availability");
}


/* =========================================================
   AVAILABILITY
========================================================= */

const timeOptions = [
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


function renderAvailability() {

  const container =
    document.getElementById("availabilityList");

  if (!container) {
    return;
  }

  container.innerHTML = "";


  state.selectedDates.forEach(date => {

    if (!state.availability[date]) {
      state.availability[date] = [];
    }


    const wrapper =
      document.createElement("div");

    wrapper.className =
      "availability-day";


    const title =
      document.createElement("h3");

    title.textContent =
      formatDate(date);


    const options =
      document.createElement("div");

    options.className =
      "time-options";


    timeOptions.forEach(time => {

      const button =
        document.createElement("button");

      button.type = "button";

      button.className = "time-option";

      button.textContent = time;


      if (
        state.availability[date].includes(time)
      ) {
        button.classList.add("selected");
      }


      button.addEventListener(
        "click",
        () => {

          const selected =
            state.availability[date];

          const index =
            selected.indexOf(time);


          if (index === -1) {

            selected.push(time);

            button.classList.add("selected");

          } else {

            selected.splice(index, 1);

            button.classList.remove("selected");
          }
        }
      );


      options.appendChild(button);
    });


    wrapper.appendChild(title);

    wrapper.appendChild(options);

    container.appendChild(wrapper);
  });
}


function continueAvailability() {

  const hasAvailability =
    Object.values(state.availability)
      .some(times => times.length > 0);


  if (!hasAvailability) {
    showToast("Choose at least one time.");
    return;
  }


  showScreen("budget");
}


/* =========================================================
   BUDGET
========================================================= */

function selectBudget(amount) {

  state.budget = amount;


  document
    .querySelectorAll(".budget-card")
    .forEach(card => {

      card.classList.remove("selected");

      const text =
        card.innerText;

      if (
        (amount === 20 && text.includes("Under $20")) ||
        (amount === 40 && text.includes("$20–$40")) ||
        (amount === 60 && text.includes("$40–$60")) ||
        (amount === 100 && text.includes("$60–$100")) ||
        (amount === 150 && text.includes("$100+"))
      ) {
        card.classList.add("selected");
      }
    });
}


function continueBudget() {

  if (state.budget === null) {
    showToast("Pick a budget first.");
    return;
  }

  showScreen("activity");
}


/* =========================================================
   ACTIVITY
========================================================= */

function selectActivity(card, activity) {

  state.activity = activity;


  document
    .querySelectorAll(".activity-card")
    .forEach(item => {
      item.classList.remove("selected");
    });


  if (card) {
    card.classList.add("selected");
  }
}


async function continueActivity() {

  if (!state.activity) {
    showToast("Pick something fun first.");
    return;
  }


  showToast("Putting your Roam together...");


  try {

    await saveRoom();

    await saveParticipant();

    await calculateAverageBudget();

    calculateBestTimes();

    renderResults();

    showScreen("results");

  } catch (error) {

    console.error(error);

    showToast(
      error.message ||
      "Something went wrong creating your Roam."
    );
  }
}


/* =========================================================
   SAVE ROOM
========================================================= */

async function saveRoom() {

  if (!supabaseClient) {

    console.warn(
      "Supabase isn't configured."
    );

    state.roomId =
      state.roomId ||
      crypto.randomUUID();

    return state.roomId;
  }


  if (state.roomId) {
    return state.roomId;
  }


  const organizerToken =
    getOrCreateToken(
      "roam-organizer-token"
    );


  const roomCode =
    await generateUniqueRoomCode();


  const payload = {

    code: roomCode,

    name:
      state.room.name,

    location_text:
      state.room.location_text,

    lat:
      state.userLocation.lat,

    lng:
      state.userLocation.lng,

    group_size:
      state.room.group_size,

    candidate_dates:
      state.selectedDates,

    activity:
      state.activity,

    organizer_token:
      organizerToken
  };


  const {
    data,
    error
  } =
    await supabaseClient
      .from("rooms")
      .insert(payload)
      .select()
      .single();


  if (error) {
    console.error(error);

    throw new Error(
      `Couldn't create your Roam: ${error.message}`
    );
  }


  state.roomId =
    data.id;

  state.room =
    data;


  showToast(
    `Your Roam code is ${data.code}`
  );


  return data.id;
}


/* =========================================================
   ROOM CODE
========================================================= */

async function generateUniqueRoomCode() {

  const words = [
    "SUNSET",
    "PEACH",
    "ROAM",
    "VISTA",
    "GROVE",
    "BREEZE",
    "PICNIC",
    "GOLDEN",
    "WANDER",
    "WEEKEND",
    "SUNNY",
    "RIVER",
    "ORANGE",
    "BLOOM",
    "PALM",
    "CLOUD",
    "MELLOW",
    "COAST",
    "LUNA",
    "CITRUS",
    "OLIVE",
    "CLOVE",
    "PATIO",
    "GARDEN",
    "SPRING",
    "MARBLE",
    "VENICE",
    "CANAL",
    "TERRACE",
    "STROLL"
  ];


  for (let attempt = 0; attempt < 20; attempt++) {

    const code =
      words[
        Math.floor(
          Math.random() * words.length
        )
      ];


    if (!supabaseClient) {
      return code;
    }


    const {
      data,
      error
    } =
      await supabaseClient
        .from("rooms")
        .select("id")
        .eq("code", code)
        .maybeSingle();


    if (error) {
      console.error(error);

      throw new Error(
        "Couldn't check Roam code availability."
      );
    }


    if (!data) {
      return code;
    }
  }


  return (
    "ROAM" +
    Math.floor(
      100 + Math.random() * 900
    )
  );
}


/* =========================================================
   PARTICIPANT
========================================================= */

async function saveParticipant() {

  if (state.participantSaved) {
    return;
  }


  if (!state.roomId) {
    return;
  }


  const participantToken =
    getOrCreateToken(
      "roam-participant-token"
    );


  const participantName =
    state.participant?.name ||
    "Organizer";


  const payload = {

    room_id:
      state.roomId,

    name:
      participantName,

    participant_token:
      participantToken,

    availability:
      state.availability,

    budget:
      state.budget
  };


  if (!supabaseClient) {

    state.participantSaved = true;

    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("participants")
      .insert(payload)
      .select()
      .single();


  if (error) {

    console.error(error);

    throw new Error(
      `Couldn't save your availability: ${error.message}`
    );
  }


  state.participant =
    data;

  state.participantSaved =
    true;
}


/* =========================================================
   AVERAGE BUDGET
========================================================= */

async function calculateAverageBudget() {

  if (!supabaseClient || !state.roomId) {
    return null;
  }


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

    console.error(error);

    return null;
  }


  let average = null;


  if (Array.isArray(data)) {

    average =
      data[0]?.average_budget ?? null;

  } else if (data) {

    average =
      data.average_budget ?? null;
  }


  state.averageBudget =
    average;


  return average;
}


/* =========================================================
   BEST TIMES
========================================================= */

function calculateBestTimes() {

  const scores = [];


  state.selectedDates.forEach(date => {

    const times =
      state.availability[date] || [];


    times.forEach(time => {

      scores.push({
        date,
        time,
        score: 1
      });

    });
  });


  scores.sort(
    (a, b) => b.score - a.score
  );


  state.candidateTimes =
    scores.slice(0, 3);


  state.selectedTime =
    state.candidateTimes[0] || null;
}


/* =========================================================
   RESULTS
========================================================= */

function renderResults() {

  const container =
    document.getElementById("resultsList");

  if (!container) {
    return;
  }


  container.innerHTML = "";


  if (!state.candidateTimes.length) {

    container.innerHTML = `
      <div class="result-card">
        <div>
          <h3>No times yet</h3>
          <p>
            Try adding another date or availability window.
          </p>
        </div>
      </div>
    `;

    return;
  }


  state.candidateTimes.forEach(
    (option, index) => {

      const card =
        document.createElement("div");

      card.className =
        "result-card";


      card.innerHTML = `
        <div>
          <h3>
            ${formatDate(option.date)}
          </h3>

          <p>
            ${option.time}
          </p>
        </div>

        <strong>
          ${index === 0 ? "Best match" : "Good option"}
        </strong>
      `;


      card.addEventListener(
        "click",
        () => {

          state.selectedTime =
            option;

          document
            .querySelectorAll(".result-card")
            .forEach(item => {
              item.style.borderColor = "";
            });

          card.style.borderColor =
            "var(--orange)";
        }
      );


      container.appendChild(card);
    }
  );
}


function continueResults() {

  if (!state.selectedTime) {

    state.selectedTime =
      state.candidateTimes[0] || null;
  }


  if (!state.selectedTime) {

    showToast(
      "Choose a time before finding places."
    );

    return;
  }


  findNearbyPlaces();
}


/* =========================================================
   ACTIVITY → OSM TAGS
========================================================= */

const activityQueries = {

  food: `
    nwr[
      amenity=restaurant
    ]
  `,

  coffee: `
    nwr[
      amenity=cafe
    ]
  `,

  movies: `
    nwr[
      amenity=cinema
    ]
  `,

  bowling: `
    nwr[
      leisure=bowling_alley
    ]
  `,

  outdoors: `
    nwr[
      leisure=park
    ]
  `,

  arts: `
    nwr[
      tourism=museum
    ];

    nwr[
      amenity=theatre
    ];

    nwr[
      tourism=gallery
    ]
  `,

  games: `
    nwr[
      leisure=amusement_arcade
    ];

    nwr[
      leisure=escape_game
    ];

    nwr[
      amenity=game_centre
    ]
  `,

  other: `
    nwr[
      amenity=restaurant
    ];

    nwr[
      amenity=cafe
    ];

    nwr[
      tourism=museum
    ];

    nwr[
      leisure=park
    ]
  `
};


/* =========================================================
   FIND PLACES
========================================================= */

async function findNearbyPlaces() {

  showScreen("places");


  const container =
    document.getElementById("placesList");

  if (!container) {
    return;
  }


  container.innerHTML = `
    <div class="result-card">
      <div>
        <h3>Finding places...</h3>
        <p>
          Looking for ${getActivityLabel(state.activity)}
          near you.
        </p>
      </div>
    </div>
  `;


  try {

    let lat =
      state.userLocation.lat;

    let lng =
      state.userLocation.lng;


    if (!lat || !lng) {

      const location =
        state.room?.location_text;

      if (!location) {
        throw new Error(
          "We need a starting location first."
        );
      }


      const coords =
        await geocodeLocation(location);

      lat =
        coords.lat;

      lng =
        coords.lng;
    }


    const places =
      await queryOverpass(
        lat,
        lng,
        state.activity
      );


    state.places =
      places;


    renderPlaces();


  } catch (error) {

    console.error(error);


    container.innerHTML = `
      <div class="result-card">
        <div>
          <h3>Couldn't find places</h3>

          <p>
            ${escapeHtml(
              error.message ||
              "Please try again."
            )}
          </p>
        </div>

        <button
          class="secondary-button"
          type="button"
          onclick="findNearbyPlaces()"
        >
          Try again
        </button>
      </div>
    `;
  }
}


/* =========================================================
   GEOCODE
========================================================= */

async function geocodeLocation(location) {

  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(location)}`;


  const response =
    await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });


  if (!response.ok) {
    throw new Error(
      "Couldn't find that location."
    );
  }


  const data =
    await response.json();


  if (!data.length) {
    throw new Error(
      "Couldn't find that location."
    );
  }


  return {
    lat:
      Number(data[0].lat),

    lng:
      Number(data[0].lon)
  };
}


/* =========================================================
   OVERPASS
========================================================= */

async function queryOverpass(
  lat,
  lng,
  activity
) {

  const query =
    activityQueries[activity] ||
    activityQueries.other;


  const radius =
    7000;


  const overpassQuery = `
    [out:json][timeout:25];

    (
      ${query
        .replace(
          /nwr/g,
          `nwr(around:${radius},${lat},${lng})`
        )
      }
    );

    out center tags;
  `;


  const endpoints = [

    "https://overpass-api.de/api/interpreter",

    "https://overpass.kumi.systems/api/interpreter"

  ];


  let lastError = null;


  for (const endpoint of endpoints) {

    try {

      const response =
        await fetch(
          endpoint,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "text/plain;charset=UTF-8"
            },

            body:
              overpassQuery
          }
        );


      if (!response.ok) {
        throw new Error(
          `Overpass returned ${response.status}`
        );
      }


      const data =
        await response.json();


      return parseOverpassPlaces(
        data.elements || [],
        lat,
        lng,
        activity
      );


    } catch (error) {

      console.error(
        endpoint,
        error
      );

      lastError =
        error;
    }
  }


  throw new Error(
    lastError?.message ||
    "Nearby place search failed."
  );
}


/* =========================================================
   PARSE PLACES
========================================================= */

function parseOverpassPlaces(
  elements,
  userLat,
  userLng,
  activity
) {

  const results = [];


  elements.forEach(element => {

    const tags =
      element.tags || {};


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
      typeof lat !== "number" ||
      typeof lng !== "number"
    ) {
      return;
    }


    const distance =
      calculateDistance(
        userLat,
        userLng,
        lat,
        lng
      );


    const category =
      getActivityLabel(activity);


    results.push({

      id:
        `${element.type}-${element.id}`,

      name,

      category,

      lat,

      lng,

      distance,

      address:
        buildAddress(tags),

      tags
    });

  });


  results.sort(
    (a, b) =>
      a.distance - b.distance
  );


  const unique =
    [];


  const seen =
    new Set();


  results.forEach(place => {

    const key =
      place.name.toLowerCase();


    if (!seen.has(key)) {

      seen.add(key);

      unique.push(place);
    }
  });


  return unique.slice(0, 12);
}


/* =========================================================
   ADDRESS
========================================================= */

function buildAddress(tags) {

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


function degreesToRadians(degrees) {

  return degrees *
    (Math.PI / 180);
}


/* =========================================================
   RENDER PLACES
========================================================= */

function renderPlaces() {

  const container =
    document.getElementById("placesList");

  if (!container) {
    return;
  }


  container.innerHTML = "";


  if (!state.places.length) {

    container.innerHTML = `
      <div class="result-card">
        <div>
          <h3>No nearby places found.</h3>

          <p>
            Try another activity or a different starting location.
          </p>
        </div>
      </div>
    `;

    return;
  }


  state.places.forEach(place => {

    const card =
      document.createElement("div");

    card.className =
      "place-card";


    const distance =
      place.distance < 0.1
        ? "Very close"
        : `${place.distance.toFixed(1)} mi away`;


    card.innerHTML = `

      <h3>
        ${escapeHtml(place.name)}
      </h3>

      <p>
        ${escapeHtml(place.category)}
        · ${distance}
      </p>

      ${
        place.address
          ? `
            <p>
              ${escapeHtml(place.address)}
            </p>
          `
          : ""
      }

      <button
        class="primary-button full-width"
        type="button"
      >
        Choose this place
      </button>
    `;


    const button =
      card.querySelector("button");


    button.addEventListener(
      "click",
      () => {

        selectPlace(place);
      }
    );


    container.appendChild(card);
  });
}


/* =========================================================
   SELECT PLACE
========================================================= */

function selectPlace(place) {

  state.selectedPlace =
    place;


  renderFinalPlan();

  showScreen("final");
}


/* =========================================================
   FINAL PLAN
========================================================= */

function renderFinalPlan() {

  const container =
    document.getElementById("finalPlan");

  if (!container) {
    return;
  }


  const place =
    state.selectedPlace;


  const time =
    state.selectedTime;


  const roomName =
    state.room?.name ||
    "Roam";


  const dateText =
    time
      ? formatDate(time.date)
      : "Your chosen day";


  const timeText =
    time
      ? time.time
      : "Your chosen time";


  if (!place) {

    container.innerHTML = `
      <h3>Your plan is almost ready.</h3>
    `;

    return;
  }


  const averageBudget =
    state.averageBudget;


  container.innerHTML = `

    <h3>
      ${escapeHtml(roomName)}
    </h3>

    <p>
      ${escapeHtml(place.name)}
    </p>


    <div class="plan-detail">

      <p>
        <strong>When</strong><br>
        ${escapeHtml(dateText)}
        at
        ${escapeHtml(timeText)}
      </p>


      <p>
        <strong>What</strong><br>
        ${escapeHtml(
          getActivityLabel(state.activity)
        )}
      </p>


      ${
        averageBudget
          ? `
            <p>
              <strong>Group budget</strong><br>
              About $${Number(
                averageBudget
              ).toFixed(0)} per person
            </p>
          `
          : ""
      }

    </div>
  `;
}


/* =========================================================
   COPY PLAN
========================================================= */

async function copyPlan() {

  const place =
    state.selectedPlace;

  const time =
    state.selectedTime;


  if (!place) {
    return;
  }


  const text = [

    `Roam: ${state.room?.name || "Hangout"}`,

    "",

    `📍 ${place.name}`,

    `📅 ${time ? formatDate(time.date) : ""}`,

    `🕐 ${time ? time.time : ""}`,

    `🎉 ${getActivityLabel(state.activity)}`

  ].join("\n");


  try {

    await navigator.clipboard.writeText(text);

    showToast("Plan copied!");

  } catch (error) {

    console.error(error);

    showToast(
      "Couldn't copy automatically."
    );
  }
}


/* =========================================================
   JOIN A ROAM
========================================================= */

function openJoin() {

  showScreen("join");

  const input =
    document.getElementById("joinCode");

  if (input) {
    setTimeout(
      () => input.focus(),
      250
    );
  }
}


async function findRoam() {

  const input =
    document.getElementById("joinCode");


  const code =
    input.value
      .trim()
      .toUpperCase();


  if (!code) {

    showToast(
      "Enter a Roam code."
    );

    return;
  }


  if (!supabaseClient) {

    showToast(
      "Connect your Supabase key first."
    );

    return;
  }


  showToast(
    "Finding your Roam..."
  );


  const {
    data,
    error
  } =
    await supabaseClient
      .from("rooms")
      .select("*")
      .eq("code", code)
      .maybeSingle();


  if (error) {

    console.error(error);

    showToast(
      "Couldn't find that Roam."
    );

    return;
  }


  if (!data) {

    showToast(
      "No Roam found with that code."
    );

    return;
  }


  state.room =
    data;

  state.roomId =
    data.id;

  state.activity =
    data.activity;


  document.getElementById(
    "joinRoomName"
  ).textContent =
    data.name;


  document.getElementById(
    "joinRoomLocation"
  ).textContent =
    data.location_text;


  document.getElementById(
    "joinRoomCode"
  ).textContent =
    data.code;


  showScreen("join-confirm");
}


/* =========================================================
   JOIN ROAM
========================================================= */

async function joinRoam() {

  const input =
    document.getElementById(
      "participantName"
    );


  const name =
    input.value.trim();


  if (!name) {

    showToast(
      "Enter your name."
    );

    return;
  }


  state.participant = {
    name
  };


  if (!state.room) {

    showToast(
      "No Roam is loaded."
    );

    return;
  }


  state.selectedDates =
    Array.isArray(
      state.room.candidate_dates
    )
      ? state.room.candidate_dates
      : [];


  if (
    state.selectedDates.length
  ) {

    renderAvailability();

    showScreen("availability");

  } else {

    showScreen("budget");
  }
}


/* =========================================================
   SAVE JOINER
========================================================= */

async function saveJoinedParticipant() {

  if (!state.roomId) {
    return;
  }


  if (!state.participant) {
    return;
  }


  state.participantSaved = false;


  await saveParticipant();
}


/* =========================================================
   ACTIVITY LABEL
========================================================= */

function getActivityLabel(activity) {

  const labels = {

    food: "Food",

    coffee: "Coffee",

    movies: "Movies",

    bowling: "Bowling",

    outdoors: "Outdoors",

    arts: "Arts",

    games: "Games",

    other: "Something else"
  };


  return (
    labels[activity] ||
    "Something fun"
  );
}


/* =========================================================
   TOKEN
========================================================= */

function getOrCreateToken(key) {

  let token =
    localStorage.getItem(key);


  if (token) {
    return token;
  }


  token =
    generateToken();


  localStorage.setItem(
    key,
    token
  );


  return token;
}


function generateToken() {

  if (
    window.crypto &&
    crypto.randomUUID
  ) {

    return crypto.randomUUID();
  }


  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .substring(2)
  );
}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(message) {

  const toast =
    document.getElementById("toast");


  if (!toast) {
    return;
  }


  toast.textContent =
    message;


  toast.classList.add("show");


  clearTimeout(toastTimer);


  toastTimer =
    setTimeout(() => {

      toast.classList.remove("show");

    }, 2800);
}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    showScreen("home");

  }
);


/* =========================================================
   EXPOSE FUNCTIONS FOR HTML ONCLICK
========================================================= */

window.goHome =
  goHome;

window.startRoam =
  startRoam;

window.openJoin =
  openJoin;

window.continueCreate =
  continueCreate;

window.getUserLocation =
  getUserLocation;

window.addDate =
  addDate;

window.removeDate =
  removeDate;

window.continueDates =
  continueDates;

window.continueAvailability =
  continueAvailability;

window.selectBudget =
  selectBudget;

window.continueBudget =
  continueBudget;

window.selectActivity =
  selectActivity;

window.continueActivity =
  continueActivity;

window.continueResults =
  continueResults;

window.findNearbyPlaces =
  findNearbyPlaces;

window.selectPlace =
  selectPlace;

window.copyPlan =
  copyPlan;

window.findRoam =
  findRoam;

window.joinRoam =
  joinRoam;

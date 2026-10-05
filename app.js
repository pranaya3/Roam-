/* =========================================================
   ROAM
   Main application
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://vvbgksamdlhkkchyhlyl.supabase.co";

/*
  IMPORTANT:
  Replace the value below with your Supabase Publishable key.
  It starts with sb_publishable_
*/
const SUPABASE_KEY =
  "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE";


let supabaseClient = null;

if (
  window.supabase &&
  SUPABASE_KEY &&
  SUPABASE_KEY !==
    "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE"
) {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );
}


/* =========================================================
   APP STATE
========================================================= */

const state = {

  roamName: "",
  location: "",

  lat: null,
  lng: null,

  groupSize: 4,

  candidateDates: [],
  selectedDates: [],

  participantName: "",

  selectedTimes: [],

  budget: null,

  activity: "",

  roomId: null,
  roomCode: "",

  organizerToken: "",

  joinedRoom: null,
  participantId: null,

  selectedTime: null,
  selectedPlace: null,

  places: [],

  averageBudget: null
};


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (id) =>
  document.getElementById(id);


function showScreen(id) {

  document
    .querySelectorAll(".screen")
    .forEach((screen) => {
      screen.classList.remove("active");
    });

  const screen = $(id);

  if (screen) {
    screen.classList.add("active");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function toast(message) {

  const element = $("toast");

  if (!element) return;

  element.textContent = message;

  element.classList.add("show");

  clearTimeout(window.roamToastTimer);

  window.roamToastTimer =
    setTimeout(() => {
      element.classList.remove("show");
    }, 2600);
}


function generateToken() {

  if (window.crypto?.randomUUID) {
    return crypto.randomUUID() + crypto.randomUUID();
  }

  return (
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}


/* =========================================================
   START / RESET
========================================================= */

function resetState() {

  state.roamName = "";
  state.location = "";

  state.lat = null;
  state.lng = null;

  state.groupSize = 4;

  state.candidateDates = [];
  state.selectedDates = [];

  state.participantName = "";

  state.selectedTimes = [];

  state.budget = null;

  state.activity = "";

  state.roomId = null;
  state.roomCode = "";

  state.organizerToken = "";

  state.joinedRoom = null;
  state.participantId = null;

  state.selectedTime = null;
  state.selectedPlace = null;

  state.places = [];

  state.averageBudget = null;

  if ($("roamName")) {
    $("roamName").value = "";
  }

  if ($("location")) {
    $("location").value = "";
  }

  if ($("groupSize")) {
    $("groupSize").value = 4;
  }

  if ($("participantName")) {
    $("participantName").value = "";
  }

  if ($("joinCode")) {
    $("joinCode").value = "";
  }

  if ($("joinName")) {
    $("joinName").value = "";
  }

  document
    .querySelectorAll(".selected")
    .forEach((element) => {
      element.classList.remove("selected");
    });
}


function startRoam() {

  resetState();

  showScreen("createScreen");
}


/* =========================================================
   CREATE ROAM
========================================================= */

function saveRoamDetails() {

  const name =
    $("roamName")?.value.trim();

  const location =
    $("location")?.value.trim();

  const groupSize =
    Number($("groupSize")?.value);

  if (!name) {
    toast("Give your Roam a name.");
    return;
  }

  if (!location) {
    toast("Add a location.");
    return;
  }

  if (
    !Number.isInteger(groupSize) ||
    groupSize < 2 ||
    groupSize > 50
  ) {
    toast("Group size must be between 2 and 50.");
    return;
  }

  state.roamName = name;
  state.location = location;
  state.groupSize = groupSize;

  buildDates();

  showScreen("datesScreen");
}


/* =========================================================
   DATES
========================================================= */

function buildDates() {

  const grid = $("dateGrid");

  if (!grid) return;

  grid.innerHTML = "";

  state.candidateDates = [];

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 14; i++) {

    const date =
      new Date(today);

    date.setDate(
      today.getDate() + i
    );

    const iso =
      date.toISOString().split("T")[0];

    state.candidateDates.push(iso);

    const button =
      document.createElement("button");

    button.type = "button";

    button.className =
      "date-option";

    button.dataset.date = iso;

    const day =
      date.toLocaleDateString(
        undefined,
        { weekday: "short" }
      );

    const month =
      date.toLocaleDateString(
        undefined,
        { month: "short" }
      );

    const number =
      date.getDate();

    button.innerHTML = `
      <span class="date-day">${day}</span>
      <span class="date-number">${month} ${number}</span>
    `;

    button.addEventListener(
      "click",
      () => toggleDate(iso, button)
    );

    grid.appendChild(button);
  }
}


function toggleDate(date, button) {

  const index =
    state.selectedDates.indexOf(date);

  if (index >= 0) {

    state.selectedDates.splice(
      index,
      1
    );

    button.classList.remove(
      "selected"
    );

  } else {

    state.selectedDates.push(date);

    button.classList.add(
      "selected"
    );
  }
}


function saveDates() {

  if (!state.selectedDates.length) {
    toast("Pick at least one day.");
    return;
  }

  buildTimes();

  showScreen("availabilityScreen");
}


/* =========================================================
   TIMES
========================================================= */

function buildTimes() {

  const grid = $("timeGrid");

  if (!grid) return;

  grid.innerHTML = "";

  state.selectedTimes = [];

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

  times.forEach((time) => {

    const button =
      document.createElement("button");

    button.type = "button";

    button.className =
      "time-option";

    button.textContent = time;

    button.addEventListener(
      "click",
      () => {

        const index =
          state.selectedTimes.indexOf(time);

        if (index >= 0) {

          state.selectedTimes.splice(
            index,
            1
          );

          button.classList.remove(
            "selected"
          );

        } else {

          state.selectedTimes.push(time);

          button.classList.add(
            "selected"
          );
        }
      }
    );

    grid.appendChild(button);
  });
}


function saveAvailability() {

  if (!state.selectedTimes.length) {
    toast("Pick at least one time.");
    return;
  }

  showScreen("budgetScreen");
}


/* =========================================================
   BUDGET
========================================================= */

function selectBudget(value, button) {

  state.budget =
    Number(value);

  document
    .querySelectorAll(".budget-option")
    .forEach((item) => {
      item.classList.remove("selected");
    });

  button.classList.add("selected");

  $("budgetContinue").disabled =
    false;
}


function finishBudget() {

  if (state.budget === null) {
    toast("Choose a budget first.");
    return;
  }

  showScreen("activityScreen");
}


/* =========================================================
   ACTIVITIES
========================================================= */

const ACTIVITIES = [
  "Food & drinks",
  "Outdoors",
  "Arts & culture",
  "Games & fun",
  "Coffee & chill",
  "Something different"
];


function selectActivity(activity, button) {

  state.activity = activity;

  document
    .querySelectorAll(".activity-card")
    .forEach((card) => {
      card.classList.remove("selected");
    });

  button.classList.add("selected");

  $("activityContinue").disabled =
    false;
}


async function finishActivity() {

  if (!state.activity) {
    toast("Pick something to do.");
    return;
  }

  if (!supabaseClient) {

    toast(
      "Supabase is not connected. Check your Publishable key."
    );

    return;
  }

  const button =
    $("activityContinue");

  button.disabled = true;

  button.textContent =
    "Creating your Roam…";

  try {

    await createRoom();

    showCreatedRoam();

  } catch (error) {

    console.error(error);

    toast(
      error.message ||
      "We couldn't create the Roam."
    );

  } finally {

    button.disabled = false;

    button.textContent =
      "Create my Roam";
  }
}


/* =========================================================
   ROOM CODE
========================================================= */

const CODE_WORDS = [
  "ORANGE",
  "PEACH",
  "ROAM",
  "SUNSET",
  "GROVE",
  "RIVER",
  "MANGO",
  "CLOUD",
  "LAGOON",
  "BREEZE",
  "PARK",
  "WANDER",
  "PATIO",
  "PICNIC",
  "GOLDEN",
  "WEEKEND",
  "VIBE",
  "CITRUS",
  "VENICE",
  "MAPLE"
];


async function generateUniqueCode() {

  for (let attempt = 0; attempt < 20; attempt++) {

    const word =
      CODE_WORDS[
        Math.floor(
          Math.random() *
          CODE_WORDS.length
        )
      ];

    const { data, error } =
      await supabaseClient
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

  return (
    "ROAM" +
    Math.floor(
      1000 +
      Math.random() * 9000
    )
  );
}


/* =========================================================
   CREATE ROOM
========================================================= */

async function createRoom() {

  const code =
    await generateUniqueCode();

  state.roomCode = code;

  state.organizerToken =
    generateToken();

  const roomData = {

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
      .insert(roomData)
      .select()
      .single();


  if (error) {
    console.error(
      "CREATE ROOM ERROR:",
      error
    );

    throw new Error(
      error.message ||
      "Unable to create your Roam."
    );
  }


  state.roomId =
    data.id;


  /*
    Store the organizer as a participant too.
    This allows the budget and availability
    to be included with everyone else.
  */

  const participantData = {

    room_id:
      state.roomId,

    name:
      state.participantName ||
      "Organizer",

    participant_token:
      state.organizerToken,

    availability: {

      dates:
        state.selectedDates,

      times:
        state.selectedTimes
    },

    budget:
      state.budget
  };


  const {
    data: participant,
    error: participantError
  } =
    await supabaseClient
      .from("participants")
      .insert(participantData)
      .select()
      .single();


  if (participantError) {

    console.warn(
      "Organizer participant was not saved:",
      participantError
    );

  } else {

    state.participantId =
      participant.id;
  }
}


/* =========================================================
   CREATED SCREEN
========================================================= */

function showCreatedRoam() {

  const code =
    $("roomCodeDisplay");

  if (code) {
    code.textContent =
      state.roomCode;
  }

  showScreen("resultsScreen");
}


async function copyCode() {

  if (!state.roomCode) return;

  try {

    await navigator.clipboard.writeText(
      state.roomCode
    );

    toast("Code copied.");

  } catch {

    toast(
      `Your code is ${state.roomCode}`
    );
  }
}


/* =========================================================
   VIEW ROAM
========================================================= */

async function viewMyRoam() {

  if (!state.roomId) {
    toast("Your Roam hasn't loaded yet.");
    return;
  }

  state.selectedTime =
    state.selectedTimes[0] ||
    null;

  await loadPlaces();

  showScreen("placesScreen");
}


/* =========================================================
   PLACE SEARCH
========================================================= */

function activitySearchTerm() {

  const map = {

    "Food & drinks":
      "restaurant",

    "Outdoors":
      "park",

    "Arts & culture":
      "museum",

    "Games & fun":
      "entertainment",

    "Coffee & chill":
      "cafe",

    "Something different":
      "things to do"
  };

  return (
    map[state.activity] ||
    "things to do"
  );
}


async function geocodeLocation() {

  if (
    state.lat !== null &&
    state.lng !== null
  ) {
    return {
      lat: state.lat,
      lng: state.lng
    };
  }

  const query =
    encodeURIComponent(
      state.location
    );

  const url =
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`;

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
    throw new Error(
      "We couldn't find that location."
    );
  }

  state.lat =
    Number(data[0].lat);

  state.lng =
    Number(data[0].lon);

  return {
    lat: state.lat,
    lng: state.lng
  };
}


async function loadPlaces() {

  const list =
    $("placesList");

  if (!list) return;

  list.innerHTML = `
    <div class="card">
      Finding a few good spots…
    </div>
  `;


  try {

    const {
      lat,
      lng
    } =
      await geocodeLocation();


    const radius = 8000;

    const query =
      buildOverpassQuery(
        lat,
        lng,
        radius,
        state.activity
      );


    const response =
      await fetch(
        "https://overpass-api.de/api/interpreter",
        {
          method: "POST",
          body: query
        }
      );


    if (!response.ok) {
      throw new Error(
        "Place search failed."
      );
    }


    const data =
      await response.json();


    const places =
      data.elements
        .map(formatPlace)
        .filter(Boolean)
        .slice(0, 9);


    state.places =
      removeDuplicatePlaces(
        places
      );


    renderPlaces();


  } catch (error) {

    console.error(error);

    state.places = [];

    list.innerHTML = `
      <div class="card">
        <strong>We couldn't find places automatically.</strong>
        <p>
          You can still finish your Roam with the activity and time you picked.
        </p>
      </div>
    `;

    $("placesContinue").disabled =
      true;
  }
}


function buildOverpassQuery(
  lat,
  lng,
  radius,
  activity
) {

  const around =
    `(around:${radius},${lat},${lng})`;

  let filters = "";


  if (activity === "Food & drinks") {

    filters = `
      nwr["amenity"="restaurant"]${around};
      nwr["amenity"="bar"]${around};
      nwr["amenity"="pub"]${around};
    `;

  } else if (activity === "Outdoors") {

    filters = `
      nwr["leisure"="park"]${around};
      nwr["leisure"="garden"]${around};
      nwr["tourism"="viewpoint"]${around};
    `;

  } else if (activity === "Arts & culture") {

    filters = `
      nwr["tourism"="museum"]${around};
      nwr["tourism"="gallery"]${around};
      nwr["amenity"="theatre"]${around};
    `;

  } else if (activity === "Games & fun") {

    filters = `
      nwr["leisure"="bowling_alley"]${around};
      nwr["leisure"="miniature_golf"]${around};
      nwr["leisure"="amusement_arcade"]${around};
      nwr["amenity"="cinema"]${around};
    `;

  } else if (activity === "Coffee & chill") {

    filters = `
      nwr["amenity"="cafe"]${around};
    `;

  } else {

    filters = `
      nwr["tourism"]${around};
      nwr["leisure"]${around};
    `;
  }


  return `
    [out:json][timeout:20];

    (
      ${filters}
    );

    out center tags;
  `;
}


function formatPlace(element) {

  const tags =
    element.tags || {};

  const name =
    tags.name;

  if (!name) {
    return null;
  }


  let lat =
    element.lat;

  let lng =
    element.lon;


  if (
    element.center
  ) {

    lat =
      element.center.lat;

    lng =
      element.center.lon;
  }


  if (
    lat === undefined ||
    lng === undefined
  ) {
    return null;
  }


  return {

    id:
      element.id,

    name,

    lat,

    lng,

    address:
      tags["addr:housenumber"] &&
      tags["addr:street"]
        ? `${tags["addr:housenumber"]} ${tags["addr:street"]}`
        : "",

    type:
      tags.amenity ||
      tags.tourism ||
      tags.leisure ||
      state.activity
  };
}


function removeDuplicatePlaces(
  places
) {

  const seen =
    new Set();

  return places.filter(
    (place) => {

      const key =
        place.name
          .trim()
          .toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    }
  );
}


/* =========================================================
   PLACE RENDERING
========================================================= */

function renderPlaces() {

  const list =
    $("placesList");

  if (!list) return;

  list.innerHTML = "";


  if (!state.places.length) {

    list.innerHTML = `
      <div class="card">
        <strong>No nearby options found.</strong>
        <p>
          Try a broader location or choose another activity.
        </p>
      </div>
    `;

    $("placesContinue").disabled =
      true;

    return;
  }


  state.places.forEach(
    (place, index) => {

      const card =
        document.createElement(
          "article"
        );

      card.className =
        "place-card";

      card.innerHTML = `
        <h3>${escapeHtml(place.name)}</h3>

        <p>
          ${
            escapeHtml(
              place.address ||
              "Nearby option"
            )
          }
        </p>

        <p class="place-distance">
          Option ${index + 1}
        </p>
      `;


      card.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".place-card"
            )
            .forEach(
              (item) =>
                item.classList.remove(
                  "selected"
                )
            );

          card.classList.add(
            "selected"
          );

          state.selectedPlace =
            place;

          $("placesContinue").disabled =
            false;
        }
      );


      list.appendChild(card);
    }
  );


  if (
    state.places.length === 1
  ) {

    state.selectedPlace =
      state.places[0];

    list
      .querySelector(
        ".place-card"
      )
      ?.classList.add(
        "selected"
      );

    $("placesContinue").disabled =
      false;
  }
}


/* =========================================================
   FINAL PLAN
========================================================= */

function buildFinalPlan() {

  const plan =
    $("finalPlan");

  if (!plan) return;


  const date =
    state.selectedDates[0]
      ? formatDate(
          state.selectedDates[0]
        )
      : "Flexible";


  const time =
    state.selectedTime ||
    state.selectedTimes[0] ||
    "Flexible";


  const place =
    state.selectedPlace?.name ||
    "A spot near you";


  plan.innerHTML = `

    <div class="plan-row">
      <div class="plan-label">
        When
      </div>

      <div class="plan-value">
        ${escapeHtml(date)} · ${escapeHtml(time)}
      </div>
    </div>


    <div class="plan-row">
      <div class="plan-label">
        Where
      </div>

      <div class="plan-value">
        ${escapeHtml(place)}
      </div>
    </div>


    <div class="plan-row">
      <div class="plan-label">
        Vibe
      </div>

      <div class="plan-value">
        ${escapeHtml(state.activity)}
      </div>
    </div>


    <div class="plan-row">
      <div class="plan-label">
        Roam code
      </div>

      <div class="plan-value">
        ${escapeHtml(state.roomCode)}
      </div>
    </div>

  `;
}


function showFinalPlan() {

  buildFinalPlan();

  showScreen("finalScreen");
}


async function copyPlan() {

  const date =
    state.selectedDates[0]
      ? formatDate(
          state.selectedDates[0]
        )
      : "Flexible";


  const time =
    state.selectedTime ||
    state.selectedTimes[0] ||
    "Flexible";


  const place =
    state.selectedPlace?.name ||
    "A spot near you";


  const text =
`ROAM 🍊

${state.roamName}

${date}
${time}

${place}

${state.activity}

Code: ${state.roomCode}`;


  try {

    await navigator.clipboard.writeText(
      text
    );

    toast("Plan copied.");

  } catch {

    toast(
      "Your plan is ready to share."
    );
  }
}


/* =========================================================
   JOIN A ROAM
========================================================= */

async function findRoam() {

  if (!supabaseClient) {

    toast(
      "Supabase is not connected."
    );

    return;
  }


  const code =
    $("joinCode")
      ?.value
      .trim()
      .toUpperCase();


  if (!code) {

    toast("Enter your Roam code.");

    return;
  }


  const button =
    $("joinFindBtn");

  button.disabled = true;

  button.textContent =
    "Finding it…";


  try {

    const {
      data: room,
      error
    } =
      await supabaseClient
        .from("rooms")
        .select("*")
        .eq("code", code)
        .maybeSingle();


    if (error) {
      throw error;
    }


    if (!room) {

      toast(
        "We couldn't find that Roam."
      );

      return;
    }


    state.joinedRoom =
      room;

    state.roomId =
      room.id;

    state.roomCode =
      room.code;

    state.roamName =
      room.name;

    state.location =
      room.location_text;

    state.activity =
      room.activity || "";


    $("joinRoomName").textContent =
      room.name;

    $("joinRoomLocation").textContent =
      room.location_text;

    $("joinRoomCode").textContent =
      room.code;


    showScreen(
      "joinConfirmScreen"
    );


  } catch (error) {

    console.error(error);

    toast(
      error.message ||
      "Couldn't find the Roam."
    );

  } finally {

    button.disabled = false;

    button.textContent =
      "Find Roam";
  }
}


/* =========================================================
   JOIN CONFIRMATION
========================================================= */

async function joinRoam() {

  const name =
    $("joinName")
      ?.value
      .trim();


  if (!name) {

    toast("Enter your name.");

    return;
  }


  if (!state.joinedRoom) {

    toast(
      "Find a Roam first."
    );

    return;
  }


  state.participantName =
    name;


  state.selectedDates = [];

  state.selectedTimes = [];


  buildJoinedDates();

  showScreen(
    "datesScreen"
  );
}


/*
  For a joined user, dates come from
  the organizer's Roam rather than
  generating new dates.
*/

function buildJoinedDates() {

  const grid =
    $("dateGrid");

  if (!grid) return;


  grid.innerHTML = "";

  state.selectedDates = [];


  const dates =
    state.joinedRoom
      ?.candidate_dates || [];


  if (!dates.length) {

    toast(
      "This Roam doesn't have dates yet."
    );

    return;
  }


  dates.forEach(
    (iso) => {

      const date =
        new Date(
          `${iso}T12:00:00`
        );


      const button =
        document.createElement(
          "button"
        );

      button.type = "button";

      button.className =
        "date-option";

      button.dataset.date =
        iso;


      button.innerHTML = `
        <span class="date-day">
          ${date.toLocaleDateString(
            undefined,
            { weekday: "short" }
          )}
        </span>

        <span class="date-number">
          ${date.toLocaleDateString(
            undefined,
            {
              month: "short",
              day: "numeric"
            }
          )}
        </span>
      `;


      button.addEventListener(
        "click",
        () =>
          toggleDate(
            iso,
            button
          )
      );


      grid.appendChild(
        button
      );
    }
  );
}


/* =========================================================
   JOINED AVAILABILITY
========================================================= */

async function saveJoinedAvailability() {

  if (!state.selectedDates.length) {

    toast(
      "Pick at least one day."
    );

    return;
  }


  buildTimes();

  showScreen(
    "availabilityScreen"
  );


  const button =
    $("availabilityContinue");

  button.onclick =
    saveJoinedTimes;
}


async function saveJoinedTimes() {

  if (!state.selectedTimes.length) {

    toast(
      "Pick at least one time."
    );

    return;
  }


  showScreen(
    "budgetScreen"
  );


  const continueButton =
    $("budgetContinue");

  continueButton.disabled =
    false;

  continueButton.onclick =
    saveJoinedBudget;
}


async function saveJoinedBudget() {

  if (state.budget === null) {

    toast(
      "Choose a budget."
    );

    return;
  }


  try {

    await saveParticipant();

    state.selectedTime =
      state.selectedTimes[0] ||
      null;

    await loadJoinedPlaces();

    showScreen(
      "placesScreen"
    );

  } catch (error) {

    console.error(error);

    toast(
      error.message ||
      "Couldn't save your choices."
    );
  }
}


/* =========================================================
   SAVE PARTICIPANT
========================================================= */

async function saveParticipant() {

  if (!supabaseClient) {
    throw new Error(
      "Supabase is not connected."
    );
  }


  const token =
    generateToken();


  const {
    data,
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
          token,

        availability: {

          dates:
            state.selectedDates,

          times:
            state.selectedTimes
        },

        budget:
          state.budget

      })
      .select()
      .single();


  if (error) {
    throw error;
  }


  state.participantId =
    data.id;
}


/* =========================================================
   JOINED PLACES
========================================================= */

async function loadJoinedPlaces() {

  const list =
    $("placesList");

  if (!list) return;


  list.innerHTML = `
    <div class="card">
      Finding a few good spots…
    </div>
  `;


  state.lat =
    state.joinedRoom?.lat ??
    null;

  state.lng =
    state.joinedRoom?.lng ??
    null;


  state.location =
    state.joinedRoom?.location_text ||
    state.location;


  try {

    await loadPlaces();

  } catch (error) {

    console.error(error);
  }
}


/* =========================================================
   FORMATTING
========================================================= */

function formatDate(iso) {

  if (!iso) {
    return "Flexible";
  }

  const date =
    new Date(
      `${iso}T12:00:00`
    );

  return date.toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "long",
      day: "numeric"
    }
  );
}


function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   LOCATION BUTTON
========================================================= */

function useMyLocation() {

  if (!navigator.geolocation) {

    toast(
      "Location isn't available in this browser."
    );

    return;
  }


  const status =
    $("locationStatus");

  if (status) {
    status.textContent =
      "Finding your location…";
  }


  navigator.geolocation.getCurrentPosition(

    async (position) => {

      state.lat =
        position.coords.latitude;

      state.lng =
        position.coords.longitude;


      try {

        const response =
          await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${state.lat}&lon=${state.lng}`,
            {
              headers: {
                Accept:
                  "application/json"
              }
            }
          );


        const data =
          await response.json();


        const display =
          data.display_name ||
          "Current location";


        state.location =
          display;

        $("location").value =
          display;


        if (status) {
          status.textContent =
            "Location found.";
        }


      } catch {

        $("location").value =
          "Current location";

        state.location =
          "Current location";

        if (status) {
          status.textContent =
            "Location found.";
        }
      }
    },


    () => {

      if (status) {
        status.textContent =
          "Couldn't access your location.";
      }

      toast(
        "You can enter your location manually."
      );
    },

    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000
    }
  );
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {


    /* Home */

    $("startRoamBtn")
      ?.addEventListener(
        "click",
        startRoam
      );


    $("brandHome")
      ?.addEventListener(
        "click",
        () => {
          resetState();
          showScreen("homeScreen");
        }
      );


    $("navJoin")
      ?.addEventListener(
        "click",
        () => {
          showScreen("joinScreen");
        }
      );


    /* Create */

    $("createContinue")
      ?.addEventListener(
        "click",
        saveRoamDetails
      );


    $("createBack")
      ?.addEventListener(
        "click",
        () => showScreen("homeScreen")
      );


    $("locationBtn")
      ?.addEventListener(
        "click",
        useMyLocation
      );


    /* Dates */

    $("datesContinue")
      ?.addEventListener(
        "click",
        saveDates
      );


    $("datesBack")
      ?.addEventListener(
        "click",
        () => {

          if (state.joinedRoom) {

            showScreen(
              "joinConfirmScreen"
            );

          } else {

            showScreen(
              "createScreen"
            );
          }
        }
      );


    /* Availability */

    $("availabilityContinue")
      ?.addEventListener(
        "click",
        saveAvailability
      );


    $("availabilityBack")
      ?.addEventListener(
        "click",
        () => showScreen("datesScreen")
      );


    /* Budget */

    document
      .querySelectorAll(
        ".budget-option"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () =>
              selectBudget(
                button.dataset.budget,
                button
              )
          );
        }
      );


    $("budgetContinue")
      ?.addEventListener(
        "click",
        finishBudget
      );


    $("budgetBack")
      ?.addEventListener(
        "click",
        () =>
          showScreen(
            "availabilityScreen"
          )
      );


    /* Activity */

    document
      .querySelectorAll(
        ".activity-card"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () =>
              selectActivity(
                button.dataset.activity,
                button
              )
          );
        }
      );


    $("activityContinue")
      ?.addEventListener(
        "click",
        finishActivity
      );


    $("activityBack")
      ?.addEventListener(
        "click",
        () =>
          showScreen(
            "budgetScreen"
          )
      );


    /* Created */

    $("copyCodeBtn")
      ?.addEventListener(
        "click",
        copyCode
      );


    $("viewRoamBtn")
      ?.addEventListener(
        "click",
        viewMyRoam
      );


    /* Join */

    $("joinFindBtn")
      ?.addEventListener(
        "click",
        findRoam
      );


    $("joinBack")
      ?.addEventListener(
        "click",
        () =>
          showScreen(
            "homeScreen"
          )
      );


    $("joinContinue")
      ?.addEventListener(
        "click",
        joinRoam
      );


    $("joinConfirmBack")
      ?.addEventListener(
        "click",
        () =>
          showScreen(
            "joinScreen"
          )
      );


    /* Places */

    $("placesContinue")
      ?.addEventListener(
        "click",
        showFinalPlan
      );


    /* Final */

    $("copyPlanBtn")
      ?.addEventListener(
        "click",
        copyPlan
      );


    $("newRoamBtn")
      ?.addEventListener(
        "click",
        () => {

          resetState();

          showScreen(
            "homeScreen"
          );
        }
      );


    /*
      Allow pressing Enter in the
      Join code field.
    */

    $("joinCode")
      ?.addEventListener(
        "keydown",
        (event) => {

          if (
            event.key === "Enter"
          ) {
            findRoam();
          }
        }
      );


    /*
      Allow pressing Enter in
      the name field.
    */

    $("joinName")
      ?.addEventListener(
        "keydown",
        (event) => {

          if (
            event.key === "Enter"
          ) {
            joinRoam();
          }
        }
      );


  }
);


/* =========================================================
   INITIALIZE
========================================================= */

console.log(
  "Roam loaded."
);

console.log(
  "Supabase connected:",
  Boolean(supabaseClient)
);

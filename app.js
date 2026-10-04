/* =========================================================
   ROAM — APP.JS
   Supabase + OpenStreetMap + Overpass
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://vvbgksamdlhkkchyhlyl.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_WaNsM-y0X9VH8pgnAQYFkg_2o68bx6S";


const db =
  window.supabase &&
  !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_")
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
      )
    : null;


/* =========================================================
   APP STATE
========================================================= */

const state = {

  mode: null,

  room: null,
  roomCode: null,

  organizerToken: null,

  participantId: null,
  participantToken: null,

  roamName: "",
  location: "",

  lat: null,
  lon: null,

  groupSize: 4,

  selectedDates: [],

  participantName: "",

  selectedTimes: [],

  budget: null,

  averageBudget: null,

  selectedTime: null,

  selectedPlace: null,

  places: []

};


/* =========================================================
   CONSTANTS
========================================================= */

const timeOptions = [
  "9:00 AM",
  "11:00 AM",
  "1:00 PM",
  "3:00 PM",
  "5:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM"
];


const $ = id =>
  document.getElementById(id);


/* =========================================================
   STARTUP
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    buildDates();

    buildTimes();

    loadSavedState();

    updateBudgetButton();

  }
);


/* =========================================================
   SCREEN NAVIGATION
========================================================= */

function showScreen(id) {

  document
    .querySelectorAll(".screen")
    .forEach(screen => {

      screen.classList.remove("active");

    });


  const target = $(id);

  if (!target) return;


  target.classList.add("active");


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================================================
   START ROAM
========================================================= */

function startRoam() {

  resetRoam();

  state.mode = "create";

  showScreen("create");


  setTimeout(() => {

    if ($("roamName")) {

      $("roamName").focus();

    }

  }, 100);

}


/* =========================================================
   RESET
========================================================= */

function resetRoam() {

  Object.assign(
    state,
    {

      mode: null,

      room: null,
      roomCode: null,

      organizerToken: null,

      participantId: null,
      participantToken: null,

      roamName: "",
      location: "",

      lat: null,
      lon: null,

      groupSize: 4,

      selectedDates: [],

      participantName: "",

      selectedTimes: [],

      budget: null,

      averageBudget: null,

      selectedTime: null,

      selectedPlace: null,

      places: []

    }
  );


  if ($("roamName"))
    $("roamName").value = "";


  if ($("location"))
    $("location").value = "";


  if ($("groupSize"))
    $("groupSize").value = 4;


  if ($("participantName"))
    $("participantName").value = "";


  if ($("locationStatus"))
    $("locationStatus").textContent =
      "Your location stays in your browser.";


  document
    .querySelectorAll(".budget-option")
    .forEach(button =>
      button.classList.remove("selected")
    );


  if ($("budgetContinue")) {

    $("budgetContinue").disabled = true;

  }


  buildDates();

  buildTimes();

}


/* =========================================================
   GROUP SIZE
========================================================= */

function changeGroupSize(amount) {

  const input = $("groupSize");

  if (!input) return;


  let value =
    Number(input.value) || 4;


  value =
    Math.max(
      2,
      Math.min(
        50,
        value + amount
      )
    );


  input.value = value;

  state.groupSize = value;


  localStorage.setItem(
    "roamGroupSize",
    value
  );

}


/* =========================================================
   CREATE ROOM
========================================================= */

async function saveRoamDetails() {

  const name =
    $("roamName")?.value.trim();


  const location =
    $("location")?.value.trim();


  const size =
    Math.max(
      2,
      Math.min(
        50,
        Number($("groupSize")?.value) || 4
      )
    );


  if (!name) {

    showToast(
      "Give your Roam a name."
    );

    return;

  }


  if (
    !location &&
    state.lat === null
  ) {

    showToast(
      "Add a location or use 📍."
    );

    return;

  }


  state.roamName = name;

  state.location =
    location || "My location";

  state.groupSize = size;


  localStorage.setItem(
    "roamGroupSize",
    size
  );


  /*
    Create the actual shared room.
  */

  if (db) {

    const room = await createRoom();


    if (!room) {

      return;

    }

  }


  buildDates();

  showScreen("dates");

}


/* =========================================================
   CREATE SUPABASE ROOM
========================================================= */

async function createRoom() {

  if (!db) {

    showToast(
      "Supabase isn't connected yet."
    );

    return null;

  }


  const code =
    makeRoomCode();


  const organizerToken =
    makeToken();


  const roomData = {

    code,

    name: state.roamName,

    location_text: state.location,

    lat: state.lat,

    lng: state.lon,

    group_size: state.groupSize,

    candidate_dates: [],

    activity: null,

    organizer_token: organizerToken

  };


  const {
    data,
    error
  } =
    await db
      .from("rooms")
      .insert(roomData)
      .select()
      .single();


  if (error) {

    console.error(
      "Create room error:",
      error
    );


    showToast(
      "Couldn't create your Roam."
    );

    return null;

  }


  state.room = data;

  state.roomCode = data.code;

  state.organizerToken =
    organizerToken;


  localStorage.setItem(
    "roamOrganizerToken",
    organizerToken
  );


  localStorage.setItem(
    "roamRoomCode",
    data.code
  );


  return data;

}


/* =========================================================
   ROOM CODE
========================================================= */

function makeRoomCode() {

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


  let code = "";


  for (
    let i = 0;
    i < 5;
    i++
  ) {

    code +=
      chars[
        Math.floor(
          Math.random() *
          chars.length
        )
      ];

  }


  return code;

}


/* =========================================================
   TOKEN
========================================================= */

function makeToken() {

  if (
    window.crypto &&
    crypto.randomUUID
  ) {

    return (
      crypto.randomUUID() +
      "-" +
      Date.now()
    );

  }


  return (
    Math.random()
      .toString(36)
      .slice(2) +
    Date.now()
  );

}


/* =========================================================
   DATES
========================================================= */

function buildDates() {

  const grid =
    $("dateGrid");


  if (!grid) return;


  grid.innerHTML = "";


  const today =
    new Date();


  for (
    let i = 0;
    i < 14;
    i++
  ) {

    const date =
      new Date(today);


    date.setHours(
      12,
      0,
      0,
      0
    );


    date.setDate(
      today.getDate() + i
    );


    const key =
      date
        .toISOString()
        .slice(0, 10);


    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.className =
      "date-card" +
      (
        state.selectedDates.includes(
          key
        )
          ? " selected"
          : ""
      );


    button.innerHTML = `

      <small>
        ${date
          .toLocaleDateString(
            undefined,
            {
              weekday: "short"
            }
          )
          .toUpperCase()}
      </small>

      <strong>
        ${date.getDate()}
      </strong>

    `;


    button.addEventListener(
      "click",
      () =>
        toggleDate(
          key,
          button
        )
    );


    grid.appendChild(
      button
    );

  }

}


/* =========================================================
   TOGGLE DATE
========================================================= */

function toggleDate(
  key,
  button
) {

  if (
    state.selectedDates
      .includes(key)
  ) {

    state.selectedDates =
      state.selectedDates.filter(
        date => date !== key
      );


    button.classList.remove(
      "selected"
    );

  } else {

    state.selectedDates.push(
      key
    );


    button.classList.add(
      "selected"
    );

  }

}


/* =========================================================
   SAVE DATES
========================================================= */

async function saveDates() {

  if (
    state.selectedDates.length === 0
  ) {

    showToast(
      "Pick at least one day."
    );

    return;

  }


  /*
    Save dates to the shared room.
  */

  if (
    db &&
    state.room
  ) {

    const {
      error
    } =
      await db
        .from("rooms")
        .update({

          candidate_dates:
            state.selectedDates

        })
        .eq(
          "id",
          state.room.id
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

  }


  buildTimes();

  showScreen(
    "availability"
  );

}


/* =========================================================
   TIME OPTIONS
========================================================= */

function buildTimes() {

  const grid =
    $("timeGrid");


  if (!grid) return;


  grid.innerHTML = "";


  timeOptions.forEach(
    time => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "time-option" +
        (
          state.selectedTimes
            .includes(time)
            ? " selected"
            : ""
        );


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
                t => t !== time
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


      grid.appendChild(
        button
      );

    }
  );

}


/* =========================================================
   AVAILABILITY
========================================================= */

async function saveAvailability() {

  const name =
    $("participantName")
      ?.value
      .trim();


  if (!name) {

    showToast(
      "Enter your name."
    );

    return;

  }


  if (
    state.selectedTimes.length === 0
  ) {

    showToast(
      "Choose at least one time."
    );

    return;

  }


  state.participantName =
    name;


  /*
    Save participant to Supabase.
  */

  if (
    db &&
    state.room
  ) {

    const participantToken =
      makeToken();


    const availability = {};


    state.selectedDates.forEach(
      date => {

        availability[date] =
          state.selectedTimes;

      }
    );


    const {
      data,
      error
    } =
      await db
        .from("participants")
        .insert({

          room_id:
            state.room.id,

          name,

          participant_token:
            participantToken,

          availability

        })
        .select()
        .single();


    if (error) {

      console.error(
        "Participant error:",
        error
      );


      showToast(
        "Couldn't save your availability."
      );

      return;

    }


    state.participantId =
      data.id;


    state.participantToken =
      participantToken;


    localStorage.setItem(
      "roamParticipantToken",
      participantToken
    );

  }


  showScreen(
    "budget"
  );

}


/* =========================================================
   BUDGET
========================================================= */

function selectBudget(
  button,
  value
) {

  /*
    Your current HTML passes:

      selectBudget(this, '0-20')

    so convert that range into
    an average number.
  */

  state.budget =
    budgetRangeAverage(
      value
    );


  document
    .querySelectorAll(
      ".budget-option"
    )
    .forEach(option => {

      option.classList.remove(
        "selected"
      );

    });


  if (button) {

    button.classList.add(
      "selected"
    );

  }


  updateBudgetButton();

}


/* =========================================================
   BUDGET RANGE
========================================================= */

function budgetRangeAverage(
  value
) {

  switch (String(value)) {

    case "0-20":
      return 10;

    case "20-40":
      return 30;

    case "40-60":
      return 50;

    case "60-100":
      return 80;

    case "100+":
      return 125;

    default:
      return Number(value) || 0;

  }

}


/* =========================================================
   BUDGET BUTTON
========================================================= */

function updateBudgetButton() {

  if (!$("budgetContinue"))
    return;


  $("budgetContinue")
    .disabled =
      !state.budget;

}


/* =========================================================
   FINISH BUDGET
========================================================= */

async function finishBudget() {

  if (!state.budget) {

    showToast(
      "Pick a budget first."
    );

    return;

  }


  /*
    Save participant budget.
  */

  if (
    db &&
    state.participantId
  ) {

    const {
      error
    } =
      await db
        .from("participants")
        .update({

          budget:
            state.budget

        })
        .eq(
          "id",
          state.participantId
        );


    if (error) {

      console.error(
        "Budget error:",
        error
      );


      showToast(
        "Couldn't save your budget."
      );

      return;

    }

  }


  await calculateAverageBudget();


  buildResults();


  showScreen(
    "results"
  );

}


/* =========================================================
   CALCULATE AVERAGE BUDGET
========================================================= */

async function calculateAverageBudget() {

  /*
    Use Supabase's database function.
  */

  if (
    db &&
    state.room
  ) {

    const {
      data,
      error
    } =
      await db.rpc(
        "get_room_average_budget",
        {
          room_uuid:
            state.room.id
        }
      );


    if (!error && data) {

      let average =
        null;


      if (
        Array.isArray(data)
      ) {

        average =
          data[0]
            ?.average_budget;

      } else {

        average =
          data.average_budget;

      }


      if (
        average !== null &&
        average !== undefined
      ) {

        state.averageBudget =
          Number(average);

      }

    }

  }


  /*
    Fallback if Supabase isn't
    connected.
  */

  if (
    state.averageBudget === null
  ) {

    state.averageBudget =
      state.budget;

  }


  if ($("averageBudget")) {

    $("averageBudget")
      .textContent =
        `$${Math.round(
          state.averageBudget
        )}`;

  }

}


/* =========================================================
   RESULTS
========================================================= */

function buildResults() {

  const list =
    $("resultsList");


  if (!list) return;


  list.innerHTML = "";


  const dates =
    state.selectedDates.length
      ? state.selectedDates
      : [
          new Date()
            .toISOString()
            .slice(0, 10)
        ];


  const times =
    state.selectedTimes.length
      ? state.selectedTimes
      : ["7:00 PM"];


  /*
    Find the three best combinations.

    With the current simple interface,
    we use the first three possible
    combinations.
  */

  const results = [];


  for (
    let i = 0;
    i < Math.min(3, dates.length * times.length);
    i++
  ) {

    const date =
      dates[
        Math.floor(
          i / times.length
        ) % dates.length
      ];


    const time =
      times[
        i % times.length
      ];


    results.push({
      date,
      time
    });

  }


  if (!results.length) {

    list.innerHTML =
      `
        <div class="empty-state">
          No times found yet.
        </div>
      `;


    return;

  }


  results.forEach(
    (result, index) => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "result-card";


      const dateLabel =
        formatDate(
          result.date
        );


      card.innerHTML = `

        <div>

          <strong>
            ${escapeHtml(
              dateLabel
            )}
            ·
            ${escapeHtml(
              result.time
            )}
          </strong>

          <span>
            ${state.groupSize}
            people ·
            ${index === 0
              ? "Best match"
              : "Good match"}
          </span>

        </div>

        <button
          class="primary-button"
          type="button"
        >
          Pick this time →
        </button>

      `;


      card
        .querySelector("button")
        .addEventListener(
          "click",
          () =>
            chooseTime(
              result.time,
              dateLabel
            )
        );


      list.appendChild(
        card
      );

    }
  );

}


/* =========================================================
   CHOOSE TIME
========================================================= */

async function chooseTime(
  time,
  dateLabel
) {

  state.selectedTime = {

    time,

    dateLabel

  };


  if ($("placesSubtitle")) {

    $("placesSubtitle")
      .textContent =
        state.location
          ? `Spots near ${state.location}.`
          : "Spots near you.";

  }


  showScreen(
    "places"
  );


  await loadNearbyPlaces();

}


/* =========================================================
   NEARBY PLACES
========================================================= */

async function loadNearbyPlaces() {

  const list =
    $("placesList");


  if (!list) return;


  list.innerHTML =
    `
      <div class="empty-state">
        Finding nearby places…
      </div>
    `;


  /*
    If we already have GPS coordinates,
    use them.
  */

  if (
    state.lat !== null &&
    state.lon !== null
  ) {

    const places =
      await fetchOverpassPlaces(
        state.lat,
        state.lon
      );


    state.places =
      places;


    renderPlaces(
      places
    );


    return;

  }


  /*
    Otherwise geocode the typed location.
  */

  if (state.location) {

    try {

      const url =
        `https://nominatim.openstreetmap.org/search?` +
        `format=jsonv2&limit=1&q=` +
        encodeURIComponent(
          state.location
        );


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


      const data =
        await response.json();


      if (data[0]) {

        state.lat =
          Number(
            data[0].lat
          );


        state.lon =
          Number(
            data[0].lon
          );


        const places =
          await fetchOverpassPlaces(
            state.lat,
            state.lon
          );


        state.places =
          places;


        renderPlaces(
          places
        );


        return;

      }

    } catch (error) {

      console.warn(
        "Geocoding failed:",
        error
      );

    }

  }


  renderPlaces(
    fallbackPlaces()
  );

}


/* =========================================================
   OVERPASS
========================================================= */

async function fetchOverpassPlaces(
  lat,
  lon
) {

  /*
    Pull a broad set of activities.

    No Google API.
    No Google billing.
  */

  const query = `

    [out:json][timeout:20];

    (

      nwr[
        "amenity"~"restaurant|cafe|bar|fast_food|cinema|theatre|arts_centre|library"
      ](
        around:5000,
        ${lat},
        ${lon}
      );

      nwr[
        "tourism"~"attraction|museum|gallery"
      ](
        around:5000,
        ${lat},
        ${lon}
      );

      nwr[
        "leisure"~"park|bowling_alley|sports_centre|playground"
      ](
        around:5000,
        ${lat},
        ${lon}
      );

      nwr[
        "shop"~"mall|department_store"
      ](
        around:5000,
        ${lat},
        ${lon}
      );

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
              "text/plain;charset=UTF-8"
          },

          body: query
        }
      );


    if (!response.ok) {

      throw new Error(
        "Overpass request failed."
      );

    }


    const data =
      await response.json();


    const items =
      data.elements
        .map(item => {

          const tags =
            item.tags || {};


          return {

            name:
              tags.name ||
              "Unnamed place",

            type:
              prettyType(
                tags.amenity ||
                tags.tourism ||
                tags.leisure ||
                tags.shop ||
                "place"
              ),

            address:
              [
                tags["addr:housenumber"],
                tags["addr:street"]
              ]
                .filter(Boolean)
                .join(" "),

            lat:
              item.lat ??
              item.center?.lat,

            lon:
              item.lon ??
              item.center?.lon

          };

        })

        .filter(
          place =>
            place.name !==
            "Unnamed place"
        )

        .filter(
          (place, index, array) =>
            array.findIndex(
              item =>
                item.name ===
                place.name
            ) === index
        )

        .slice(0, 12);


    return items.length
      ? items
      : fallbackPlaces();


  } catch (error) {

    console.warn(
      "Nearby places unavailable:",
      error
    );


    return fallbackPlaces();

  }

}


/* =========================================================
   RENDER PLACES
========================================================= */

function renderPlaces(
  places
) {

  const list =
    $("placesList");


  if (!list) return;


  list.innerHTML = "";


  if (!places.length) {

    list.innerHTML =
      `
        <div class="empty-state">
          No nearby places found.
          Try another location.
        </div>
      `;


    return;

  }


  places.forEach(
    place => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "place-card";


      card.innerHTML = `

        <div class="place-card-top">

          ${placeIcon(
            place.type
          )}

        </div>


        <div class="place-card-body">

          <h3>
            ${escapeHtml(
              place.name
            )}
          </h3>

          <p>
            ${escapeHtml(
              place.type
            )}

            ${
              place.address
                ? ` · ${escapeHtml(
                    place.address
                  )}`
                : ""
            }

          </p>

        </div>


        <button
          class="primary-button"
          type="button"
        >
          Choose place
        </button>

      `;


      card
        .querySelector("button")
        .addEventListener(
          "click",
          () =>
            choosePlace(
              place
            )
        );


      list.appendChild(
        card
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

  const plan =
    $("finalPlan");


  if (!plan) return;


  const place =
    state.selectedPlace;


  plan.innerHTML = `

    <div class="plan-row">

      <small>
        Hangout
      </small>

      <strong>
        ${escapeHtml(
          state.roamName
        )}
      </strong>

    </div>


    <div class="plan-row">

      <small>
        When
      </small>

      <strong>
        ${escapeHtml(
          state.selectedTime
            ?.dateLabel ||
          "TBD"
        )}

        ·

        ${escapeHtml(
          state.selectedTime
            ?.time ||
          "TBD"
        )}

      </strong>

    </div>


    <div class="plan-row">

      <small>
        Where
      </small>

      <strong>
        ${escapeHtml(
          place?.name ||
          state.location
        )}
      </strong>

    </div>


    <div class="plan-row">

      <small>
        Group
      </small>

      <strong>
        ${state.groupSize}
        people · Around
        $${Math.round(
          state.averageBudget ||
          state.budget ||
          0
        )}
        per person
      </strong>

    </div>

  `;

}


/* =========================================================
   PLAN TEXT
========================================================= */

function makePlanText() {

  const place =
    state.selectedPlace;


  return `

${state.roamName}

${state.selectedTime?.dateLabel || "Date TBD"} · ${state.selectedTime?.time || "Time TBD"}

${place?.name || state.location}

${state.groupSize} people · Around $${Math.round(
    state.averageBudget ||
    state.budget ||
    0
  )} per person

Made with Roam.

  `.trim();

}


/* =========================================================
   COPY PLAN
========================================================= */

async function copyPlan() {

  try {

    await navigator.clipboard
      .writeText(
        makePlanText()
      );


    showToast(
      "Plan copied!"
    );


  } catch {

    showToast(
      "Copy isn't available here."
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
          "My Roam",

        text

      });

    } catch (error) {

      if (
        error.name !==
        "AbortError"
      ) {

        showToast(
          "Sharing was cancelled."
        );

      }

    }

  } else {

    await copyPlan();

    showToast(
      "Plan copied — ready to share."
    );

  }

}


/* =========================================================
   GET USER LOCATION
========================================================= */

function getUserLocation() {

  if (
    !navigator.geolocation
  ) {

    showToast(
      "Location isn't supported by this browser."
    );

    return;

  }


  if ($("locationStatus")) {

    $("locationStatus")
      .textContent =
        "Finding your location…";

  }


  navigator.geolocation
    .getCurrentPosition(

      async position => {

        state.lat =
          position.coords.latitude;


        state.lon =
          position.coords.longitude;


        try {

          const url =
            `https://nominatim.openstreetmap.org/reverse?` +
            `format=jsonv2&lat=${state.lat}&lon=${state.lon}`;


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


          const data =
            await response.json();


          const address =
            data.address || {};


          const label =
            address.city ||
            address.town ||
            address.village ||
            address.suburb ||
            address.county ||
            "Current location";


          state.location =
            label;


          if ($("location")) {

            $("location")
              .value =
                label;

          }


          if ($("locationStatus")) {

            $("locationStatus")
              .textContent =
                "Location found ✓";

          }


        } catch {

          state.location =
            "My current location";


          if ($("location")) {

            $("location")
              .value =
                state.location;

          }


          if ($("locationStatus")) {

            $("locationStatus")
              .textContent =
                "Location found ✓";

          }

        }

      },


      error => {

        if ($("locationStatus")) {

          $("locationStatus")
            .textContent =
              "Location unavailable. You can type a city instead.";

        }


        showToast(
          "Couldn't access your location."
        );


        console.warn(
          error
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
   JOIN A ROAM
========================================================= */

async function joinRoam() {

  const codeInput =
    prompt(
      "Enter the 5-character Roam code:"
    );


  if (!codeInput) return;


  const code =
    codeInput
      .trim()
      .toUpperCase();


  if (
    code.length !== 5
  ) {

    showToast(
      "Roam codes are 5 characters."
    );

    return;

  }


  if (!db) {

    showToast(
      "Supabase isn't connected yet."
    );

    return;

  }


  const {
    data,
    error
  } =
    await db
      .from("rooms")
      .select("*")
      .eq(
        "code",
        code
      )
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
      "Roam not found."
    );

    return;

  }


  state.mode =
    "join";


  state.room =
    data;


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


  buildTimes();


  showScreen(
    "availability"
  );


  showToast(
    `Joined ${data.name}!`
  );

}


/* =========================================================
   JOIN BUTTON ALIAS
========================================================= */

function openJoin() {

  joinRoam();

}


/* =========================================================
   FALLBACK PLACES
========================================================= */

function fallbackPlaces() {

  return [

    {
      name:
        "Nearby restaurants",

      type:
        "Restaurant",

      address:
        "",

      lat:
        null,

      lon:
        null
    },


    {
      name:
        "Nearby cafes",

      type:
        "Cafe",

      address:
        "",

      lat:
        null,

      lon:
        null
    },


    {
      name:
        "Nearby parks",

      type:
        "Park",

      address:
        "",

      lat:
        null,

      lon:
        null
    }

  ];

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
  key
) {

  return new Date(
    `${key}T12:00:00`
  ).toLocaleDateString(
    undefined,
    {
      weekday:
        "short",

      month:
        "short",

      day:
        "numeric"
    }
  );

}


/* =========================================================
   PLACE TYPE
========================================================= */

function prettyType(
  type
) {

  return String(type)
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      letter =>
        letter.toUpperCase()
    );

}


/* =========================================================
   PLACE ICON
========================================================= */

function placeIcon(
  type
) {

  const value =
    String(type)
      .toLowerCase();


  if (
    value.includes(
      "restaurant"
    )
  )
    return "🍽️";


  if (
    value.includes(
      "cafe"
    )
  )
    return "☕";


  if (
    value.includes(
      "bar"
    )
  )
    return "🍸";


  if (
    value.includes(
      "cinema"
    )
  )
    return "🎬";


  if (
    value.includes(
      "museum"
    )
  )
    return "🏛️";


  if (
    value.includes(
      "park"
    )
  )
    return "🌳";


  if (
    value.includes(
      "theatre"
    )
  )
    return "🎭";


  if (
    value.includes(
      "bowling"
    )
  )
    return "🎳";


  if (
    value.includes(
      "gallery"
    )
  )
    return "🎨";


  if (
    value.includes(
      "shopping"
    ) ||
    value.includes(
      "mall"
    )
  )
    return "🛍️";


  return "✦";

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message
) {

  const toast =
    $("toast");


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
    showToast.timer
  );


  showToast.timer =
    setTimeout(
      () =>
        toast.classList.remove(
          "show"
        ),
      2500
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
   LOAD SAVED STATE
========================================================= */

function loadSavedState() {

  const saved =
    localStorage.getItem(
      "roamGroupSize"
    );


  if (saved) {

    const size =
      Math.max(
        2,
        Math.min(
          50,
          Number(saved) || 4
        )
      );


    state.groupSize =
      size;


    if ($("groupSize")) {

      $("groupSize")
        .value =
          size;

    }

  }


  if ($("groupSize")) {

    $("groupSize")
      .addEventListener(
        "change",
        () => {

          state.groupSize =
            Math.max(
              2,
              Math.min(
                50,
                Number(
                  $("groupSize")
                    .value
                ) || 4
              )
            );


          $("groupSize")
            .value =
              state.groupSize;


          localStorage.setItem(
            "roamGroupSize",
            state.groupSize
          );

        }
      );

  }

}


/* =========================================================
   EXPORT GLOBAL FUNCTIONS
   =========================================================

   These make sure the onclick=""
   buttons inside index.html can
   access the functions.
========================================================= */

window.startRoam =
  startRoam;

window.saveRoamDetails =
  saveRoamDetails;

window.changeGroupSize =
  changeGroupSize;

window.saveDates =
  saveDates;

window.saveAvailability =
  saveAvailability;

window.selectBudget =
  selectBudget;

window.finishBudget =
  finishBudget;

window.copyPlan =
  copyPlan;

window.sharePlan =
  sharePlan;

window.getUserLocation =
  getUserLocation;

window.joinRoam =
  joinRoam;

window.openJoin =
  openJoin;

window.showScreen =
  showScreen;

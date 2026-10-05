/* =========================================================
   ROAM
   Main app functionality
========================================================= */


/* =========================================================
   STATE
========================================================= */

const state = {
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

  activity: null,

  selectedPlace: null,

  places: []
};


/* =========================================================
   TIME OPTIONS
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


/* =========================================================
   ACTIVITY DATA
========================================================= */

const activityData = {

  food: {
    label: "Food",
    search: "restaurant"
  },

  coffee: {
    label: "Coffee",
    search: "cafe"
  },

  movies: {
    label: "Movies",
    search: "cinema"
  },

  bowling: {
    label: "Bowling",
    search: "bowling_alley"
  },

  outdoors: {
    label: "Outdoors",
    search: "park"
  },

  arts: {
    label: "Arts",
    search: "museum"
  },

  games: {
    label: "Games",
    search: "games"
  },

  other: {
    label: "Something else",
    search: "place"
  }

};


/* =========================================================
   HELPER
========================================================= */

const $ = id => document.getElementById(id);


/* =========================================================
   STARTUP
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  buildDates();

  buildTimes();

  loadSavedState();

  setupJoinCode();

});


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

  if (!target) {
    console.warn(`Screen "${id}" was not found.`);
    return;
  }

  target.classList.add("active");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  updateProgress(id);
}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress(screen) {

  const progress = $("progress");

  if (!progress) return;

  const steps = {
    create: 14,
    dates: 28,
    availability: 42,
    budget: 56,
    activity: 70,
    results: 82,
    places: 92,
    final: 100
  };

  progress.style.width =
    `${steps[screen] || 0}%`;
}


/* =========================================================
   HOME
========================================================= */

function goHome() {

  showScreen("home");

}


function openJoin() {

  showScreen("join");

  setTimeout(() => {

    const input = $("joinCode");

    if (input) {
      input.focus();
    }

  }, 100);

}


/* =========================================================
   START ROAM
========================================================= */

function startRoam() {

  resetRoam();

  showScreen("create");

  setTimeout(() => {

    const input = $("roamName");

    if (input) {
      input.focus();
    }

  }, 100);

}


/* =========================================================
   RESET
========================================================= */

function resetRoam() {

  Object.assign(state, {

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

    activity: null,

    selectedPlace: null,

    places: []

  });


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

  if ($("locationStatus")) {
    $("locationStatus").textContent =
      "Your location stays in your browser.";
  }


  document
    .querySelectorAll(".budget-option")
    .forEach(button => {
      button.classList.remove("selected");
    });


  document
    .querySelectorAll(".activity-card")
    .forEach(card => {
      card.classList.remove("selected");
    });


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

  value = Math.max(
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
   CREATE ROAM
========================================================= */

function saveRoamDetails() {

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


  buildDates();

  showScreen("dates");

}


/* =========================================================
   DATES
========================================================= */

function buildDates() {

  const grid = $("dateGrid");

  if (!grid) return;

  grid.innerHTML = "";


  const today = new Date();


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
      date.toISOString()
        .slice(0, 10);


    const button =
      document.createElement("button");


    button.type = "button";

    button.className =
      "date-card" +
      (
        state.selectedDates.includes(key)
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
      () => toggleDate(
        key,
        button
      )
    );


    grid.appendChild(button);

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
      state.selectedDates
        .filter(
          date => date !== key
        );

    button.classList
      .remove("selected");

  } else {

    state.selectedDates.push(
      key
    );

    button.classList
      .add("selected");

  }

}


/* =========================================================
   SAVE DATES
========================================================= */

function saveDates() {

  if (
    !state.selectedDates.length
  ) {

    showToast(
      "Pick at least one day."
    );

    return;
  }


  buildTimes();

  showScreen(
    "availability"
  );

}


/* =========================================================
   TIMES
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


      button.type = "button";

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
              state.selectedTimes
                .filter(
                  selected =>
                    selected !== time
                );

            button.classList
              .remove("selected");

          } else {

            state.selectedTimes
              .push(time);

            button.classList
              .add("selected");

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

  const name =
    $("participantName")
      ?.value.trim();


  if (!name) {

    showToast(
      "Enter your name."
    );

    return;
  }


  if (
    !state.selectedTimes.length
  ) {

    showToast(
      "Choose at least one time."
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

function selectBudget(value) {

  const amount =
    Number(value);


  state.budget =
    amount;


  document
    .querySelectorAll(
      ".budget-option"
    )
    .forEach(button => {

      button.classList.toggle(
        "selected",
        Number(
          button.dataset.budget
        ) === amount
      );

    });


  if ($("budgetContinue")) {
    $("budgetContinue")
      .disabled = false;
  }

}


/* =========================================================
   SAVE BUDGET
========================================================= */

function saveBudget() {

  if (!state.budget) {

    showToast(
      "Choose a budget first."
    );

    return;
  }


  state.averageBudget =
    state.budget;


  if ($("averageBudget")) {

    $("averageBudget")
      .textContent =
      `$${Math.round(
        state.averageBudget
      )}`;

  }


  buildResults();

  showScreen("activity");

}


/* =========================================================
   OLD CALLBACK SUPPORT
========================================================= */

function finishBudget() {

  saveBudget();

}


/* =========================================================
   ACTIVITY
========================================================= */

function selectActivity(
  element,
  activity
) {

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

  setTimeout(() => {

    showScreen(
      "results"
    );

  }, 180);

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
    state.selectedDates
      .map(formatDate);


  const times =
    state.selectedTimes
      .slice(0, 3);


  if (!times.length) {

    list.innerHTML = `

      <div class="empty-state">
        No times selected yet.
      </div>

    `;

    return;
  }


  times.forEach(
    (time, index) => {

      const date =
        dates[
          index % dates.length
        ];


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "result-card";


      card.innerHTML = `

        <div>

          <strong>
            ${escapeHtml(date)}
            ·
            ${escapeHtml(time)}
          </strong>

          <span>
            ${state.groupSize}
            people
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
          () => chooseTime(
            time,
            date
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
      "Pick a place nearby.";

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


  list.innerHTML = `

    <div class="empty-state">
      Finding nearby places…
    </div>

  `;


  /*
    If we already have GPS coordinates,
    use them immediately.
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
      filterPlacesForActivity(
        places
      );


    renderPlaces(
      state.places
    );


    return;
  }


  /*
    Otherwise turn the typed
    location into coordinates.
  */

  if (state.location) {

    try {

      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?format=jsonv2` +
        `&limit=1` +
        `&q=${encodeURIComponent(
          state.location
        )}`;


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
          Number(data[0].lat);

        state.lon =
          Number(data[0].lon);


        const places =
          await fetchOverpassPlaces(
            state.lat,
            state.lon
          );


        state.places =
          filterPlacesForActivity(
            places
          );


        renderPlaces(
          state.places
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
   ACTIVITY FILTER
========================================================= */

function filterPlacesForActivity(
  places
) {

  if (
    !state.activity ||
    state.activity === "other"
  ) {

    return places;

  }


  const activity =
    state.activity;


  const keywords = {

    food: [
      "restaurant",
      "fast food"
    ],

    coffee: [
      "cafe",
      "coffee"
    ],

    movies: [
      "cinema"
    ],

    bowling: [
      "bowling"
    ],

    outdoors: [
      "park",
      "garden"
    ],

    arts: [
      "museum",
      "theatre",
      "gallery"
    ],

    games: [
      "game",
      "bowling"
    ]

  };


  const wanted =
    keywords[activity] || [];


  const matching =
    places.filter(
      place => {

        const value =
          `${place.name} ${place.type}`
            .toLowerCase();

        return wanted.some(
          word =>
            value.includes(word)
        );

      }
    );


  /*
    If OSM doesn't have enough
    activity-specific places,
    show the nearby places rather
    than showing nothing.
  */

  return matching.length >= 3
    ? matching
    : places;

}


/* =========================================================
   OVERPASS
========================================================= */

async function fetchOverpassPlaces(
  lat,
  lon
) {

  /*
    Search for several useful
    categories around the user.
  */

  const query = `

    [out:json][timeout:20];

    (

      nwr[
        "amenity"="restaurant"
      ](
        around:5000,
        ${lat},
        ${lon}
      );

      nwr[
        "amenity"="cafe"
      ](
        around:5000,
        ${lat},
        ${lon}
      );

      nwr[
        "amenity"="bar"
      ](
        around:5000,
        ${lat},
        ${lon}
      );

      nwr[
        "amenity"="fast_food"
      ](
        around:5000,
        ${lat},
        ${lon}
      );

      nwr[
        "amenity"="cinema"
      ](
        around:5000,
        ${lat},
        ${lon}
      );

      nwr[
        "amenity"="theatre"
      ](
        around:5000,
        ${lat},
        ${lon}
      );

      nwr[
        "tourism"="museum"
      ](
        around:5000,
        ${lat},
        ${lon}
      );

      nwr[
        "leisure"="park"
      ](
        around:5000,
        ${lat},
        ${lon}
      );

      nwr[
        "leisure"="bowling_alley"
      ](
        around:5000,
        ${lat},
        ${lon}
      );

    );

    out center tags;

  `;


  const endpoints = [

    "https://overpass-api.de/api/interpreter",

    "https://overpass.kumi.systems/api/interpreter"

  ];


  for (
    const endpoint of endpoints
  ) {

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

            body: query
          }
        );


      if (!response.ok) {

        throw new Error(
          `Overpass returned ${response.status}`
        );

      }


      const data =
        await response.json();


      return cleanPlaces(
        data.elements || [],
        lat,
        lon
      );


    } catch (error) {

      console.warn(
        `Place search failed on ${endpoint}`,
        error
      );

    }

  }


  return fallbackPlaces();

}


/* =========================================================
   CLEAN PLACES
========================================================= */

function cleanPlaces(
  elements,
  userLat,
  userLon
) {

  const seen =
    new Set();

  const places =
    [];


  elements.forEach(
    element => {

      const tags =
        element.tags || {};


      const name =
        tags.name ||
        tags.brand ||
        tags.operator;


      if (!name) {
        return;
      }


      const key =
        name
          .toLowerCase()
          .trim();


      if (seen.has(key)) {
        return;
      }


      seen.add(key);


      const lat =
        element.lat ??
        element.center?.lat;


      const lon =
        element.lon ??
        element.center?.lon;


      const distance =
        lat != null &&
        lon != null
          ? calculateDistance(
              userLat,
              userLon,
              lat,
              lon
            )
          : null;


      const type =
        tags.amenity ||
        tags.leisure ||
        tags.tourism ||
        "place";


      places.push({

        name,

        type:
          prettyType(type),

        address:
          [
            tags["addr:housenumber"],
            tags["addr:street"]
          ]
            .filter(Boolean)
            .join(" "),

        distance,

        lat,

        lon,

        website:
          tags.website ||
          tags["contact:website"] ||
          null

      });

    }
  );


  places.sort(
    (a, b) => {

      if (
        a.distance === null
      ) {
        return 1;
      }

      if (
        b.distance === null
      ) {
        return -1;
      }

      return (
        a.distance -
        b.distance
      );

    }
  );


  return places.slice(
    0,
    9
  );

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

    list.innerHTML = `

      <div class="empty-state">

        No nearby places found.

        <br>

        Try another location.

      </div>

    `;

    return;
  }


  places.forEach(
    (place, index) => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "place-card";


      /*
        IMPORTANT:
        The place itself is stored in
        the button's click handler.
      */

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
              place.distance !== null
                ? ` · ${formatDistance(
                    place.distance
                  )}`
                : ""
            }

          </p>

        </div>


        <button
          class="primary-button"
          type="button"
          data-place-index="${index}"
        >
          Choose this place
        </button>

      `;


      const button =
        card.querySelector(
          "button"
        );


      /*
        Explicitly use the exact
        place object from the array.
      */

      button.addEventListener(
        "click",
        event => {

          event.preventDefault();

          event.stopPropagation();

          choosePlace(
            places[index]
          );

        }
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

  if (!place) {

    showToast(
      "Choose a place first."
    );

    return;
  }


  /*
    THIS is the important part.

    The selected place is saved
    separately from the starting
    location.
  */

  state.selectedPlace = {
    name: place.name,
    type: place.type,
    lat: place.lat,
    lon: place.lon,
    website: place.website || null
  };


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


  const placeName =
    place?.name ||
    "No place selected";


  const when =
    state.selectedTime
      ? `${state.selectedTime.dateLabel} · ${state.selectedTime.time}`
      : "Time TBD";


  const activity =
    activityData[
      state.activity
    ]?.label ||
    "Hangout";


  const budget =
    Math.round(
      state.averageBudget ||
      state.budget ||
      0
    );


  plan.innerHTML = `

    <div class="plan-row">

      <small>
        Roam
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
          when
        )}
      </strong>

    </div>


    <div class="plan-row">

      <small>
        Activity
      </small>

      <strong>
        ${escapeHtml(
          activity
        )}
      </strong>

    </div>


    <div class="plan-row">

      <small>
        Place
      </small>

      <strong>
        ${escapeHtml(
          placeName
        )}
      </strong>

    </div>


    <div class="plan-row">

      <small>
        Group
      </small>

      <strong>
        ${state.groupSize}
        people
        ·
        Around $${budget} each
      </strong>

    </div>

  `;

}


/* =========================================================
   COPY PLAN
========================================================= */

function makePlanText() {

  const place =
    state.selectedPlace;


  const placeName =
    place?.name ||
    "No place selected";


  const date =
    state.selectedTime
      ?.dateLabel ||
    "Date TBD";


  const time =
    state.selectedTime
      ?.time ||
    "Time TBD";


  const activity =
    activityData[
      state.activity
    ]?.label ||
    "Hangout";


  const budget =
    Math.round(
      state.averageBudget ||
      state.budget ||
      0
    );


  return `${state.roamName}
${date} · ${time}
${activity} at ${placeName}
${state.groupSize} people · Around $${budget} each.

Made with Roam.`;

}


/* =========================================================
   COPY
========================================================= */

async function copyPlan() {

  const text =
    makePlanText();


  try {

    await navigator.clipboard
      .writeText(text);


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
   SHARE
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
          "Sharing didn't work."
        );

      }

    }

    return;
  }


  await copyPlan();

}


/* =========================================================
   LOCATION
========================================================= */

function getUserLocation() {

  if (
    !navigator.geolocation
  ) {

    showToast(
      "Location isn't supported."
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
            `https://nominatim.openstreetmap.org/reverse` +
            `?format=jsonv2` +
            `&lat=${state.lat}` +
            `&lon=${state.lon}`;


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


          if ($("location")) {

            $("location").value =
              label;

          }


          state.location =
            label;


          if ($("locationStatus")) {

            $("locationStatus")
              .textContent =
              "Location found ✓";

          }


        } catch {

          state.location =
            "My current location";


          if ($("location")) {

            $("location").value =
              "My current location";

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
            "Location unavailable. You can type a city.";

        }


        showToast(
          "Couldn't access your location."
        );


        console.warn(
          error
        );

      },


      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }

    );

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
  key
) {

  return new Date(
    `${key}T12:00:00`
  ).toLocaleDateString(
    undefined,
    {
      weekday: "short",
      month: "short",
      day: "numeric"
    }
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

  const R =
    3958.8;


  const dLat =
    toRadians(
      lat2 - lat1
    );


  const dLon =
    toRadians(
      lon2 - lon1
    );


  const a =
    Math.sin(
      dLat / 2
    ) ** 2 +

    Math.cos(
      toRadians(lat1)
    ) *

    Math.cos(
      toRadians(lat2)
    ) *

    Math.sin(
      dLon / 2
    ) ** 2;


  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );


  return R * c;

}


function toRadians(
  degrees
) {

  return (
    degrees *
    Math.PI /
    180
  );

}


function formatDistance(
  miles
) {

  if (
    miles < 0.1
  ) {

    return "<0.1 mi";

  }


  return `${miles.toFixed(1)} mi`;

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
  ) {

    return "🍽️";

  }


  if (
    value.includes(
      "cafe"
    )
  ) {

    return "☕";

  }


  if (
    value.includes(
      "bar"
    )
  ) {

    return "🍸";

  }


  if (
    value.includes(
      "cinema"
    )
  ) {

    return "🎬";

  }


  if (
    value.includes(
      "museum"
    )
  ) {

    return "🏛️";

  }


  if (
    value.includes(
      "park"
    )
  ) {

    return "🌳";

  }


  if (
    value.includes(
      "bowling"
    )
  ) {

    return "🎳";

  }


  if (
    value.includes(
      "theatre"
    )
  ) {

    return "🎭";

  }


  return "✦";

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
        null,

      website:
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
        null,

      website:
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
        null,

      website:
        null
    }

  ];

}


/* =========================================================
   JOIN CODE
========================================================= */

function setupJoinCode() {

  const input =
    $("joinCode");

  if (!input) return;


  input.addEventListener(
    "input",
    () => {

      input.value =
        input.value
          .toUpperCase()
          .replace(
            /[^A-Z]/g,
            ""
          );

    }
  );

}


/* =========================================================
   JOIN
========================================================= */

function joinRoam() {

  const input =
    $("joinCode");


  if (!input) return;


  const code =
    input.value
      .trim()
      .toUpperCase();


  if (!code) {

    showToast(
      "Enter your Roam code."
    );

    return;
  }


  /*
    For now, this keeps the join
    flow simple. The database
    connection can be added without
    changing the place system.
  */

  showToast(
    `Looking for ${code}…`
  );

}


/* =========================================================
   PARTICIPANT FLOW
========================================================= */

function startParticipantFlow() {

  showScreen(
    "availability"
  );

}


/* =========================================================
   START OVER
========================================================= */

function startOver() {

  resetRoam();

  showScreen(
    "home"
  );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message
) {

  const toast =
    $("toast");

  if (!toast) return;


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
      () => {

        toast.classList
          .remove("show");

      },
      2500
    );

}


/* =========================================================
   HTML SAFETY
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
   SAVED STATE
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

      $("groupSize").value =
        size;

    }

  }


  const groupInput =
    $("groupSize");


  if (groupInput) {

    groupInput.addEventListener(
      "change",
      () => {

        state.groupSize =
          Math.max(
            2,
            Math.min(
              50,
              Number(
                groupInput.value
              ) || 4
            )
          );


        groupInput.value =
          state.groupSize;


        localStorage.setItem(
          "roamGroupSize",
          state.groupSize
        );

      }
    );

  }

}

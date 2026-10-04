/* =========================================================
   ROAM
   Main application logic
========================================================= */


/* =========================================================
   STATE
========================================================= */

const state = {

  roamName: "",

  location: "",

  latitude: null,

  longitude: null,

  groupSize: Number(
    localStorage.getItem("roamGroupSize") || 4
  ),

  selectedDates: [],

  selectedTimes: [],

  participantName: "",

  budget: null,

  activity: "",

  selectedTime: null,

  selectedPlace: null

};


/* =========================================================
   CONFIGURATION
========================================================= */

const timeOptions = [
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


const activityData = {

  eat: {
    label: "Eat",
    searchTerms: [
      "restaurant",
      "cafe",
      "bar",
      "food"
    ]
  },

  movies: {
    label: "Movies",
    searchTerms: [
      "cinema",
      "theatre",
      "theater"
    ]
  },

  bowling: {
    label: "Bowling",
    searchTerms: [
      "bowling"
    ]
  },

  coffee: {
    label: "Coffee",
    searchTerms: [
      "cafe",
      "coffee_shop"
    ]
  },

  outdoors: {
    label: "Outdoors",
    searchTerms: [
      "park",
      "garden",
      "nature_reserve",
      "pitch",
      "sports_centre"
    ]
  },

  arts: {
    label: "Arts",
    searchTerms: [
      "museum",
      "gallery",
      "arts_centre"
    ]
  },

  games: {
    label: "Games",
    searchTerms: [
      "amusement_arcade",
      "bowling",
      "leisure_centre",
      "sports_centre"
    ]
  },

  other: {
    label: "Something else",
    searchTerms: [
      "attraction",
      "leisure",
      "community_centre"
    ]
  }

};


/* =========================================================
   SCREEN NAVIGATION
========================================================= */

const screenOrder = [
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


function showScreen(id) {

  document
    .querySelectorAll(".screen")
    .forEach(screen => {
      screen.classList.remove("active");
    });

  const screen = document.getElementById(id);

  if (!screen) {
    return;
  }

  screen.classList.add("active");

  updateProgress(id);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function updateProgress(id) {

  const progress = document.getElementById("progressText");

  if (!progress) {
    return;
  }

  const labels = {

    home: "HOME",

    details: "01 / PLAN",

    dates: "02 / TIME",

    availability: "03 / TIME",

    budget: "04 / BUDGET",

    activity: "05 / VIBE",

    results: "06 / MATCH",

    places: "PLACES",

    final: "DONE"

  };

  progress.textContent = labels[id] || "ROAM";
}


/* =========================================================
   START / RESET
========================================================= */

function startRoam() {

  state.roamName = "";
  state.location = "";
  state.latitude = null;
  state.longitude = null;

  state.selectedDates = [];
  state.selectedTimes = [];

  state.participantName = "";

  state.budget = null;
  state.activity = "";

  state.selectedTime = null;
  state.selectedPlace = null;

  document.getElementById("roamName").value = "";

  document.getElementById("location").value = "";

  document.getElementById("participantName").value = "";

  document.getElementById("groupSizeDisplay").textContent =
    state.groupSize;

  document
    .querySelectorAll(".budget-card")
    .forEach(card => {
      card.classList.remove("selected");
    });

  document.getElementById("budgetContinue").disabled = true;

  renderDates();

  showScreen("details");
}


/* =========================================================
   GROUP SIZE
========================================================= */

function changeGroupSize(amount) {

  state.groupSize += amount;

  if (state.groupSize < 2) {
    state.groupSize = 2;
  }

  if (state.groupSize > 50) {
    state.groupSize = 50;
  }

  localStorage.setItem(
    "roamGroupSize",
    state.groupSize
  );

  document.getElementById("groupSizeDisplay").textContent =
    state.groupSize;
}


/* =========================================================
   DETAILS
========================================================= */

function saveRoamDetails() {

  const name =
    document
      .getElementById("roamName")
      .value
      .trim();

  const location =
    document
      .getElementById("location")
      .value
      .trim();

  if (!name) {

    showToast("Give your plan a name.");

    document.getElementById("roamName").focus();

    return;
  }

  if (!location && !state.latitude) {

    showToast("Add a location first.");

    document.getElementById("location").focus();

    return;
  }

  state.roamName = name;

  state.location = location;

  renderDates();

  showScreen("dates");
}


/* =========================================================
   DATES
========================================================= */

function renderDates() {

  const grid =
    document.getElementById("dateGrid");

  if (!grid) {
    return;
  }

  grid.innerHTML = "";

  const today = new Date();

  for (let i = 0; i < 10; i++) {

    const date = new Date(today);

    date.setDate(
      today.getDate() + i
    );

    const key =
      date.toISOString().split("T")[0];

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

    const card =
      document.createElement("button");

    card.type = "button";

    card.className = "date-card";

    if (
      state.selectedDates.includes(key)
    ) {
      card.classList.add("selected");
    }

    card.innerHTML = `
      <small>${day.toUpperCase()}</small>
      <strong>${number}</strong>
      <span>${month}</span>
    `;

    card.addEventListener(
      "click",
      () => {

        if (
          state.selectedDates.includes(key)
        ) {

          state.selectedDates =
            state.selectedDates.filter(
              item => item !== key
            );

          card.classList.remove("selected");

        } else {

          state.selectedDates.push(key);

          card.classList.add("selected");
        }

      }
    );

    grid.appendChild(card);
  }
}


function saveDates() {

  if (state.selectedDates.length === 0) {

    showToast("Pick at least one day.");

    return;
  }

  renderTimes();

  showScreen("availability");
}


/* =========================================================
   TIME SELECTION
========================================================= */

function renderTimes() {

  const grid =
    document.getElementById("timeGrid");

  grid.innerHTML = "";

  state.selectedTimes = [];

  timeOptions.forEach(time => {

    const button =
      document.createElement("button");

    button.type = "button";

    button.className = "time-card";

    button.textContent = time;

    button.addEventListener(
      "click",
      () => {

        if (
          state.selectedTimes.includes(time)
        ) {

          state.selectedTimes =
            state.selectedTimes.filter(
              item => item !== time
            );

          button.classList.remove("selected");

        } else {

          state.selectedTimes.push(time);

          button.classList.add("selected");
        }

      }
    );

    grid.appendChild(button);

  });

}


/* =========================================================
   AVAILABILITY
========================================================= */

function saveAvailability() {

  const name =
    document
      .getElementById("participantName")
      .value
      .trim();

  if (!name) {

    showToast("Add your name.");

    document
      .getElementById("participantName")
      .focus();

    return;
  }

  if (state.selectedTimes.length === 0) {

    showToast("Pick at least one time.");

    return;
  }

  state.participantName = name;

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

      card.classList.toggle(
        "selected",
        Number(card.dataset.budget) === amount
      );

    });

  document.getElementById(
    "budgetContinue"
  ).disabled = false;
}


function finishBudget() {

  if (!state.budget) {

    showToast("Pick a budget.");

    return;
  }

  showScreen("activity");
}


/* =========================================================
   ACTIVITY
========================================================= */

function selectActivity(activity) {

  state.activity = activity;

  const data =
    activityData[activity];

  if (!data) {
    return;
  }

  showScreen("results");

  generateResults();
}


/* =========================================================
   RESULTS
========================================================= */

function generateResults() {

  const list =
    document.getElementById("resultsList");

  list.innerHTML = "";

  const dates =
    state.selectedDates.length
      ? state.selectedDates
      : [new Date().toISOString().split("T")[0]];

  const selectedTimes =
    state.selectedTimes.length
      ? state.selectedTimes
      : ["7:00 PM"];

  const results = [];

  dates.slice(0, 3).forEach(
    (date, dateIndex) => {

      const time =
        selectedTimes[
          dateIndex % selectedTimes.length
        ];

      results.push({
        date,
        time
      });

    }
  );

  state.selectedTime = results[0];

  results.forEach(
    (result, index) => {

      const card =
        document.createElement("div");

      card.className =
        "result-card";

      if (index === 0) {
        card.classList.add("best");
      }

      const dateObject =
        new Date(
          `${result.date}T12:00:00`
        );

      const day =
        dateObject.toLocaleDateString(
          undefined,
          {
            weekday: "long"
          }
        );

      const dateText =
        dateObject.toLocaleDateString(
          undefined,
          {
            month: "short",
            day: "numeric"
          }
        );

      card.innerHTML = `
        <div class="result-day">
          ${day.toUpperCase()} · ${dateText.toUpperCase()}
        </div>

        <div class="result-time">
          ${result.time}
        </div>

        <div class="result-meta">
          ${state.groupSize} people ·
          ${activityData[state.activity].label}
        </div>
      `;

      list.appendChild(card);

    }
  );

  document.getElementById(
    "averageBudget"
  ).textContent =
    `$${state.budget}`;

}


/* =========================================================
   PLACES
========================================================= */

async function showPlaces() {

  showScreen("places");

  const list =
    document.getElementById("placesList");

  const loading =
    document.getElementById("placesLoading");

  list.innerHTML = "";

  loading.classList.add("active");

  const subtitle =
    document.getElementById("placesSubtitle");

  subtitle.textContent =
    state.location
      ? `Places near ${state.location}.`
      : "Places near you.";

  try {

    let latitude =
      state.latitude;

    let longitude =
      state.longitude;


    /* -----------------------------------------------
       If we don't have GPS coordinates,
       geocode the typed location.
    ------------------------------------------------ */

    if (
      latitude === null ||
      longitude === null
    ) {

      const coordinates =
        await geocodeLocation(
          state.location
        );

      if (coordinates) {

        latitude =
          coordinates.lat;

        longitude =
          coordinates.lon;

      }

    }


    if (
      latitude === null ||
      longitude === null
    ) {

      throw new Error(
        "Could not locate this area."
      );

    }


    const places =
      await findNearbyPlaces(
        latitude,
        longitude,
        state.activity
      );


    loading.classList.remove("active");

    renderPlaces(places);

  } catch (error) {

    console.error(error);

    loading.classList.remove("active");

    renderFallbackPlaces();

  }

}


/* =========================================================
   NOMINATIM GEOCODING
========================================================= */

async function geocodeLocation(location) {

  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q: location,
      format: "json",
      limit: "1"
    });

  const response =
    await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });

  if (!response.ok) {
    throw new Error("Geocoding failed.");
  }

  const data =
    await response.json();

  if (!data.length) {
    return null;
  }

  return {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon)
  };
}


/* =========================================================
   OVERPASS
========================================================= */

async function findNearbyPlaces(
  latitude,
  longitude,
  activity
) {

  const data =
    activityData[activity] ||
    activityData.other;

  const radius = 7000;

  const queryParts =
    data.searchTerms.map(term => {

      if (
        term === "restaurant" ||
        term === "cafe" ||
        term === "bar" ||
        term === "cinema" ||
        term === "theatre" ||
        term === "theater" ||
        term === "bowling" ||
        term === "museum" ||
        term === "gallery" ||
        term === "arts_centre" ||
        term === "park" ||
        term === "garden" ||
        term === "nature_reserve" ||
        term === "sports_centre" ||
        term === "pitch" ||
        term === "amusement_arcade" ||
        term === "leisure_centre" ||
        term === "community_centre" ||
        term === "attraction" ||
        term === "leisure"
      ) {

        return `
          nwr[
            amenity=${term}
          ](
            around:${radius},
            ${latitude},
            ${longitude}
          );
        `;

      }

      return `
        nwr[
          shop=${term}
        ](
          around:${radius},
          ${latitude},
          ${longitude}
        );
      `;

    }).join("\n");


  const query = `
    [out:json][timeout:20];
    (
      ${queryParts}
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
            body: query
          }
        );

      if (!response.ok) {
        throw new Error(
          `Overpass returned ${response.status}`
        );
      }

      const json =
        await response.json();

      return cleanPlaces(
        json.elements || [],
        latitude,
        longitude
      );

    } catch (error) {

      lastError = error;

    }

  }


  throw lastError ||
    new Error("No place data.");
}


/* =========================================================
   CLEAN PLACES
========================================================= */

function cleanPlaces(
  elements,
  userLat,
  userLon
) {

  const seen = new Set();

  const places = [];

  elements.forEach(element => {

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
      name.toLowerCase();

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
      lat && lon
        ? calculateDistance(
            userLat,
            userLon,
            lat,
            lon
          )
        : null;

    places.push({

      name,

      category:
        tags.amenity ||
        tags.leisure ||
        tags.tourism ||
        "Place",

      address:
        tags["addr:street"]
          ? `${tags["addr:housenumber"] || ""} ${tags["addr:street"]}`
              .trim()
          : "Nearby",

      distance,

      lat,

      lon,

      website:
        tags.website ||
        tags["contact:website"] ||
        null

    });

  });


  places.sort(
    (a, b) => {

      if (
        a.distance === null
      ) return 1;

      if (
        b.distance === null
      ) return -1;

      return a.distance -
        b.distance;

    }
  );


  return places.slice(0, 9);
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

  const R = 3958.8;

  const dLat =
    toRadians(lat2 - lat1);

  const dLon =
    toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}


function toRadians(degrees) {
  return degrees * Math.PI / 180;
}


/* =========================================================
   RENDER PLACES
========================================================= */

function renderPlaces(places) {

  const list =
    document.getElementById("placesList");

  list.innerHTML = "";


  if (!places.length) {

    renderFallbackPlaces();

    return;
  }


  places.forEach(
    (place, index) => {

      const card =
        document.createElement("article");

      card.className =
        "place-card";


      const image =
        getPlaceImage(
          state.activity,
          index
        );


      const distance =
        place.distance !== null
          ? `${place.distance.toFixed(1)} mi`
          : "Nearby";


      card.innerHTML = `

        <div class="place-image">

          <img
            src="${image}"
            alt="${escapeHtml(place.name)}"
            loading="lazy"
          >

        </div>


        <div class="place-content">

          <small>
            ${escapeHtml(
              formatCategory(place.category)
            )}
          </small>


          <h3>
            ${escapeHtml(place.name)}
          </h3>


          <p class="place-info">
            ${distance} ·
            ${escapeHtml(place.address)}
          </p>


          <button
            class="place-action"
            type="button"
          >
            Choose this place →
          </button>

        </div>

      `;


      card
        .querySelector(".place-action")
        .addEventListener(
          "click",
          () => {

            choosePlace(place);

          }
        );


      list.appendChild(card);

    }
  );

}


/* =========================================================
   FALLBACK PLACE CARDS
========================================================= */

function renderFallbackPlaces() {

  const list =
    document.getElementById("placesList");

  list.innerHTML = "";


  const activity =
    activityData[state.activity] ||
    activityData.other;


  const fallbackNames = {

    eat: [
      "Nearby restaurant",
      "Local cafe",
      "Popular food spot"
    ],

    movies: [
      "Nearby cinema",
      "Local theater",
      "Movie house"
    ],

    bowling: [
      "Nearby bowling",
      "Local bowling alley",
      "Bowling center"
    ],

    coffee: [
      "Nearby coffee shop",
      "Local cafe",
      "Coffee house"
    ],

    outdoors: [
      "Nearby park",
      "Local outdoor spot",
      "Nature area"
    ],

    arts: [
      "Nearby museum",
      "Local gallery",
      "Arts center"
    ],

    games: [
      "Nearby game spot",
      "Local activity center",
      "Game lounge"
    ],

    other: [
      "Nearby activity",
      "Local attraction",
      "Something to explore"
    ]

  };


  const names =
    fallbackNames[
      state.activity
    ] ||
    fallbackNames.other;


  names.forEach(
    (name, index) => {

      const card =
        document.createElement("article");

      card.className =
        "place-card";


      card.innerHTML = `

        <div class="place-image">

          <img
            src="${getPlaceImage(
              state.activity,
              index
            )}"
            alt="${name}"
          >

        </div>


        <div class="place-content">

          <small>
            ${activity.label}
          </small>

          <h3>
            ${name}
          </h3>

          <p class="place-info">
            Search this activity nearby.
          </p>

          <button
            class="place-action"
            type="button"
          >
            Choose this →
          </button>

        </div>

      `;


      card
        .querySelector(".place-action")
        .addEventListener(
          "click",
          () => {

            choosePlace({
              name,
              category: activity.label,
              address: state.location || "Nearby",
              distance: null
            });

          }
        );


      list.appendChild(card);

    }
  );

}


/* =========================================================
   PLACE IMAGE
========================================================= */

function getPlaceImage(
  activity,
  index
) {

  const images = {

    eat: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"
    ],

    movies: [
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80"
    ],

    bowling: [
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1604933834401-5e3f8b2f9c9a?auto=format&fit=crop&w=900&q=80"
    ],

    coffee: [
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80"
    ],

    outdoors: [
      "https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80"
    ],

    arts: [
      "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1577083288073-40892c0860a4?auto=format&fit=crop&w=900&q=80"
    ],

    games: [
      "https://images.unsplash.com/photo-1606503153255-59d8b8b4b7c5?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80"
    ],

    other: [
      "https://images.unsplash.com/photo-1521336575822-6da63fb45455?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80"
    ]

  };


  const collection =
    images[activity] ||
    images.other;


  return collection[
    index % collection.length
  ];
}


/* =========================================================
   CHOOSE PLACE
========================================================= */

function choosePlace(place) {

  state.selectedPlace = place;

  buildFinalPlan();

  showScreen("final");
}


/* =========================================================
   FINAL PLAN
========================================================= */

function buildFinalPlan() {

  const date =
    state.selectedTime?.date ||
    state.selectedDates[0];

  const time =
    state.selectedTime?.time ||
    state.selectedTimes[0] ||
    "7:00 PM";


  const dateObject =
    new Date(`${date}T12:00:00`);


  const weekday =
    dateObject.toLocaleDateString(
      undefined,
      {
        weekday: "long"
      }
    );


  const dateText =
    dateObject.toLocaleDateString(
      undefined,
      {
        month: "long",
        day: "numeric"
      }
    );


  document.getElementById(
    "finalDate"
  ).textContent =
    `${weekday.toUpperCase()} · ${dateText.toUpperCase()}`;


  document.getElementById(
    "finalTime"
  ).textContent =
    time;


  document.getElementById(
    "finalActivity"
  ).textContent =
    activityData[state.activity]?.label ||
    "Hangout";


  document.getElementById(
    "finalPlace"
  ).textContent =
    state.selectedPlace?.name ||
    "Your chosen place";


  document.getElementById(
    "finalPeople"
  ).textContent =
    `${state.groupSize} people`;


  document.getElementById(
    "finalBudget"
  ).textContent =
    `~$${state.budget || 0} each`;
}


/* =========================================================
   COPY PLAN
========================================================= */

function getPlanText() {

  const date =
    state.selectedTime?.date ||
    state.selectedDates[0];

  const time =
    state.selectedTime?.time ||
    state.selectedTimes[0] ||
    "7:00 PM";


  const dateObject =
    new Date(`${date}T12:00:00`);


  const weekday =
    dateObject.toLocaleDateString(
      undefined,
      {
        weekday: "long"
      }
    );


  const activity =
    activityData[state.activity]?.label ||
    "hangout";


  const place =
    state.selectedPlace?.name ||
    "our chosen place";


  return `${weekday} at ${time}
We're going ${activity.toLowerCase()} at ${place}.
${state.groupSize} people · About $${state.budget || 0} each.`;
}


async function copyPlan() {

  const text =
    getPlanText();

  try {

    await navigator.clipboard.writeText(text);

    showToast("Plan copied.");

  } catch {

    showToast("Copy isn't available here.");

  }
}


/* =========================================================
   SHARE
========================================================= */

async function sharePlan() {

  const text =
    getPlanText();


  if (
    navigator.share
  ) {

    try {

      await navigator.share({
        title: "My Roam plan",
        text
      });

    } catch {

      // User cancelled share.

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
      "Location isn't supported here."
    );

    return;
  }


  const status =
    document.getElementById(
      "locationStatus"
    );


  status.textContent =
    "Finding you...";


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

          document.getElementById(
            "location"
          ).value =
            address;

          status.textContent =
            "Location found.";

        } else {

          status.textContent =
            "Location found.";

        }

      } catch {

        status.textContent =
          "Location found.";

      }

    },

    error => {

      console.error(error);

      status.textContent =
        "Couldn't access your location.";

      showToast(
        "Enter your city instead."
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
   REVERSE GEOCODE
========================================================= */

async function reverseGeocode(
  latitude,
  longitude
) {

  const url =
    "https://nominatim.openstreetmap.org/reverse?" +
    new URLSearchParams({
      lat: latitude,
      lon: longitude,
      format: "json"
    });


  const response =
    await fetch(url);


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
    data.display_name ||
    null
  );
}


/* =========================================================
   JOIN MESSAGE
========================================================= */

function showJoinMessage() {

  showToast(
    "Shared Roams are coming next."
  );

}


/* =========================================================
   UTILITIES
========================================================= */

function formatCategory(category) {

  return String(category)
    .replaceAll("_", " ")
    .replace(/\b\w/g, letter =>
      letter.toUpperCase()
    );
}


function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


let toastTimer = null;


function showToast(message) {

  const toast =
    document.getElementById("toast");


  toast.textContent =
    message;


  toast.classList.add("show");


  clearTimeout(toastTimer);


  toastTimer =
    setTimeout(
      () => {
        toast.classList.remove("show");
      },
      2600
    );
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    document.getElementById(
      "groupSizeDisplay"
    ).textContent =
      state.groupSize;

    renderDates();

    updateProgress("home");

  }
);

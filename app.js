/* ==========================================
   ROAM
   Main Application
   ========================================== */


/* ==========================================
   STATE
   ========================================== */

const state = {

  roamName: "",

  location: "",

  groupSize: 10,

  dates: [],

  participantName: "",

  availability: [],

  budget: null,

  averageBudget: 47,

  selectedResult: null,

  selectedPlace: null,

  userLocation: {
    latitude: null,
    longitude: null
  }

};


/* ==========================================
   TIME OPTIONS
   ========================================== */

const times = [
  "10:00 AM",
  "11:30 AM",
  "1:00 PM",
  "2:30 PM",
  "4:00 PM",
  "5:30 PM",
  "6:30 PM",
  "7:30 PM",
  "9:00 PM"
];


/* ==========================================
   START ROAM
   ========================================== */

function startRoam() {

  showScreen("create");

}


/* ==========================================
   SCREEN NAVIGATION
   ========================================== */

function showScreen(screenName) {

  document
    .querySelectorAll(".screen")
    .forEach(screen => {
      screen.classList.remove("active");
    });


  const screen =
    document.getElementById(screenName);

  if (screen) {

    screen.classList.add("active");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  if (screenName === "days") {

    renderDates();

  }


  if (screenName === "availability") {

    renderTimes();

  }

}


/* ==========================================
   CREATE ROAM
   ========================================== */

function saveRoamDetails() {

  const name =
    document.getElementById("roamName").value.trim();

  const location =
    document.getElementById("location").value.trim();

  const groupSize =
    Number(
      document.getElementById("groupSize").value
    );


  if (!name) {

    alert("Give your Roam a name.");

    return;

  }


  if (!location && !state.userLocation.latitude) {

    alert(
      "Enter a location or use your current location."
    );

    return;

  }


  if (!groupSize || groupSize < 2) {

    alert(
      "Your Roam needs at least 2 people."
    );

    return;

  }


  state.roamName = name;

  state.location = location;

  state.groupSize = groupSize;


  showScreen("days");

}


/* ==========================================
   USER LOCATION
   ========================================== */

const useLocationBtn =
  document.getElementById("useLocationBtn");

const locationStatus =
  document.getElementById("locationStatus");


if (useLocationBtn) {

  useLocationBtn.addEventListener(
    "click",
    getUserLocation
  );

}


function getUserLocation() {

  if (!navigator.geolocation) {

    locationStatus.textContent =
      "Your browser does not support location.";

    return;

  }


  locationStatus.textContent =
    "📍 Finding your location...";


  useLocationBtn.disabled = true;


  navigator.geolocation.getCurrentPosition(

    function(position) {

      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;


      state.userLocation.latitude =
        latitude;

      state.userLocation.longitude =
        longitude;


      locationStatus.textContent =
        "✓ Location found! Roam can now find places near you.";


      useLocationBtn.textContent =
        "✓ Location found";


      useLocationBtn.disabled = false;


      console.log(
        "Roam location:",
        latitude,
        longitude
      );

    },


    function(error) {

      useLocationBtn.disabled = false;

      useLocationBtn.textContent =
        "📍 Use my location";


      if (
        error.code ===
        error.PERMISSION_DENIED
      ) {

        locationStatus.textContent =
          "Location permission was denied. You can enter a city instead.";

      }

      else if (
        error.code ===
        error.POSITION_UNAVAILABLE
      ) {

        locationStatus.textContent =
          "We couldn't find your location. Try again.";

      }

      else if (
        error.code ===
        error.TIMEOUT
      ) {

        locationStatus.textContent =
          "Location request timed out. Try again.";

      }

      else {

        locationStatus.textContent =
          "Something went wrong finding your location.";

      }

    },


    {
      enableHighAccuracy: true,

      timeout: 10000,

      maximumAge: 300000
    }

  );

}


/* ==========================================
   DATES
   ========================================== */

function renderDates() {

  const dateGrid =
    document.getElementById("dateGrid");


  dateGrid.innerHTML = "";


  const today =
    new Date();


  for (let i = 0; i < 14; i++) {

    const date =
      new Date(today);


    date.setDate(
      today.getDate() + i
    );


    const day =
      date.toLocaleDateString(
        "en-US",
        {
          weekday: "short"
        }
      );


    const month =
      date.toLocaleDateString(
        "en-US",
        {
          month: "short"
        }
      );


    const number =
      date.getDate();


    const dateValue =
      date.toISOString().split("T")[0];


    const button =
      document.createElement("button");


    button.className =
      "date-option";


    button.dataset.date =
      dateValue;


    button.innerHTML = `
      <span class="date-day">
        ${day}
      </span>

      <span class="date-number">
        ${number}
      </span>

      <small>
        ${month}
      </small>
    `;


    button.addEventListener(
      "click",
      function() {

        this.classList.toggle(
          "selected"
        );


        const dateIndex =
          state.dates.indexOf(
            dateValue
          );


        if (dateIndex >= 0) {

          state.dates.splice(
            dateIndex,
            1
          );

        }

        else {

          state.dates.push(
            dateValue
          );

        }

      }
    );


    dateGrid.appendChild(button);

  }

}


/* ==========================================
   SAVE DATES
   ========================================== */

function saveDates() {

  if (!state.dates.length) {

    alert(
      "Pick at least one day."
    );

    return;

  }


  showScreen("availability");

}


/* ==========================================
   TIMES
   ========================================== */

function renderTimes() {

  const timeGrid =
    document.getElementById("timeGrid");


  timeGrid.innerHTML = "";


  times.forEach(time => {

    const button =
      document.createElement("button");


    button.className =
      "time-option";


    button.textContent =
      time;


    button.type =
      "button";


    button.addEventListener(
      "click",
      function() {

        this.classList.toggle(
          "selected"
        );

      }
    );


    timeGrid.appendChild(button);

  });

}


/* ==========================================
   SAVE AVAILABILITY
   ========================================== */

function saveAvailability() {

  const name =
    document
      .getElementById("participantName")
      .value
      .trim();


  if (!name) {

    alert(
      "Enter your name."
    );

    return;

  }


  const selectedTimes =
    [...document.querySelectorAll(
      ".time-option.selected"
    )]
      .map(button =>
        button.textContent
      );


  if (!selectedTimes.length) {

    alert(
      "Pick at least one time."
    );

    return;

  }


  state.participantName =
    name;


  state.availability =
    selectedTimes;


  showScreen("budget");

}


/* ==========================================
   BUDGET
   ========================================== */

function selectBudget(button, value) {

  document
    .querySelectorAll(".budget-option")
    .forEach(option => {

      option.classList.remove(
        "selected"
      );

    });


  button.classList.add(
    "selected"
  );


  state.budget =
    value;

}


/* ==========================================
   FINISH BUDGET
   ========================================== */

function finishBudget() {

  if (!state.budget) {

    alert(
      "Choose a budget first."
    );

    return;

  }


  state.averageBudget =
    state.budget;


  calculateResults();


  showScreen("results");

}


/* ==========================================
   CALCULATE RESULTS
   ========================================== */

function calculateResults() {

  const resultsList =
    document.getElementById(
      "resultsList"
    );


  const averageBudget =
    document.getElementById(
      "averageBudget"
    );


  averageBudget.innerHTML = `
    <strong>
      Group budget
    </strong>

    <br>

    Around $${state.averageBudget}
    per person
  `;


  resultsList.innerHTML = "";


  const results = [];


  state.dates.forEach(date => {

    state.availability.forEach(time => {

      results.push({

        date: date,

        time: time,

        count:
          Math.floor(
            state.groupSize *
            (0.65 + Math.random() * 0.35)
          )

      });

    });

  });


  results
    .sort(
      (a, b) =>
        b.count - a.count
    );


  const bestResults =
    results.slice(0, 3);


  bestResults.forEach(result => {

    const card =
      document.createElement("div");


    card.className =
      "result-card";


    const date =
      new Date(
        result.date + "T12:00:00"
      );


    const formattedDate =
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

        <h3>
          ${formattedDate}
        </h3>

        <p>
          ${result.time}
        </p>

      </div>


      <div class="result-count">

        <strong>
          ${result.count}/${state.groupSize}
        </strong>

        <span>
          people free
        </span>

      </div>

    `;


    card.addEventListener(
      "click",
      function() {

        state.selectedResult =
          result;


        loadNearbyPlaces();


        showScreen("places");

      }
    );


    resultsList.appendChild(
      card
    );

  });

}


/* ==========================================
   GOOGLE PLACES
   ========================================== */

async function searchNearbyPlaces() {

  const latitude =
    state.userLocation.latitude;

  const longitude =
    state.userLocation.longitude;


  if (
    latitude === null ||
    longitude === null
  ) {

    return [];

  }


  try {

    const placesLibrary =
      await google.maps.importLibrary(
        "places"
      );


    const Place =
      placesLibrary.Place;


    const SearchNearbyRankPreference =
      placesLibrary.SearchNearbyRankPreference;


    const types =
      getPlaceTypesForTime();


    const request = {

      fields: [
        "displayName",
        "location",
        "formattedAddress",
        "rating",
        "userRatingCount",
        "photos",
        "googleMapsURI",
        "priceLevel",
        "primaryType"
      ],


      locationRestriction: {

        center: {
          lat: latitude,
          lng: longitude
        },

        radius: 8046.72

      },


      includedPrimaryTypes:
        types,


      maxResultCount: 10,


      rankPreference:
        SearchNearbyRankPreference.POPULARITY,


      language: "en",

      region: "US"

    };


    const response =
      await Place.searchNearby(
        request
      );


    return response.places || [];

  }

  catch (error) {

    console.error(
      "Google Places error:",
      error
    );


    return [];

  }

}


/* ==========================================
   TIME → PLACE TYPE
   ========================================== */

function getPlaceTypesForTime() {

  const time =
    state.selectedResult?.time ||
    "6:30 PM";


  const hour =
    convertTimeToHour(time);


  if (
    hour >= 7 &&
    hour < 11
  ) {

    return [
      "cafe",
      "bakery",
      "restaurant"
    ];

  }


  if (
    hour >= 11 &&
    hour < 17
  ) {

    return [
      "cafe",
      "park",
      "ice_cream_shop",
      "restaurant",
      "shopping_mall"
    ];

  }


  if (
    hour >= 17 &&
    hour < 21
  ) {

    return [
      "restaurant",
      "italian_restaurant",
      "pizza_restaurant"
    ];

  }


  return [
    "bar",
    "night_club",
    "pizza_restaurant",
    "restaurant"
  ];

}


/* ==========================================
   CONVERT TIME
   ========================================== */

function convertTimeToHour(
  timeString
) {

  if (!timeString) {

    return 18;

  }


  const parts =
    timeString.split(" ");


  const time =
    parts[0];


  const modifier =
    parts[1];


  let [hours] =
    time
      .split(":")
      .map(Number);


  if (
    modifier === "PM" &&
    hours !== 12
  ) {

    hours += 12;

  }


  if (
    modifier === "AM" &&
    hours === 12
  ) {

    hours = 0;

  }


  return hours;

}


/* ==========================================
   LOAD NEARBY PLACES
   ========================================== */

async function loadNearbyPlaces() {

  const placesList =
    document.getElementById(
      "placesList"
    );


  const placesSubtitle =
    document.getElementById(
      "placesSubtitle"
    );


  placesList.innerHTML = `

    <div class="loading-places">

      <div class="loading-spinner"></div>

      <h3>
        Finding places near you...
      </h3>

      <p>
        Roam is looking for somewhere good.
      </p>

    </div>

  `;


  if (
    state.userLocation.latitude === null
  ) {

    placesList.innerHTML = `

      <div class="empty-places">

        <h3>
          We need your location.
        </h3>

        <p>
          Go back and tap
          "Use my location" so Roam
          can find real places nearby.
        </p>

        <br>

        <button
          class="primary-button"
          onclick="showScreen('create')"
        >
          Add my location
        </button>

      </div>

    `;

    return;

  }


  const places =
    await searchNearbyPlaces();


  if (!places.length) {

    placesList.innerHTML = `

      <div class="empty-places">

        <h3>
          No places found.
        </h3>

        <p>
          Try another time or expand your search area.
        </p>

      </div>

    `;

    return;

  }


  placesSubtitle.textContent =
    `Real places near you based on your time and vibe.`;


  renderNearbyPlaces(
    places
  );

}


/* ==========================================
   RENDER PLACES
   ========================================== */

function renderNearbyPlaces(
  places
) {

  const placesList =
    document.getElementById(
      "placesList"
    );


  placesList.innerHTML = "";


  places.forEach(place => {

    const card =
      document.createElement(
        "article"
      );


    card.className =
      "place-card";


    const name =
      place.displayName?.text ||
      "Nearby place";


    const address =
      place.formattedAddress ||
      "Address unavailable";


    const rating =
      place.rating
        ? `⭐ ${place.rating}`
        : "No rating";


    const ratingCount =
      place.userRatingCount
        ? ` (${place.userRatingCount})`
        : "";


    const price =
      formatPrice(
        place.priceLevel
      );


    const type =
      formatPlaceType(
        place.primaryType
      );


    let photoHTML = `
      <div class="place-placeholder">
        📍
      </div>
    `;


    if (
      place.photos &&
      place.photos.length
    ) {

      try {

        const photoURI =
          place.photos[0].getURI({
            maxWidth: 900,
            maxHeight: 600
          });


        photoHTML = `
          <img
            src="${photoURI}"
            alt="${escapeHTML(name)}"
          >

          <span class="place-photo-credit">
            Google
          </span>
        `;

      }

      catch (error) {

        console.log(
          "Photo unavailable",
          error
        );

      }

    }


    const mapsURL =
      place.googleMapsURI ||
      "#";


    card.innerHTML = `

      <div class="place-image">

        ${photoHTML}

      </div>


      <div class="place-content">

        <div class="place-type">
          ${escapeHTML(type)}
        </div>


        <div class="place-header">

          <div>

            <h3>
              ${escapeHTML(name)}
            </h3>

          </div>

          <span class="place-rating">
            ${rating}
            ${ratingCount}
          </span>

        </div>


        <p class="place-address">
          ${escapeHTML(address)}
        </p>


        <div class="place-bottom">

          <span class="place-price">
            ${price}
          </span>


          <a
            class="place-map-link"
            href="${mapsURL}"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Maps →
          </a>

        </div>

      </div>

    `;


    card.addEventListener(
      "click",
      function(event) {

        if (
          event.target.closest(
            "a"
          )
        ) {

          return;

        }


        state.selectedPlace =
          place;


        renderFinalPlan();


        showScreen("final");

      }
    );


    placesList.appendChild(
      card
    );

  });

}


/* ==========================================
   FORMAT PRICE
   ========================================== */

function formatPrice(
  priceLevel
) {

  if (!priceLevel) {

    return "$$";

  }


  const levels = {

    PRICE_LEVEL_FREE:
      "Free",

    PRICE_LEVEL_INEXPENSIVE:
      "$",

    PRICE_LEVEL_MODERATE:
      "$$",

    PRICE_LEVEL_EXPENSIVE:
      "$$$",

    PRICE_LEVEL_VERY_EXPENSIVE:
      "$$$$"

  };


  return (
    levels[priceLevel] ||
    "$$"
  );

}


/* ==========================================
   FORMAT PLACE TYPE
   ========================================== */

function formatPlaceType(
  type
) {

  if (!type) {

    return "Nearby place";

  }


  return type
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      letter =>
        letter.toUpperCase()
    );

}


/* ==========================================
   FINAL PLAN
   ========================================== */

function renderFinalPlan() {

  const finalPlan =
    document.getElementById(
      "finalPlan"
    );


  const result =
    state.selectedResult;


  const place =
    state.selectedPlace;


  if (!result || !place) {

    return;

  }


  const date =
    new Date(
      result.date + "T12:00:00"
    );


  const formattedDate =
    date.toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric"
      }
    );


  const name =
    place.displayName?.text ||
    "your chosen place";


  const address =
    place.formattedAddress ||
    "";


  const rating =
    place.rating ||
    "N/A";


  finalPlan.innerHTML = `

    <strong>
      ${escapeHTML(state.roamName)}
    </strong>

    <br>

    📅
    ${formattedDate}

    <br>

    🕐
    ${escapeHTML(result.time)}

    <br>

    👥
    ${state.groupSize} people

    <br>

    💰
    Around $${state.averageBudget}
    per person


    <div class="final-place">

      <p>
        You're going to:
      </p>

      <h3>
        ${escapeHTML(name)}
      </h3>

      <p>
        ${escapeHTML(address)}
      </p>

      <p>
        ⭐ ${rating}
      </p>

    </div>

  `;

}


/* ==========================================
   COPY PLAN
   ========================================== */

async function copyPlan() {

  const result =
    state.selectedResult;


  const place =
    state.selectedPlace;


  if (!result || !place) {

    return;

  }


  const date =
    new Date(
      result.date + "T12:00:00"
    );


  const formattedDate =
    date.toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric"
      }
    );


  const placeName =
    place.displayName?.text ||
    "our spot";


  const address =
    place.formattedAddress ||
    "";


  const message =

`🌿 ROAM PLAN

${state.roamName}

📅 ${formattedDate}
🕐 ${result.time}
👥 ${state.groupSize} people
💰 Around $${state.averageBudget} per person

📍 ${placeName}
${address}

Let's go! 🇮🇹`;


  try {

    await navigator.clipboard.writeText(
      message
    );


    alert(
      "✓ Plan copied!"
    );

  }

  catch (error) {

    alert(
      "Couldn't copy automatically."
    );

  }

}


/* ==========================================
   SHARE PLAN
   ========================================== */

async function sharePlan() {

  const result =
    state.selectedResult;


  const place =
    state.selectedPlace;


  if (!result || !place) {

    return;

  }


  const placeName =
    place.displayName?.text ||
    "our spot";


  const message =

`${state.roamName} 🌿

${result.time} — ${placeName}

Roamed with Roam.`;



  if (
    navigator.share
  ) {

    try {

      await navigator.share({

        title:
          state.roamName,

        text:
          message

      });

    }

    catch (error) {

      console.log(
        "Share cancelled."
      );

    }

  }

  else {

    await copyPlan();

  }

}


/* ==========================================
   ESCAPE HTML
   ========================================== */

function escapeHTML(
  value
) {

  return String(value)

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


/* ==========================================
   INITIALIZE
   ========================================== */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    console.log(
      "🌿 Roam is ready."
    );

  }
);

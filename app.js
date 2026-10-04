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

/* -----------------------------
   SCREEN NAVIGATION
----------------------------- */

function showScreen(screenName) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const target = document.getElementById(screenName);

  if (target) {
    target.classList.add("active");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* -----------------------------
   START ROAM
----------------------------- */

function startRoam() {
  showScreen("create");
}

/* -----------------------------
   CREATE ROAM
----------------------------- */

function saveRoamDetails() {
  const nameInput = document.getElementById("roamName");
  const locationInput = document.getElementById("location");
  const groupInput = document.getElementById("groupSize");

  state.roamName = nameInput.value.trim();
  state.location = locationInput.value.trim();
  state.groupSize = Number(groupInput.value) || 2;

  if (!state.roamName) {
    alert("Give your Roam a name first!");
    return;
  }

  showScreen("days");
  renderDates();
}

/* -----------------------------
   FREE LOCATION TRACKING
----------------------------- */

function getUserLocation() {
  const status = document.getElementById("locationStatus");
  const locationInput = document.getElementById("location");

  if (!navigator.geolocation) {
    status.textContent =
      "Your browser does not support location services.";
    return;
  }

  status.textContent = "📍 Finding your location...";

  navigator.geolocation.getCurrentPosition(
    position => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      state.userLocation.latitude = latitude;
      state.userLocation.longitude = longitude;

      status.textContent =
        "📍 Location found!";

      /*
        We don't need Google Maps to get the
        user's location.

        We use OpenStreetMap's reverse geocoding
        service to find the area/city name.
      */

      reverseGeocode(latitude, longitude, locationInput);
    },

    error => {
      console.log(error);

      status.textContent =
        "❌ We couldn't access your location. Please allow location access.";
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }
  );
}

/* -----------------------------
   REVERSE GEOCODING
----------------------------- */

async function reverseGeocode(latitude, longitude, input) {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Location lookup failed.");
    }

    const data = await response.json();

    const address = data.address || {};

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      "";

    const stateName =
      address.state || "";

    if (city && stateName) {
      input.value = `${city}, ${stateName}`;
      state.location = input.value;
    } else if (city) {
      input.value = city;
      state.location = city;
    }

  } catch (error) {
    console.log("Reverse geocoding error:", error);

    input.value = "My current location";
    state.location = "My current location";
  }
}

/* -----------------------------
   DATES
----------------------------- */

function renderDates() {
  const container = document.getElementById("dateGrid");

  if (!container) return;

  container.innerHTML = "";

  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);

    date.setDate(today.getDate() + i);

    const button = document.createElement("button");

    button.type = "button";
    button.className = "date-option";

    const month = date.toLocaleString("en-US", {
      month: "short"
    });

    const weekday = date.toLocaleString("en-US", {
      weekday: "short"
    });

    button.innerHTML = `
      <strong>${weekday}</strong>
      <span>${month} ${date.getDate()}</span>
    `;

    button.dataset.date =
      date.toISOString().split("T")[0];

    button.addEventListener("click", () => {
      button.classList.toggle("selected");
    });

    container.appendChild(button);
  }
}

function saveDates() {
  const selected =
    document.querySelectorAll(".date-option.selected");

  state.dates = Array.from(selected).map(button => {
    return button.dataset.date;
  });

  if (state.dates.length === 0) {
    alert("Pick at least one day!");
    return;
  }

  showScreen("availability");
  renderTimes();
}

/* -----------------------------
   AVAILABILITY
----------------------------- */

function renderTimes() {
  const container = document.getElementById("timeGrid");

  if (!container) return;

  container.innerHTML = "";

  times.forEach(time => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "time-option";

    button.textContent = time;

    button.addEventListener("click", () => {
      button.classList.toggle("selected");
    });

    container.appendChild(button);
  });
}

function saveAvailability() {
  const nameInput =
    document.getElementById("participantName");

  state.participantName =
    nameInput.value.trim();

  if (!state.participantName) {
    alert("Enter your name first!");
    return;
  }

  const selectedTimes =
    document.querySelectorAll(".time-option.selected");

  state.availability =
    Array.from(selectedTimes).map(button =>
      button.textContent
    );

  if (state.availability.length === 0) {
    alert("Pick at least one time!");
    return;
  }

  showScreen("budget");
}

/* -----------------------------
   BUDGET
----------------------------- */

function selectBudget(button, value) {
  document
    .querySelectorAll(".budget-option")
    .forEach(option => {
      option.classList.remove("selected");
    });

  button.classList.add("selected");

  state.budget = value;
}

function finishBudget() {
  if (!state.budget) {
    alert("Choose a budget first!");
    return;
  }

  /*
    For the prototype, we estimate the group average.
    Later this can be connected to a real database
    so every participant's budget is combined.
  */

  const averages = {
    "0-20": 15,
    "20-40": 30,
    "40-60": 50,
    "60-100": 80,
    "100+": 120
  };

  state.averageBudget =
    averages[state.budget] || 47;

  calculateResults();
}

/* -----------------------------
   FIND BEST TIMES
----------------------------- */

function calculateResults() {
  const resultsList =
    document.getElementById("resultsList");

  if (!resultsList) return;

  resultsList.innerHTML = "";

  const availableTimes =
    state.availability.length
      ? state.availability
      : times.slice(0, 3);

  availableTimes.slice(0, 3).forEach((time, index) => {
    const card = document.createElement("button");

    card.type = "button";
    card.className = "result-card";

    card.innerHTML = `
      <div>
        <small>OPTION ${index + 1}</small>
        <h3>${time}</h3>
        <p>Works for your group</p>
      </div>
      <span>→</span>
    `;

    card.addEventListener("click", () => {
      state.selectedResult = time;

      showScreen("places");

      searchNearbyPlaces();
    });

    resultsList.appendChild(card);
  });

  const average =
    document.getElementById("averageBudget");

  if (average) {
    average.textContent =
      `$${state.averageBudget}`;
  }

  showScreen("results");
}

/* -----------------------------
   CONVERT TIME TO HOUR
----------------------------- */

function convertTimeToHour(timeString) {
  const match =
    timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);

  if (!match) return 18;

  let hour = Number(match[1]);
  const period = match[3].toUpperCase();

  if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  return hour;
}

/* -----------------------------
   CHOOSE PLACE TYPES
----------------------------- */

function getPlaceTypesForTime(time) {
  const hour = convertTimeToHour(time);

  if (hour >= 7 && hour < 11) {
    return [
      "cafe",
      "bakery",
      "restaurant"
    ];
  }

  if (hour >= 11 && hour < 17) {
    return [
      "cafe",
      "park",
      "ice_cream_shop",
      "restaurant",
      "shopping_mall"
    ];
  }

  if (hour >= 17 && hour < 21) {
    return [
      "restaurant",
      "italian_restaurant",
      "pizza_restaurant"
    ];
  }

  return [
    "bar",
    "night_club",
    "restaurant",
    "pizza_restaurant"
  ];
}

/* -----------------------------
   FREE NEARBY PLACE SEARCH
   OPENSTREETMAP / OVERPASS
----------------------------- */

async function searchNearbyPlaces() {
  const container =
    document.getElementById("placesList");

  if (!container) return;

  if (
    state.userLocation.latitude === null ||
    state.userLocation.longitude === null
  ) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>📍 Location needed</h3>
        <p>
          Go back and tap "Use my location"
          so Roam can find places near you.
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML = `
    <div class="loading-card">
      <div class="loading-spinner"></div>
      <h3>Finding places near you...</h3>
      <p>Roam is looking around your area.</p>
    </div>
  `;

  const hour =
    convertTimeToHour(state.selectedResult);

  const tags =
    getOpenStreetMapTags(hour);

  try {
    const places =
      await loadNearbyPlaces(tags);

    renderNearbyPlaces(places);

  } catch (error) {
    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        <h3>Oops!</h3>
        <p>
          We couldn't load nearby places right now.
          Try again in a moment.
        </p>
        <button
          class="btn btn-primary"
          onclick="searchNearbyPlaces()"
        >
          Try Again
        </button>
      </div>
    `;
  }
}

/* -----------------------------
   OPENSTREETMAP TAGS
----------------------------- */

function getOpenStreetMapTags(hour) {
  if (hour >= 7 && hour < 11) {
    return [
      ["amenity", "cafe"],
      ["amenity", "restaurant"],
      ["shop", "bakery"]
    ];
  }

  if (hour >= 11 && hour < 17) {
    return [
      ["amenity", "cafe"],
      ["amenity", "restaurant"],
      ["leisure", "park"],
      ["amenity", "ice_cream"]
    ];
  }

  if (hour >= 17 && hour < 21) {
    return [
      ["amenity", "restaurant"],
      ["amenity", "pub"],
      ["amenity", "fast_food"]
    ];
  }

  return [
    ["amenity", "bar"],
    ["amenity", "pub"],
    ["amenity", "nightclub"],
    ["amenity", "restaurant"]
  ];
}

/* -----------------------------
   OVERPASS SEARCH
----------------------------- */

async function loadNearbyPlaces(tags) {
  const latitude =
    state.userLocation.latitude;

  const longitude =
    state.userLocation.longitude;

  /*
    Approximately 5 miles.
    8046 meters = about 5 miles.
  */

  const radius = 8046;

  const queries = tags.map(([key, value]) => {
    return `
      node["${key}"="${value}"]
        (around:${radius},${latitude},${longitude});

      way["${key}"="${value}"]
        (around:${radius},${latitude},${longitude});

      relation["${key}"="${value}"]
        (around:${radius},${latitude},${longitude});
    `;
  }).join("\n");

  const query = `
    [out:json][timeout:25];
    (
      ${queries}
    );
    out center tags;
  `;

  const response = await fetch(
    "https://overpass-api.de/api/interpreter",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded"
      },
      body:
        "data=" + encodeURIComponent(query)
    }
  );

  if (!response.ok) {
    throw new Error(
      "Overpass request failed."
    );
  }

  const data = await response.json();

  const places = [];

  for (const element of data.elements) {
    const tags = element.tags || {};

    let lat = element.lat;
    let lon = element.lon;

    /*
      Ways/relations use a center instead
      of lat/lon directly.
    */

    if (
      (lat === undefined || lon === undefined) &&
      element.center
    ) {
      lat = element.center.lat;
      lon = element.center.lon;
    }

    if (
      lat === undefined ||
      lon === undefined
    ) {
      continue;
    }

    const name =
      tags.name ||
      tags["name:en"];

    if (!name) {
      continue;
    }

    const distance =
      calculateDistance(
        latitude,
        longitude,
        lat,
        lon
      );

    places.push({
      name,
      latitude: lat,
      longitude: lon,
      distance,
      address: buildAddress(tags),
      type: getPlaceType(tags),
      website: tags.website || "",
      phone: tags.phone || ""
    });
  }

  /*
    Remove duplicates.
  */

  const uniquePlaces =
    removeDuplicatePlaces(places);

  /*
    Closest first.
  */

  uniquePlaces.sort(
    (a, b) => a.distance - b.distance
  );

  return uniquePlaces.slice(0, 12);
}

/* -----------------------------
   DISTANCE
----------------------------- */

function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const earthRadius = 3958.8;

  const dLat =
    degreesToRadians(lat2 - lat1);

  const dLon =
    degreesToRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(degreesToRadians(lat1)) *
    Math.cos(degreesToRadians(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}

function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

/* -----------------------------
   ADDRESS
----------------------------- */

function buildAddress(tags) {
  const parts = [];

  if (tags["addr:housenumber"]) {
    parts.push(tags["addr:housenumber"]);
  }

  if (tags["addr:street"]) {
    parts.push(tags["addr:street"]);
  }

  if (tags["addr:city"]) {
    parts.push(tags["addr:city"]);
  }

  return parts.join(" ");
}

/* -----------------------------
   PLACE TYPE
----------------------------- */

function getPlaceType(tags) {
  if (tags.amenity) {
    return formatPlaceType(tags.amenity);
  }

  if (tags.shop) {
    return formatPlaceType(tags.shop);
  }

  if (tags.leisure) {
    return formatPlaceType(tags.leisure);
  }

  return "Place";
}

function formatPlaceType(type) {
  if (!type) return "Place";

  return type
    .replaceAll("_", " ")
    .replace(/\b\w/g, letter =>
      letter.toUpperCase()
    );
}

/* -----------------------------
   REMOVE DUPLICATES
----------------------------- */

function removeDuplicatePlaces(places) {
  const seen = new Set();

  return places.filter(place => {
    const key =
      `${place.name.toLowerCase()}-${Math.round(place.latitude * 10000)}-${Math.round(place.longitude * 10000)}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

/* -----------------------------
   RENDER PLACES
----------------------------- */

function renderNearbyPlaces(places) {
  const container =
    document.getElementById("placesList");

  if (!container) return;

  if (!places.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No places found nearby.</h3>
        <p>
          Try choosing another time or expanding
          your search area.
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML = "";

  places.forEach((place, index) => {
    const card =
      document.createElement("article");

    card.className = "place-card";

    const distance =
      place.distance < 0.1
        ? "Less than 0.1 mi"
        : `${place.distance.toFixed(1)} mi`;

    const mapsURL =
      `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;

    card.innerHTML = `
      <div class="place-photo-placeholder">
        ${getPlaceEmoji(place.type)}
      </div>

      <div class="place-content">

        <div class="place-top">
          <span class="place-type">
            ${escapeHTML(place.type)}
          </span>

          <span class="place-distance">
            📍 ${distance}
          </span>
        </div>

        <h3>
          ${escapeHTML(place.name)}
        </h3>

        ${
          place.address
            ? `<p class="place-address">
                ${escapeHTML(place.address)}
              </p>`
            : ""
        }

        <div class="place-actions">

          <button
            class="btn btn-primary place-select"
            data-index="${index}"
          >
            Choose this place
          </button>

          <a
            class="btn btn-secondary"
            href="${mapsURL}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Map
          </a>

        </div>

      </div>
    `;

    card
      .querySelector(".place-select")
      .addEventListener("click", () => {
        state.selectedPlace = place;

        renderFinalPlan();

        showScreen("final");
      });

    container.appendChild(card);
  });
}

/* -----------------------------
   PLACE EMOJIS
----------------------------- */

function getPlaceEmoji(type) {
  const lower =
    type.toLowerCase();

  if (lower.includes("cafe")) {
    return "☕";
  }

  if (lower.includes("restaurant")) {
    return "🍝";
  }

  if (lower.includes("pizza")) {
    return "🍕";
  }

  if (lower.includes("bakery")) {
    return "🥐";
  }

  if (lower.includes("park")) {
    return "🌳";
  }

  if (lower.includes("bar")) {
    return "🍹";
  }

  if (lower.includes("ice")) {
    return "🍦";
  }

  return "📍";
}

/* -----------------------------
   FINAL PLAN
----------------------------- */

function renderFinalPlan() {
  const container =
    document.getElementById("finalPlan");

  if (!container) return;

  const place =
    state.selectedPlace;

  if (!place) return;

  const date =
    state.dates.length
      ? formatDate(state.dates[0])
      : "Your chosen day";

  const distance =
    place.distance < 0.1
      ? "less than 0.1 miles away"
      : `${place.distance.toFixed(1)} miles away`;

  container.innerHTML = `
    <div class="final-plan-card">

      <span class="eyebrow">
        YOUR ROAM IS READY
      </span>

      <h2>
        ${escapeHTML(state.roamName)}
      </h2>

      <div class="final-details">

        <div>
          <strong>📅 Day</strong>
          <span>${date}</span>
        </div>

        <div>
          <strong>⏰ Time</strong>
          <span>
            ${escapeHTML(state.selectedResult)}
          </span>
        </div>

        <div>
          <strong>📍 Place</strong>
          <span>
            ${escapeHTML(place.name)}
          </span>
        </div>

        <div>
          <strong>💰 Budget</strong>
          <span>
            Around $${state.averageBudget} per person
          </span>
        </div>

        <div>
          <strong>🚶 Distance</strong>
          <span>${distance}</span>
        </div>

      </div>

      <p class="final-message">
        Hey everyone! 👋
        <br><br>
        We're roaming to
        <strong>${escapeHTML(place.name)}</strong>
        on ${date} at
        <strong>${escapeHTML(state.selectedResult)}</strong>.
        <br><br>
        See you there! 🇮🇹
      </p>

    </div>
  `;
}

/* -----------------------------
   FORMAT DATE
----------------------------- */

function formatDate(dateString) {
  const date =
    new Date(dateString + "T12:00:00");

  return date.toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric"
    }
  );
}

/* -----------------------------
   COPY PLAN
----------------------------- */

function copyPlan() {
  const place =
    state.selectedPlace;

  if (!place) return;

  const date =
    state.dates.length
      ? formatDate(state.dates[0])
      : "your chosen day";

  const message =
`🌿 ${state.roamName}

📅 ${date}
⏰ ${state.selectedResult}
📍 ${place.name}
💰 Around $${state.averageBudget} per person

Let's roam! 🇮🇹`;

  navigator.clipboard.writeText(message)
    .then(() => {
      alert("Plan copied! 🎉");
    })
    .catch(() => {
      alert(
        "Couldn't copy automatically. Try selecting the text manually."
      );
    });
}

/* -----------------------------
   SHARE PLAN
----------------------------- */

function sharePlan() {
  const place =
    state.selectedPlace;

  if (!place) return;

  const date =
    state.dates.length
      ? formatDate(state.dates[0])
      : "your chosen day";

  const message =
`🌿 ${state.roamName}

📅 ${date}
⏰ ${state.selectedResult}
📍 ${place.name}
💰 Around $${state.averageBudget} per person

Let's roam! 🇮🇹`;

  if (navigator.share) {
    navigator.share({
      title: state.roamName,
      text: message
    });
  } else {
    copyPlan();
  }
}

/* -----------------------------
   ESCAPE HTML
----------------------------- */

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

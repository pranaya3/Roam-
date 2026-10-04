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
  selectedPlace: null,

  places: []
};


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


document.addEventListener("DOMContentLoaded", () => {

  buildDates();

  buildTimes();

  loadSavedState();

});


function $(id) {

  return document.getElementById(id);

}


/* ------------------------------
   SCREEN NAVIGATION
------------------------------ */

function showScreen(id) {

  document
    .querySelectorAll(".screen")
    .forEach(screen => {
      screen.classList.remove("active");
    });


  const target = $(id);


  if (target) {

    target.classList.add("active");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }

}


/* ------------------------------
   START / RESET
------------------------------ */

function startRoam() {

  resetRoam();

  showScreen("create");

  setTimeout(() => {

    if ($("roamName")) {
      $("roamName").focus();
    }

  }, 100);

}


function resetRoam() {

  state.roamName = "";

  state.location = "";

  state.lat = null;

  state.lon = null;

  state.groupSize = 4;

  state.selectedDates = [];

  state.participantName = "";

  state.selectedTimes = [];

  state.budget = null;

  state.averageBudget = null;

  state.selectedTime = null;

  state.selectedPlace = null;

  state.places = [];


  $("roamName").value = "";

  $("location").value = "";

  $("groupSize").value = 4;

  $("participantName").value = "";

  $("locationStatus").textContent = "";


  document
    .querySelectorAll(".budget-option")
    .forEach(button => {
      button.classList.remove("selected");
    });


  $("budgetContinue").disabled = true;


  buildDates();

  buildTimes();

}


/* ------------------------------
   GROUP SIZE
------------------------------ */

function changeGroupSize(amount) {

  const input = $("groupSize");

  let value = Number(input.value) || 4;


  value += amount;


  value = Math.max(
    2,
    Math.min(50, value)
  );


  input.value = value;

  state.groupSize = value;

}


/* ------------------------------
   SAVE ROAM DETAILS
------------------------------ */

function saveRoamDetails() {

  const name =
    $("roamName").value.trim();


  const location =
    $("location").value.trim();


  const size =
    Math.max(
      2,
      Math.min(
        50,
        Number($("groupSize").value) || 4
      )
    );


  if (!name) {

    showToast(
      "Give your Roam a name."
    );

    return;

  }


  if (!location && state.lat === null) {

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


/* ------------------------------
   DATES
------------------------------ */

function buildDates() {

  const grid = $("dateGrid");


  if (!grid) {
    return;
  }


  grid.innerHTML = "";


  const today = new Date();


  for (let i = 0; i < 14; i++) {

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
        ${date.toLocaleDateString(
          undefined,
          {
            weekday: "short"
          }
        ).toUpperCase()}
      </small>

      <strong>
        ${date.getDate()}
      </strong>
    `;


    button.addEventListener(
      "click",
      () => {

        toggleDate(
          key,
          button
        );

      }
    );


    grid.appendChild(button);

  }

}


function toggleDate(
  key,
  button
) {

  if (
    state.selectedDates.includes(key)
  ) {

    state.selectedDates =
      state.selectedDates.filter(
        date => date !== key
      );


    button.classList.remove(
      "selected"
    );

  } else {

    state.selectedDates.push(key);

    button.classList.add(
      "selected"
    );

  }

}


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


/* ------------------------------
   TIMES
------------------------------ */

function buildTimes() {

  const grid =
    $("timeGrid");


  if (!grid) {
    return;
  }


  grid.innerHTML = "";


  timeOptions.forEach(time => {

    const button =
      document.createElement("button");


    button.type = "button";


    button.className =
      "time-option" +
      (
        state.selectedTimes.includes(time)
          ? " selected"
          : ""
      );


    button.textContent = time;


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


/* ------------------------------
   AVAILABILITY
------------------------------ */

function saveAvailability() {

  const name =
    $("participantName")
      .value
      .trim();


  if (!name) {

    showToast(
      "Enter your name."
    );

    return;

  }


  if (!state.selectedTimes.length) {

    showToast(
      "Choose at least one time."
    );

    return;

  }


  state.participantName =
    name;


  showScreen("budget");

}


/* ------------------------------
   BUDGET
------------------------------ */

function selectBudget(value) {

  state.budget = value;


  document
    .querySelectorAll(".budget-option")
    .forEach(button => {

      button.classList.toggle(
        "selected",
        Number(
          button.dataset.budget
        ) === value
      );

    });


  $("budgetContinue").disabled =
    false;

}


function finishBudget() {

  if (!state.budget) {

    showToast(
      "Choose a budget first."
    );

    return;

  }


  /*
    This front-end version uses the
    current user's budget as the
    displayed average.

    A database can be added later
    for multiple participants.
  */

  state.averageBudget =
    state.budget;


  $("averageBudget").textContent =
    `$${Math.round(
      state.averageBudget
    )}`;


  buildResults();

  showScreen("results");

}


/* ------------------------------
   RESULTS
------------------------------ */

function buildResults() {

  const list =
    $("resultsList");


  list.innerHTML = "";


  const dateLabels =
    state.selectedDates.map(
      formatDate
    );


  const times =
    state.selectedTimes.slice(
      0,
      3
    );


  times.forEach(
    (time, index) => {

      const date =
        dateLabels[
          index % dateLabels.length
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
            people · Good match
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
          () => {

            chooseTime(
              time,
              date
            );

          }
        );


      list.appendChild(card);

    }
  );


  if (!times.length) {

    list.innerHTML = `
      <div class="empty-state">
        No times selected yet.
      </div>
    `;

  }

}


/* ------------------------------
   CHOOSE TIME
------------------------------ */

async function chooseTime(
  time,
  dateLabel
) {

  state.selectedTime = {
    time,
    dateLabel
  };


  $("placesSubtitle").textContent =
    state.location
      ? `Spots near ${state.location}.`
      : "Spots near you.";


  showScreen("places");


  await loadNearbyPlaces();

}


/* ------------------------------
   NEARBY PLACES
------------------------------ */

async function loadNearbyPlaces() {

  const list =
    $("placesList");


  list.innerHTML = `
    <div class="empty-state">
      Finding nearby places…
    </div>
  `;


  /*
    If GPS exists, use it.
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
    Otherwise, geocode the
    typed location using
    OpenStreetMap Nominatim.
  */

  if (state.location) {

    try {

      const url =
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
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


/* ------------------------------
   OVERPASS
------------------------------ */

async function fetchOverpassPlaces(
  lat,
  lon
) {

  const query = `
    [out:json][timeout:12];

    (
      nwr["amenity"~"restaurant|cafe|bar|fast_food|cinema|theatre"]
      (around:5000,${lat},${lon});

      nwr["tourism"~"attraction|museum"]
      (around:5000,${lat},${lon});

      nwr["leisure"~"park|bowling_alley"]
      (around:5000,${lat},${lon});
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


          const latValue =
            item.lat ??
            item.center?.lat;


          const lonValue =
            item.lon ??
            item.center?.lon;


          return {

            name:
              tags.name ||
              "Unnamed place",

            type:
              prettyType(
                tags.amenity ||
                tags.tourism ||
                tags.leisure ||
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
              latValue,

            lon:
              lonValue

          };

        })

        .filter(
          item =>
            item.name !==
            "Unnamed place"
        )

        .filter(
          (item, index, array) =>
            array.findIndex(
              x =>
                x.name ===
                item.name
            ) === index
        )

        .slice(0, 9);


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


/* ------------------------------
   DISPLAY PLACES
------------------------------ */

function renderPlaces(
  places
) {

  const list =
    $("placesList");


  list.innerHTML = "";


  if (!places.length) {

    list.innerHTML = `
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
          ${placeIcon(place.type)}
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
          () => {

            choosePlace(
              place
            );

          }
        );


      list.appendChild(card);

    }
  );

}


/* ------------------------------
   CHOOSE PLACE
------------------------------ */

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


/* ------------------------------
   FINAL PLAN
------------------------------ */

function buildFinalPlan() {

  const plan =
    $("finalPlan");


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


/* ------------------------------
   PLAN TEXT
------------------------------ */

function makePlanText() {

  const place =
    state.selectedPlace;


  return `${state.roamName}

${state.selectedTime?.dateLabel || "Date TBD"} · ${state.selectedTime?.time || "Time TBD"}

${place?.name || state.location}

${state.groupSize} people · Around $${Math.round(
    state.averageBudget ||
    state.budget ||
    0
  )} per person

Made with Roam.`;

}


/* ------------------------------
   COPY
------------------------------ */

async function copyPlan() {

  const text =
    makePlanText();


  try {

    await navigator.clipboard.writeText(
      text
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


/* ------------------------------
   SHARE
------------------------------ */

async function sharePlan() {

  const text =
    makePlanText();


  if (navigator.share) {

    try {

      await navigator.share({

        title:
          state.roamName ||
          "My Roam",

        text:
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


/* ------------------------------
   GPS LOCATION
------------------------------ */

function getUserLocation() {

  if (!navigator.geolocation) {

    showToast(
      "Location isn't supported by this browser."
    );

    return;

  }


  $("locationStatus").textContent =
    "Finding your location…";


  navigator.geolocation.getCurrentPosition(

    async position => {

      state.lat =
        position.coords.latitude;


      state.lon =
        position.coords.longitude;


      try {

        const url =
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${state.lat}&lon=${state.lon}`;


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


        $("location").value =
          label;


        state.location =
          label;


        $("locationStatus").textContent =
          "Location found ✓";

      } catch {

        $("location").value =
          "My current location";


        state.location =
          "My current location";


        $("locationStatus").textContent =
          "Location found ✓";

      }

    },


    error => {

      $("locationStatus").textContent =
        "Location unavailable. You can type a city instead.";


      showToast(
        "Couldn't access your location."
      );


      console.warn(error);

    },


    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }

  );

}


/* ------------------------------
   HELPERS
------------------------------ */

function formatDate(
  key
) {

  const date =
    new Date(
      `${key}T12:00:00`
    );


  return date.toLocaleDateString(
    undefined,
    {
      weekday: "short",
      month: "short",
      day: "numeric"
    }
  );

}


function prettyType(
  type
) {

  return type
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      char =>
        char.toUpperCase()
    );

}


function placeIcon(
  type
) {

  const value =
    type.toLowerCase();


  if (
    value.includes(
      "restaurant"
    )
  ) return "🍽️";


  if (
    value.includes(
      "cafe"
    )
  ) return "☕";


  if (
    value.includes(
      "bar"
    )
  ) return "🍸";


  if (
    value.includes(
      "cinema"
    )
  ) return "🎬";


  if (
    value.includes(
      "museum"
    )
  ) return "🏛️";


  if (
    value.includes(
      "park"
    )
  ) return "🌳";


  if (
    value.includes(
      "theatre"
    )
  ) return "🎭";


  return "✦";

}


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


/* ------------------------------
   TOAST
------------------------------ */

function showToast(
  message
) {

  const toast =
    $("toast");


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

        toast.classList.remove(
          "show"
        );

      },
      2500
    );

}


/* ------------------------------
   SECURITY
------------------------------ */

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


/* ------------------------------
   LOCAL STORAGE
------------------------------ */

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


    $("groupSize").value =
      size;

  }


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
                $("groupSize").value
              ) || 4
            )
          );


        $("groupSize").value =
          state.groupSize;


        localStorage.setItem(
          "roamGroupSize",
          state.groupSize
        );

      }
    );

}

/* =========================================================
   ROAM
   Main application logic
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://vvbgksamdlhkkchyhlyl.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_WaNsM-y0X9VH8pgnAQYFkg_2o68bx6S";

const db =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   STATE
========================================================= */

const state = {

  roomId: null,

  roomCode: null,

  organizerToken: null,

  participantToken: null,

  joinedRoom: false,

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
      "cafe"
    ]
  },

  movies: {
    label: "Movies",
    searchTerms: [
      "cinema"
    ]
  },

  bowling: {
    label: "Bowling",
    searchTerms: [
      "bowling_alley"
    ]
  },

  coffee: {
    label: "Coffee",
    searchTerms: [
      "cafe"
    ]
  },

  outdoors: {
    label: "Outdoors",
    searchTerms: [
      "park",
      "garden"
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
      "bowling_alley"
    ]
  },

  other: {
    label: "Something else",
    searchTerms: [
      "attraction",
      "community_centre"
    ]
  }

};


/* =========================================================
   SCREEN NAVIGATION
========================================================= */

function showScreen(id) {

  document
    .querySelectorAll(".screen")
    .forEach(screen => {

      screen.classList.remove(
        "active"
      );

    });


  const screen =
    document.getElementById(id);


  if (!screen) {
    console.error(
      "Screen not found:",
      id
    );

    return;
  }


  screen.classList.add(
    "active"
  );


  updateProgress(id);


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


function updateProgress(id) {

  const progress =
    document.getElementById(
      "progressText"
    );


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


  progress.textContent =
    labels[id] || "ROAM";

}


/* =========================================================
   START / RESET
========================================================= */

function startRoam() {

  state.roomId = null;

  state.roomCode = null;

  state.organizerToken =
    generateToken();

  state.participantToken =
    null;

  state.joinedRoom = false;

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


  document.getElementById(
    "roamName"
  ).value = "";


  document.getElementById(
    "location"
  ).value = "";


  document.getElementById(
    "participantName"
  ).value = "";


  document.getElementById(
    "groupSizeDisplay"
  ).textContent =
    state.groupSize;


  document
    .querySelectorAll(
      ".budget-card"
    )
    .forEach(card => {

      card.classList.remove(
        "selected"
      );

    });


  document.getElementById(
    "budgetContinue"
  ).disabled = true;


  renderDates();


  showScreen(
    "details"
  );

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


  document.getElementById(
    "groupSizeDisplay"
  ).textContent =
    state.groupSize;

}


/* =========================================================
   DETAILS + CREATE ROOM
========================================================= */

async function saveRoamDetails() {

  const name =
    document
      .getElementById(
        "roamName"
      )
      .value
      .trim();


  const location =
    document
      .getElementById(
        "location"
      )
      .value
      .trim();


  if (!name) {

    showToast(
      "Give your plan a name."
    );

    return;
  }


  if (
    !location &&
    state.latitude === null
  ) {

    showToast(
      "Add a location first."
    );

    return;
  }


  state.roamName =
    name;

  state.location =
    location;


  /*
    If this is an existing joined Roam,
    don't create another room.
  */

  if (state.joinedRoom) {

    renderDates();

    showScreen(
      "dates"
    );

    return;
  }


  try {

    const code =
      await createUniqueRoomCode();


    const {
      data,
      error
    } =
      await db
        .from("rooms")
        .insert({

          code,

          name:
            state.roamName,

          location_text:
            state.location,

          lat:
            state.latitude,

          lng:
            state.longitude,

          group_size:
            state.groupSize,

          candidate_dates:
            [],

          activity:
            null,

          organizer_token:
            state.organizerToken

        })
        .select()
        .single();


    if (error) {
      throw error;
    }


    state.roomId =
      data.id;

    state.roomCode =
      data.code;


    showToast(
      `Roam created! Code: ${state.roomCode}`
    );


    renderDates();


    showScreen(
      "dates"
    );


  } catch (error) {

    console.error(
      "CREATE ROOM ERROR:",
      error
    );


    showToast(
      "Couldn't create your Roam."
    );

  }

}


async function createUniqueRoomCode() {

  for (
    let attempt = 0;
    attempt < 10;
    attempt++
  ) {

    const code =
      generateRoomCode();


    const {
      data,
      error
    } =
      await db
        .from("rooms")
        .select("id")
        .eq(
          "code",
          code
        )
        .maybeSingle();


    if (error) {
      throw error;
    }


    if (!data) {
      return code;
    }

  }


  throw new Error(
    "Could not create unique room code."
  );

}


function generateRoomCode() {

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


function generateToken() {

  if (
    window.crypto &&
    window.crypto.randomUUID
  ) {

    return (
      window.crypto.randomUUID() +
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

function renderDates() {

  const grid =
    document.getElementById(
      "dateGrid"
    );


  if (!grid) {
    return;
  }


  grid.innerHTML = "";


  const today =
    new Date();


  for (
    let i = 0;
    i < 10;
    i++
  ) {

    const date =
      new Date(today);


    date.setDate(
      today.getDate() + i
    );


    const key =
      date
        .toISOString()
        .split("T")[0];


    const day =
      date.toLocaleDateString(
        undefined,
        {
          weekday: "short"
        }
      );


    const month =
      date.toLocaleDateString(
        undefined,
        {
          month: "short"
        }
      );


    const card =
      document.createElement(
        "button"
      );


    card.type =
      "button";


    card.className =
      "date-card";


    if (
      state.selectedDates
        .includes(key)
    ) {

      card.classList.add(
        "selected"
      );

    }


    card.innerHTML = `
      <small>
        ${day.toUpperCase()}
      </small>

      <strong>
        ${date.getDate()}
      </strong>

      <span>
        ${month}
      </span>
    `;


    card.addEventListener(
      "click",
      () => {

        if (
          state.selectedDates
            .includes(key)
        ) {

          state.selectedDates =
            state.selectedDates
              .filter(
                date =>
                  date !== key
              );

          card.classList.remove(
            "selected"
          );

        } else {

          state.selectedDates.push(
            key
          );

          card.classList.add(
            "selected"
          );

        }

      }
    );


    grid.appendChild(
      card
    );

  }

}


async function saveDates() {

  if (
    state.selectedDates
      .length === 0
  ) {

    showToast(
      "Pick at least one day."
    );

    return;
  }


  if (
    state.roomId &&
    !state.joinedRoom
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
          state.roomId
        );


    if (error) {

      console.error(
        "DATE SAVE ERROR:",
        error
      );

    }

  }


  renderTimes();


  showScreen(
    "availability"
  );

}


/* =========================================================
   TIMES
========================================================= */

function renderTimes() {

  const grid =
    document.getElementById(
      "timeGrid"
    );


  grid.innerHTML = "";


  state.selectedTimes =
    [];


  timeOptions.forEach(
    time => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "time-card";


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
                  item =>
                    item !== time
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

function saveAvailability() {

  const name =
    document
      .getElementById(
        "participantName"
      )
      .value
      .trim();


  if (!name) {

    showToast(
      "Add your name."
    );

    return;
  }


  if (
    state.selectedTimes
      .length === 0
  ) {

    showToast(
      "Pick at least one time."
    );

    return;
  }


  state.participantName =
    name;


  showScreen(
    "budget"
  );

}


/* =========================================================
   BUDGET
========================================================= */

function selectBudget(
  button,
  amount
) {

  state.budget =
    Number(amount);


  document
    .querySelectorAll(
      ".budget-card"
    )
    .forEach(card => {

      card.classList.remove(
        "selected"
      );

    });


  button.classList.add(
    "selected"
  );


  document.getElementById(
    "budgetContinue"
  ).disabled = false;

}


async function finishBudget() {

  if (!state.budget) {

    showToast(
      "Pick a budget."
    );

    return;
  }


  /*
    Save participant information.
  */

  if (
    state.roomId &&
    state.participantName
  ) {

    try {

      state.participantToken =
        state.participantToken ||
        generateToken();


      const {
        error
      } =
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
                state.selectedTimes

            },

            budget:
              state.budget

          });


      if (error) {

        console.error(
          "PARTICIPANT ERROR:",
          error
        );

      }

    } catch (error) {

      console.error(
        "PARTICIPANT SAVE ERROR:",
        error
      );

    }

  }


  showScreen(
    "activity"
  );

}


/* =========================================================
   ACTIVITY
========================================================= */

async function selectActivity(
  activity
) {

  state.activity =
    activity;


  if (
    state.roomId
  ) {

    const {
      error
    } =
      await db
        .from("rooms")
        .update({
          activity
        })
        .eq(
          "id",
          state.roomId
        );


    if (error) {

      console.error(
        "ACTIVITY SAVE ERROR:",
        error
      );

    }

  }


  generateResults();


  showScreen(
    "results"
  );

}


/* =========================================================
   RESULTS
========================================================= */

async function generateResults() {

  const list =
    document.getElementById(
      "resultsList"
    );


  list.innerHTML = "";


  /*
    If this is a real room,
    calculate times using participants.
  */

  let results = [];


  if (state.roomId) {

    try {

      const {
        data,
        error
      } =
        await db
          .from("participants")
          .select(
            "availability"
          )
          .eq(
            "room_id",
            state.roomId
          );


      if (
        !error &&
        data &&
        data.length
      ) {

        const scores = {};


        data.forEach(
          participant => {

            const availability =
              participant.availability ||
              {};

            const times =
              availability.times ||
              [];

            times.forEach(
              time => {

                scores[time] =
                  (
                    scores[time] ||
                    0
                  ) + 1;

              }
            );

          }
        );


        const ranked =
          Object.entries(
            scores
          )
            .sort(
              (a, b) =>
                b[1] - a[1]
            )
            .slice(0, 3);


        ranked.forEach(
          ([time, count]) => {

            results.push({
              date:
                state.selectedDates[0],

              time,

              count

            });

          }
        );

      }

    } catch (error) {

      console.error(
        "RESULT ERROR:",
        error
      );

    }

  }


  /*
    Fallback if there isn't enough
    group data yet.
  */

  if (
    results.length === 0
  ) {

    const dates =
      state.selectedDates.length
        ? state.selectedDates
        : [
            new Date()
              .toISOString()
              .split("T")[0]
          ];


    const times =
      state.selectedTimes.length
        ? state.selectedTimes
        : [
            "7:00 PM"
          ];


    dates
      .slice(0, 3)
      .forEach(
        (date, index) => {

          results.push({

            date,

            time:
              times[
                index %
                times.length
              ],

            count:
              1

          });

        }
      );

  }


  state.selectedTime =
    results[0];


  results.forEach(
    (result, index) => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "result-card";


      if (index === 0) {

        card.classList.add(
          "best"
        );

      }


      const date =
        new Date(
          `${result.date}T12:00:00`
        );


      const day =
        date.toLocaleDateString(
          undefined,
          {
            weekday: "long"
          }
        );


      const dateText =
        date.toLocaleDateString(
          undefined,
          {
            month: "short",
            day: "numeric"
          }
        );


      card.innerHTML = `

        <div class="result-day">
          ${day.toUpperCase()}
          ·
          ${dateText.toUpperCase()}
        </div>

        <div class="result-time">
          ${result.time}
        </div>

        <div class="result-meta">
          ${result.count}
          ${result.count === 1 ? "person" : "people"}
          available
          ·
          ${activityData[state.activity]?.label || "Hangout"}
        </div>

      `;


      list.appendChild(
        card
      );

    }
  );


  /*
    Calculate average budget.
  */

  await loadAverageBudget();

}


/* =========================================================
   AVERAGE BUDGET
========================================================= */

async function loadAverageBudget() {

  const element =
    document.getElementById(
      "averageBudget"
    );


  if (!state.roomId) {

    element.textContent =
      state.budget
        ? `$${state.budget}`
        : "—";

    return;
  }


  try {

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
      throw error;
    }


    const average =
      Array.isArray(data)
        ? data[0]?.average_budget
        : data?.average_budget;


    element.textContent =
      average !== null &&
      average !== undefined
        ? `$${Math.round(
            Number(average)
          )}`
        : "—";


  } catch (error) {

    console.error(
      "AVERAGE BUDGET ERROR:",
      error
    );


    element.textContent =
      state.budget
        ? `$${state.budget}`
        : "—";

  }

}


/* =========================================================
   PLACES
========================================================= */

async function showPlaces() {

  showScreen(
    "places"
  );


  const list =
    document.getElementById(
      "placesList"
    );


  const loading =
    document.getElementById(
      "placesLoading"
    );


  list.innerHTML =
    "";


  loading.classList.add(
    "active"
  );


  const subtitle =
    document.getElementById(
      "placesSubtitle"
    );


  subtitle.textContent =
    state.location
      ? `Places near ${state.location}.`
      : "Real places near you.";


  try {

    let latitude =
      state.latitude;

    let longitude =
      state.longitude;


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
        "Location not found."
      );

    }


    const places =
      await findNearbyPlaces(
        latitude,
        longitude,
        state.activity
      );


    loading.classList.remove(
      "active"
    );


    renderPlaces(
      places
    );


  } catch (error) {

    console.error(
      "PLACES ERROR:",
      error
    );


    loading.classList.remove(
      "active"
    );


    renderFallbackPlaces();

  }

}


/* =========================================================
   GEOCODING
========================================================= */

async function geocodeLocation(
  location
) {

  if (!location) {
    return null;
  }


  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({

      q:
        location,

      format:
        "json",

      limit:
        "1"

    });


  const response =
    await fetch(url);


  if (!response.ok) {
    throw new Error(
      "Geocoding failed."
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

    lon:
      Number(
        data[0].lon
      )

  };

}


/* =========================================================
   NEARBY PLACES
========================================================= */

async function findNearbyPlaces(
  latitude,
  longitude,
  activity
) {

  const config =
    activityData[activity] ||
    activityData.other;


  const queries =
    config.searchTerms
      .map(
        term => `

          nwr[
            amenity=${term}
          ](
            around:7000,
            ${latitude},
            ${longitude}
          );

        `
      )
      .join("");


  const query = `

    [out:json][timeout:20];

    (
      ${queries}
    );

    out center tags;

  `;


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
      "Overpass request failed."
    );

  }


  const json =
    await response.json();


  return cleanPlaces(
    json.elements || [],
    latitude,
    longitude
  );

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
        tags.name;


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


      places.push({

        name,

        category:
          tags.amenity ||
          tags.leisure ||
          tags.tourism ||
          "Place",

        address:
          tags["addr:street"]
            ? `${tags["addr:housenumber"] || ""} ${tags["addr:street"]}`.trim()
            : "Nearby",

        distance:
          lat !== undefined &&
          lon !== undefined
            ? calculateDistance(
                userLat,
                userLon,
                lat,
                lon
              )
            : null,

        lat,

        lon

      });

    }
  );


  places.sort(
    (a, b) =>
      (a.distance ?? 999) -
      (b.distance ?? 999)
  );


  return places.slice(
    0,
    9
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
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      toRadians(lat1)
    ) *
    Math.cos(
      toRadians(lat2)
    ) *
    Math.sin(dLon / 2) ** 2;


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


  list.innerHTML =
    "";


  if (!places.length) {

    renderFallbackPlaces();

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
          />

        </div>


        <div class="place-content">

          <small>
            ${escapeHtml(
              formatCategory(
                place.category
              )
            )}
          </small>


          <h3>
            ${escapeHtml(
              place.name
            )}
          </h3>


          <p class="place-info">
            ${distance}
            ·
            ${escapeHtml(
              place.address
            )}
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
        .querySelector(
          ".place-action"
        )
        .addEventListener(
          "click",
          () => {

            choosePlace(
              place
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
   FALLBACK PLACES
========================================================= */

function renderFallbackPlaces() {

  const list =
    document.getElementById(
      "placesList"
    );


  const label =
    activityData[
      state.activity
    ]?.label ||
    "Things to do";


  const names = {

    eat: [
      "Nearby restaurant",
      "Local food spot",
      "Restaurant nearby"
    ],

    movies: [
      "Nearby cinema",
      "Local theater",
      "Movie house"
    ],

    bowling: [
      "Nearby bowling alley",
      "Bowling center",
      "Local bowling"
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
      "Game lounge",
      "Activity center"
    ],

    other: [
      "Nearby activity",
      "Local attraction",
      "Something to explore"
    ]

  };


  const choices =
    names[
      state.activity
    ] ||
    names.other;


  list.innerHTML =
    choices
      .map(
        (name, index) => `

          <article class="place-card">

            <div class="place-image">

              <img
                src="${getPlaceImage(
                  state.activity,
                  index
                )}"
                alt="${name}"
              />

            </div>

            <div class="place-content">

              <small>
                ${label}
              </small>

              <h3>
                ${name}
              </h3>

              <p class="place-info">
                Search for this activity nearby.
              </p>

              <button
                class="place-action"
                type="button"
                onclick="choosePlace({
                  name: '${escapeJs(name)}',
                  category: '${escapeJs(label)}',
                  address: 'Nearby',
                  distance: null
                })"
              >
                Choose this →
              </button>

            </div>

          </article>

        `
      )
      .join("");

}


/* =========================================================
   PLACE IMAGES
========================================================= */

function getPlaceImage(
  activity,
  index
) {

  const images = {

    eat:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",

    movies:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80",

    bowling:
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80",

    coffee:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80",

    outdoors:
      "https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=900&q=80",

    arts:
      "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=80",

    games:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80",

    other:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80"

  };


  return (
    images[activity] ||
    images.other
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

  const date =
    state.selectedTime?.date ||
    state.selectedDates[0];


  const time =
    state.selectedTime?.time ||
    state.selectedTime?.time ||
    state.selectedTimes[0] ||
    "7:00 PM";


  const dateObject =
    new Date(
      `${date}T12:00:00`
    );


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
    activityData[
      state.activity
    ]?.label ||
    "Hangout";


  document.getElementById(
    "finalPlace"
  ).textContent =
    state.selectedPlace?.name ||
    "Your chosen place";


  document.getElementById(
    "finalPeople"
  ).textContent =
    `${state.groupSize} PEOPLE`;


  document.getElementById(
    "finalBudget"
  ).textContent =
    `~$${state.budget || 0} EACH`;

}


/* =========================================================
   COPY / SHARE
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
    new Date(
      `${date}T12:00:00`
    );


  const dateText =
    dateObject.toLocaleDateString(
      undefined,
      {
        weekday: "long",
        month: "long",
        day: "numeric"
      }
    );


  const activity =
    activityData[
      state.activity
    ]?.label ||
    "Hangout";


  const place =
    state.selectedPlace?.name ||
    "our chosen place";


  return `
Roam plan ✦

${state.roamName}

${dateText}
${time}

${activity}
${place}

${state.groupSize} people
About $${state.budget || 0} each

Roam code: ${state.roomCode || "—"}
  `.trim();

}


async function copyPlan() {

  const text =
    getPlanText();


  try {

    await navigator.clipboard.writeText(
      text
    );


    showToast(
      "Plan copied."
    );


  } catch {

    window.prompt(
      "Copy your Roam plan:",
      text
    );

  }

}


async function sharePlan() {

  const text =
    getPlanText();


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

    } catch {

      return;

    }

  }


  copyPlan();

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

        }


        status.textContent =
          "Location found.";

      } catch {

        status.textContent =
          "Location found.";

      }

    },

    error => {

      console.error(
        "LOCATION ERROR:",
        error
      );


      status.textContent =
        "Couldn't access your location.";


      showToast(
        "Enter your city instead."
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


async function reverseGeocode(
  latitude,
  longitude
) {

  const url =
    "https://nominatim.openstreetmap.org/reverse?" +
    new URLSearchParams({

      lat:
        latitude,

      lon:
        longitude,

      format:
        "json"

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
    null
  );

}


/* =========================================================
   JOIN A ROAM
========================================================= */

async function showJoinMessage() {

  console.log(
    "ROAM: Join clicked"
  );


  const codeInput =
    window.prompt(
      "Enter the 5-character Roam code:"
    );


  if (!codeInput) {
    return;
  }


  const code =
    codeInput
      .trim()
      .toUpperCase();


  if (
    !/^[A-Z0-9]{5}$/.test(code)
  ) {

    showToast(
      "Roam codes are 5 characters."
    );

    return;

  }


  showToast(
    "Finding that Roam..."
  );


  try {

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


    console.log(
      "ROAM JOIN RESPONSE:",
      data,
      error
    );


    if (error) {

      console.error(
        "JOIN ERROR:",
        error
      );


      showToast(
        "Couldn't find that Roam."
      );


      return;

    }


    if (!data) {

      showToast(
        "That Roam code doesn't exist."
      );


      return;

    }


    /*
      Load room information.
    */

    state.roomId =
      data.id;

    state.roomCode =
      data.code;

    state.roamName =
      data.name;

    state.location =
      data.location_text;

    state.latitude =
      data.lat;

    state.longitude =
      data.lng;

    state.groupSize =
      data.group_size;

    state.selectedDates =
      Array.isArray(
        data.candidate_dates
      )
        ? data.candidate_dates
        : [];

    state.activity =
      data.activity || "";

    state.joinedRoom =
      true;

    state.participantToken =
      generateToken();


    /*
      Put room information
      into the page.
    */

    document.getElementById(
      "roamName"
    ).value =
      state.roamName;


    document.getElementById(
      "location"
    ).value =
      state.location;


    document.getElementById(
      "groupSizeDisplay"
    ).textContent =
      state.groupSize;


    /*
      If the organizer already
      selected dates, use them.
    */

    renderDates();


    showToast(
      `Joined ${state.roamName}!`
    );


    showScreen(
      "availability"
    );


  } catch (error) {

    console.error(
      "JOIN CRASHED:",
      error
    );


    showToast(
      "Something went wrong joining."
    );

  }

}


/* =========================================================
   UTILITIES
========================================================= */

function formatCategory(
  category
) {

  return String(
    category || "Place"
  )
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


function escapeHtml(
  value
) {

  return String(
    value || ""
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


function escapeJs(
  value
) {

  return String(
    value || ""
  )
    .replaceAll(
      "\\",
      "\\\\"
    )
    .replaceAll(
      "'",
      "\\'"
    );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer;


function showToast(
  message
) {

  const toast =
    document.getElementById(
      "toast"
    );


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
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2600
    );

}


/* =========================================================
   STARTUP
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    document.getElementById(
      "groupSizeDisplay"
    ).textContent =
      state.groupSize;


    renderDates();


    updateProgress(
      "home"
    );

  }
);


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.showScreen =
  showScreen;

window.startRoam =
  startRoam;

window.changeGroupSize =
  changeGroupSize;

window.saveRoamDetails =
  saveRoamDetails;

window.saveDates =
  saveDates;

window.saveAvailability =
  saveAvailability;

window.selectBudget =
  selectBudget;

window.finishBudget =
  finishBudget;

window.selectActivity =
  selectActivity;

window.showPlaces =
  showPlaces;

window.choosePlace =
  choosePlace;

window.copyPlan =
  copyPlan;

window.sharePlan =
  sharePlan;

window.getUserLocation =
  getUserLocation;

window.showJoinMessage =
  showJoinMessage;

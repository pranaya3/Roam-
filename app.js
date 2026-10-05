/* =========================================================
   ROAM
   Supabase-powered group hangout planner
   ========================================================= */


/* =========================================================
   SUPABASE SETUP
   ========================================================= */

const SUPABASE_URL =
  "https://vvbgksamdlhkkchyhlyl.supabase.co";

/*
  IMPORTANT:

  Replace the value below with your Supabase
  PUBLISHABLE key.

  It should look similar to:

  sb_publishable_...

  Do NOT use a secret/service-role key here.
*/

const SUPABASE_KEY =
  "sb_publishable_WaNsM-y0X9VH8pgnAQYFkg_2o68bx6S";


const supabaseClient =
  window.supabase &&
  SUPABASE_KEY !==
    "sb_publishable_WaNsM-y0X9VH8pgnAQYFkg_2o68bx6S"
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      )
    : null;


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

  activity: null,

  averageBudget: null,

  selectedTime: null,

  selectedPlace: null,

  places: [],

  roomCode: null,

  roomId: null,

  organizerToken: null,

  participantId: null,

  joinedRoom: false

};


/* =========================================================
   ACTIVITIES
   ========================================================= */

const activities = [

  {
    id: "food",
    name: "Food",
    desc: "Restaurants & bites",
    emoji: "🍝",
    img: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=800&q=80"
  },

  {
    id: "coffee",
    name: "Coffee",
    desc: "Cafés & cozy spots",
    emoji: "☕",
    img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"
  },

  {
    id: "movies",
    name: "Movies",
    desc: "Catch a film",
    emoji: "🎬",
    img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80"
  },

  {
    id: "bowling",
    name: "Bowling",
    desc: "A little competition",
    emoji: "🎳",
    img: "https://images.unsplash.com/photo-1519671282429-b44660ead0a7?auto=format&fit=crop&w=800&q=80"
  },

  {
    id: "outdoors",
    name: "Outdoors",
    desc: "Parks & fresh air",
    emoji: "🌿",
    img: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80"
  },

  {
    id: "arts",
    name: "Arts",
    desc: "Museums & galleries",
    emoji: "🎨",
    img: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=800&q=80"
  },

  {
    id: "games",
    name: "Games",
    desc: "Arcades & activities",
    emoji: "🕹️",
    img: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80"
  },

  {
    id: "other",
    name: "Surprise me",
    desc: "Show us something fun",
    emoji: "✨",
    img: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80"
  }

];


const timeOptions = [
  "10:00 AM",
  "12:00 PM",
  "2:00 PM",
  "4:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM"
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

    renderActivities();

    if (!supabaseClient) {

      console.warn(
        "Supabase is not configured. Add your publishable key."
      );

    }

  }
);


/* =========================================================
   SCREEN NAVIGATION
   ========================================================= */

function showScreen(id) {

  document
    .querySelectorAll(".screen")
    .forEach(screen =>
      screen.classList.remove("active")
    );


  const target = $(id);

  if (!target) return;


  target.classList.add("active");


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


function goHome() {

  showScreen("home");

}


function startRoam() {

  resetState();

  showScreen("create");


  setTimeout(
    () => $("roamName")?.focus(),
    150
  );

}


function openJoin() {

  if ($("joinCode")) {

    $("joinCode").value = "";

  }


  showScreen("join");


  setTimeout(
    () => $("joinCode")?.focus(),
    150
  );

}


/* =========================================================
   RESET
   ========================================================= */

function resetState() {

  Object.assign(
    state,
    {

      roamName: "",

      location: "",

      lat: null,

      lon: null,

      groupSize: 4,

      selectedDates: [],

      participantName: "",

      selectedTimes: [],

      budget: null,

      activity: null,

      averageBudget: null,

      selectedTime: null,

      selectedPlace: null,

      places: [],

      roomCode: null,

      roomId: null,

      organizerToken: null,

      participantId: null,

      joinedRoom: false

    }
  );


  [
    "roamName",
    "location",
    "participantName"
  ].forEach(id => {

    if ($(id)) {

      $(id).value = "";

    }

  });


  if ($("groupSize")) {

    $("groupSize").value = 4;

  }


  if ($("locationStatus")) {

    $("locationStatus").textContent = "";

  }


  document
    .querySelectorAll(".budget-option")
    .forEach(option =>
      option.classList.remove("selected")
    );


  if ($("budgetContinue")) {

    $("budgetContinue").disabled = true;

  }


  if ($("activityContinue")) {

    $("activityContinue").disabled = true;

  }


  buildDates();

  buildTimes();

  renderActivities();

}


/* =========================================================
   CREATE ROAM
   ========================================================= */

function changeGroupSize(delta) {

  const input = $("groupSize");

  if (!input) return;


  const value =
    Math.max(
      2,
      Math.min(
        50,
        (Number(input.value) || 4) + delta
      )
    );


  input.value = value;

  state.groupSize = value;

}


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
        Number(
          $("groupSize")?.value
        ) || 4
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
    location ||
    "Current location";

  state.groupSize = size;


  buildDates();

  showScreen("dates");

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

  today.setHours(
    12,
    0,
    0,
    0
  );


  for (
    let i = 0;
    i < 14;
    i++
  ) {

    const date =
      new Date(today);

    date.setDate(
      today.getDate() + i
    );


    const key =
      localDateKey(date);


    const button =
      document.createElement(
        "button"
      );


    button.type = "button";


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


    button.onclick =
      () => toggleDate(
        key,
        button
      );


    grid.appendChild(
      button
    );

  }

}


function localDateKey(date) {

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

}


function toggleDate(
  key,
  button
) {

  if (
    state.selectedDates.includes(
      key
    )
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
   AVAILABILITY
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
          state.selectedTimes.includes(
            time
          )
            ? " selected"
            : ""
        );


      button.textContent =
        time;


      button.onclick =
        () => {

          if (
            state.selectedTimes.includes(
              time
            )
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

        };


      grid.appendChild(
        button
      );

    }
  );

}


/*
  Save participant information.

  If this is a joined Roam,
  also save the participant
  to Supabase.
*/

async function saveAvailability() {

  const name =
    $("participantName")?.value.trim();


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


  /*
    If joining an existing Roam,
    save this participant.
  */

  if (
    state.joinedRoom &&
    state.roomId
  ) {

    const saved =
      await saveParticipantToSupabase();


    if (!saved) {

      return;

    }

  }


  showScreen("budget");

}


/* =========================================================
   BUDGET
   ========================================================= */

function selectBudget(value) {

  state.budget =
    Number(value);


  document
    .querySelectorAll(
      ".budget-option"
    )
    .forEach(button => {

      button.classList.toggle(
        "selected",
        Number(
          button.dataset.budget
        ) ===
          state.budget
      );

    });


  if ($("budgetContinue")) {

    $("budgetContinue").disabled =
      false;

  }

}


async function finishBudget() {

  if (!state.budget) {

    showToast(
      "Choose a budget first."
    );

    return;

  }


  state.averageBudget =
    state.budget;


  /*
    For joined participants,
    update their budget.
  */

  if (
    state.joinedRoom &&
    state.participantId
  ) {

    const updated =
      await updateParticipantBudget();


    if (!updated) {

      return;

    }

  }


  renderActivities();

  showScreen(
    "activity"
  );

}


/* =========================================================
   ACTIVITIES
   ========================================================= */

function renderActivities() {

  const grid =
    $("activityGrid");

  if (!grid) return;


  grid.innerHTML = "";


  activities.forEach(
    activity => {

      const card =
        document.createElement(
          "button"
        );


      card.type = "button";


      card.className =
        "activity-card" +
        (
          state.activity ===
          activity.id
            ? " selected"
            : ""
        );


      card.innerHTML = `

        <img
          src="${activity.img}"
          alt="${escapeHtml(
            activity.name
          )}"
          loading="lazy"
        >

        <div>

          <strong>
            ${activity.emoji}
            ${activity.name}
          </strong>

          <span>
            ${activity.desc}
          </span>

        </div>

      `;


      card.onclick =
        () =>
          selectActivity(
            activity.id
          );


      grid.appendChild(
        card
      );

    }
  );

}


function selectActivity(id) {

  state.activity =
    id;


  document
    .querySelectorAll(
      ".activity-card"
    )
    .forEach(
      (card, index) => {

        card.classList.toggle(
          "selected",
          activities[index].id === id
        );

      }
    );


  if ($("activityContinue")) {

    $("activityContinue").disabled =
      false;

  }

}


/*
  Organizer finishes setup.

  This creates the actual
  Supabase room and gives
  the organizer a real code.
*/

async function finishActivity() {

  if (!state.activity) {

    showToast(
      "Pick an activity."
    );

    return;

  }


  const created =
    await createRoomInSupabase();


  if (!created) {

    return;

  }


  buildResults();

  showScreen(
    "results"
  );

}


/* =========================================================
   CREATE ROOM IN SUPABASE
   ========================================================= */

async function createRoomInSupabase() {

  if (!supabaseClient) {

    showToast(
      "Supabase isn't connected yet."
    );

    console.error(
      "Add your Supabase publishable key to app.js."
    );

    return false;

  }


  /*
    Generate a readable word code.
  */

  const code =
    await generateUniqueRoomCode();


  if (!code) {

    showToast(
      "Couldn't create a Roam code. Try again."
    );

    return false;

  }


  /*
    Long random organizer token.
  */

  const organizerToken =
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
      state.lon,

    group_size:
      state.groupSize,

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
      .insert(roomData)
      .select()
      .single();


  if (error) {

    console.error(
      "Room creation error:",
      error
    );


    showToast(
      "Couldn't create the Roam. Try again."
    );

    return false;

  }


  state.roomId =
    data.id;

  state.roomCode =
    data.code;

  state.organizerToken =
    organizerToken;


  return true;

}


/* =========================================================
   UNIQUE ROOM CODE
   ========================================================= */

async function generateUniqueRoomCode() {

  const words = [

    "PEACH",
    "SUNSET",
    "BREEZE",
    "CITRUS",
    "GROVE",
    "WANDER",
    "LUNA",
    "CANAL",
    "OLIVE",
    "TERRACE",
    "BLOOM",
    "PATIO",
    "ORANGE",
    "RIVIERA",
    "MANGO",
    "PALM",
    "GOLDEN",
    "SUMMER",
    "PICNIC",
    "ROAM"

  ];


  for (
    let attempt = 0;
    attempt < 10;
    attempt++
  ) {

    const word =
      words[
        Math.floor(
          Math.random() *
            words.length
        )
      ];


    const {
      data,
      error
    } =
      await supabaseClient
        .from("rooms")
        .select("id")
        .eq("code", word)
        .maybeSingle();


    if (error) {

      console.error(
        "Code lookup error:",
        error
      );

      return null;

    }


    if (!data) {

      return word;

    }

  }


  /*
    If all simple words are
    taken, use a word + number.
  */

  return (
    words[
      Math.floor(
        Math.random() *
          words.length
      )
    ] +
    Math.floor(
      Math.random() * 90 + 10
    )
  );

}


/* =========================================================
   RESULTS
   ========================================================= */

function buildResults() {

  const list =
    $("resultsList");

  if (!list) return;


  list.innerHTML = "";


  const matches = [];


  state.selectedTimes
    .slice(0, 3)
    .forEach(
      (time, index) => {

        const date =
          state.selectedDates[
            index %
              state.selectedDates.length
          ];


        matches.push({
          time,
          date
        });

      }
    );


  matches.forEach(
    match => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "result-card";


      const label =
        formatDate(
          match.date
        );


      card.innerHTML = `

        <div>

          <strong>
            ${escapeHtml(label)}
            ·
            ${escapeHtml(
              match.time
            )}
          </strong>

          <span>
            ${state.groupSize}
            people · Good match
          </span>

        </div>

        <button
          class="btn btn-primary"
        >
          Pick this time →
        </button>

      `;


      card
        .querySelector("button")
        .onclick =
          () =>
            chooseTime(
              match.time,
              label
            );


      list.appendChild(
        card
      );

    }
  );


  if ($("averageBudget")) {

    $("averageBudget").textContent =
      `$${Math.round(
        state.averageBudget ||
        state.budget ||
        0
      )}`;

  }

}


/* =========================================================
   TIME SELECTION
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

    $("placesSubtitle").textContent =
      `Nearby ${activityLabel(
        state.activity
      ).toLowerCase()} options around ${
        state.location
      }.`;

  }


  showScreen(
    "places"
  );


  await loadNearbyPlaces();

}


/* =========================================================
   PLACES
   ========================================================= */

function activityLabel(id) {

  return (
    activities.find(
      activity =>
        activity.id === id
    )?.name ||
    "Fun"
  );

}


function activityTags(id) {

  const map = {

    food: [
      "restaurant",
      "fast_food"
    ],

    coffee: [
      "cafe"
    ],

    movies: [
      "cinema"
    ],

    bowling: [
      "bowling_alley"
    ],

    outdoors: [
      "park",
      "garden"
    ],

    arts: [
      "museum",
      "gallery",
      "theatre"
    ],

    games: [
      "amusement_arcade",
      "escape_game",
      "game_centre"
    ],

    other: [
      "restaurant",
      "cafe",
      "museum",
      "park",
      "cinema"
    ]

  };


  return (
    map[id] ||
    map.other
  );

}


/* =========================================================
   FIND NEARBY PLACES
   ========================================================= */

async function loadNearbyPlaces() {

  const list =
    $("placesList");

  if (!list) return;


  list.innerHTML = `

    <div class="card">
      Finding nearby places…
    </div>

  `;


  let lat =
    state.lat;

  let lon =
    state.lon;


  /*
    If user typed a city,
    find its coordinates.
  */

  if (
    lat === null &&
    state.location &&
    state.location !==
      "Current location"
  ) {

    try {

      const response =
        await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
            state.location
          )}`
        );


      const data =
        await response.json();


      if (data[0]) {

        lat =
          Number(
            data[0].lat
          );

        lon =
          Number(
            data[0].lon
          );


        state.lat =
          lat;

        state.lon =
          lon;

      }

    } catch (error) {

      console.warn(
        "Location lookup failed:",
        error
      );

    }

  }


  if (
    lat === null ||
    lon === null
  ) {

    renderNoPlaces();

    return;

  }


  try {

    const places =
      await fetchOverpassPlaces(
        lat,
        lon,
        state.activity
      );


    state.places =
      places;


    if (!places.length) {

      renderNoPlaces();

      return;

    }


    renderPlaces(
      places
    );

  } catch (error) {

    console.warn(
      "Place search failed:",
      error
    );


    renderNoPlaces();

  }

}


/* =========================================================
   OVERPASS
   ========================================================= */

async function fetchOverpassPlaces(
  lat,
  lon,
  activity
) {

  const tags =
    activityTags(
      activity
    );


  const parts =
    tags
      .map(tag => {

        let key =
          "tourism";


        if (
          [
            "restaurant",
            "fast_food",
            "cafe",
            "cinema",
            "bowling_alley"
          ].includes(tag)
        ) {

          key =
            "amenity";

        }


        if (
          [
            "park",
            "garden",
            "amusement_arcade",
            "escape_game",
            "game_centre"
          ].includes(tag)
        ) {

          key =
            "leisure";

        }


        return `
          nwr["${key}"="${tag}"]
          (around:7000,${lat},${lon});
        `;

      })
      .join("");


  const query = `

    [out:json][timeout:18];

    (
      ${parts}
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

        continue;

      }


      const data =
        await response.json();


      const seen =
        new Set();


      const places =
        [];


      for (
        const item
        of data.elements || []
      ) {

        const tags =
          item.tags || {};


        const name =
          tags.name ||
          tags.brand;


        if (!name) continue;


        const key =
          name.toLowerCase();


        if (
          seen.has(key)
        ) continue;


        seen.add(key);


        const pLat =
          item.lat ??
          item.center?.lat;


        const pLon =
          item.lon ??
          item.center?.lon;


        places.push({

          name,

          type:
            prettyType(
              tags.amenity ||
              tags.leisure ||
              tags.tourism ||
              "place"
            ),

          address:
            [
              tags[
                "addr:housenumber"
              ],

              tags[
                "addr:street"
              ]

            ]
              .filter(Boolean)
              .join(" "),

          distance:
            pLat != null &&
            pLon != null
              ? distanceMiles(
                  lat,
                  lon,
                  pLat,
                  pLon
                )
              : null,

          lat: pLat,

          lon: pLon

        });

      }


      places.sort(
        (a, b) =>
          (a.distance ?? 999) -
          (b.distance ?? 999)
      );


      return places.slice(
        0,
        9
      );

    } catch (error) {

      console.warn(
        "Overpass failed:",
        error
      );

    }

  }


  return [];

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


  places.forEach(
    place => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "place-card";


      const icon =
        placeIcon(
          place.type
        );


      const distance =
        place.distance === null
          ? "Nearby"
          : `${place.distance.toFixed(
              1
            )} mi`;


      card.innerHTML = `

        <div class="place-photo">
          ${icon}
        </div>

        <div class="place-body">

          <small>
            ${escapeHtml(
              place.type
            )}
          </small>

          <h3>
            ${escapeHtml(
              place.name
            )}
          </h3>

          <p>
            ${distance}
            ${
              place.address
                ? ` · ${escapeHtml(
                    place.address
                  )}`
                : ""
            }
          </p>

          <button
            class="btn btn-primary"
          >
            Choose this place
          </button>

        </div>

      `;


      card
        .querySelector("button")
        .onclick =
          () =>
            choosePlace(
              place
            );


      list.appendChild(
        card
      );

    }
  );

}


function renderNoPlaces() {

  const list =
    $("placesList");

  if (!list) return;


  list.innerHTML = `

    <div class="card">

      <strong>
        We couldn't find nearby places.
      </strong>

      <p class="helper">
        Try changing the location
        and searching again.
      </p>

      <button
        class="btn btn-secondary"
        onclick="showScreen('create')"
      >
        Change location
      </button>

    </div>

  `;

}


/* =========================================================
   FINAL PLAN
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


function buildFinalPlan() {

  const place =
    state.selectedPlace;


  const plan =
    $("finalPlan");

  if (!plan) return;


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
        Activity
      </small>

      <strong>
        ${escapeHtml(
          activityLabel(
            state.activity
          )
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


    <div class="plan-row">

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

  `;

}


/* =========================================================
   COPY / SHARE
   ========================================================= */

function makePlanText() {

  const place =
    state.selectedPlace;


  return `${state.roamName}

${state.selectedTime?.dateLabel || "Date TBD"} · ${
    state.selectedTime?.time ||
    "Time TBD"
  }

${activityLabel(
  state.activity
)}

${place?.name || state.location}

${state.groupSize} people · Around $${Math.round(
    state.averageBudget ||
    state.budget ||
    0
  )} per person

Roam code: ${
    state.roomCode ||
    "—"
  }

Made with Roam.`;

}


async function copyPlan() {

  try {

    await navigator.clipboard.writeText(
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


async function sharePlan() {

  if (
    navigator.share
  ) {

    try {

      await navigator.share({

        title:
          state.roamName ||
          "My Roam",

        text:
          makePlanText()

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

    copyPlan();

  }

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


  if ($("locationStatus")) {

    $("locationStatus").textContent =
      "Finding your location…";

  }


  navigator.geolocation.getCurrentPosition(

    async position => {

      state.lat =
        position.coords.latitude;

      state.lon =
        position.coords.longitude;


      try {

        const response =
          await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${state.lat}&lon=${state.lon}`
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

          $("locationStatus").textContent =
            "Location found ✓";

        }

      } catch {

        state.location =
          "Current location";


        if ($("location")) {

          $("location").value =
            "Current location";

        }


        if ($("locationStatus")) {

          $("locationStatus").textContent =
            "Location found ✓";

        }

      }

    },

    () => {

      if ($("locationStatus")) {

        $("locationStatus").textContent =
          "Couldn't access location. You can type a city instead.";

      }


      showToast(
        "Location unavailable."
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
   JOIN ROAM
   ========================================================= */

async function findRoam() {

  const code =
    $("joinCode")
      ?.value
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
      "Supabase isn't connected yet."
    );

    return;

  }


  /*
    Look up the code on the
    shared Supabase database.
  */

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

    console.error(
      "Find Roam error:",
      error
    );


    showToast(
      "Couldn't look up that Roam."
    );

    return;

  }


  if (!room) {

    showToast(
      "That Roam code wasn't found."
    );

    return;

  }


  /*
    Save room information
    into local state.
  */

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

  state.lon =
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
    "other";

  state.joinedRoom =
    true;


  if ($("joinRoomName")) {

    $("joinRoomName").textContent =
      room.name;

  }


  if ($("joinRoomLocation")) {

    $("joinRoomLocation").textContent =
      room.location_text;

  }


  if ($("joinRoomCode")) {

    $("joinRoomCode").textContent =
      room.code;

  }


  showScreen(
    "join-confirm"
  );

}


/* =========================================================
   JOIN CONFIRMATION
   ========================================================= */

function joinRoam() {

  const name =
    $("joinName")
      ?.value
      .trim();


  if (!name) {

    showToast(
      "Enter your name."
    );

    return;

  }


  state.participantName =
    name;


  if ($("participantName")) {

    $("participantName").value =
      name;

  }


  /*
    Rebuild dates using the
    organizer's selected dates.
  */

  buildJoinedDates();


  showScreen(
    "availability"
  );

}


function buildJoinedDates() {

  const grid =
    $("dateGrid");

  if (!grid) return;


  grid.innerHTML = "";


  state.selectedDates.forEach(
    key => {

      const date =
        new Date(
          `${key}T12:00:00`
        );


      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "date-card";


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


      /*
        For a participant,
        clicking a date selects
        which dates they can attend.
      */

      button.onclick = () => {

        button.classList.toggle(
          "selected"
        );

      };


      grid.appendChild(
        button
      );

    }
  );

}


/* =========================================================
   SAVE PARTICIPANT
   ========================================================= */

async function saveParticipantToSupabase() {

  if (!supabaseClient) {

    showToast(
      "Supabase isn't connected."
    );

    return false;

  }


  const participantToken =
    generateToken();


  const availability = {

    dates:
      state.selectedDates,

    times:
      state.selectedTimes

  };


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
          participantToken,

        availability,

        budget:
          state.budget

      })
      .select()
      .single();


  if (error) {

    console.error(
      "Participant save error:",
      error
    );


    showToast(
      "Couldn't save your response."
    );

    return false;

  }


  state.participantId =
    data.id;


  return true;

}


/* =========================================================
   UPDATE PARTICIPANT BUDGET
   ========================================================= */

async function updateParticipantBudget() {

  if (
    !supabaseClient ||
    !state.participantId
  ) {

    return true;

  }


  const {
    error
  } =
    await supabaseClient
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
      "Budget update error:",
      error
    );


    showToast(
      "Couldn't save your budget."
    );

    return false;

  }


  return true;

}


/* =========================================================
   TOKEN
   ========================================================= */

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
      .slice(2) +
    Math.random()
      .toString(36)
      .slice(2)
  );

}


/* =========================================================
   HELPERS
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


function prettyType(
  value
) {

  return String(value)
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
    ) ||
    value.includes(
      "food"
    )
  ) {

    return "🍝";

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
      "cinema"
    )
  ) {

    return "🎬";

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
      "park"
    ) ||
    value.includes(
      "garden"
    )
  ) {

    return "🌿";

  }


  if (
    value.includes(
      "museum"
    ) ||
    value.includes(
      "gallery"
    )
  ) {

    return "🎨";

  }


  return "✨";

}


function distanceMiles(
  lat1,
  lon1,
  lat2,
  lon2
) {

  const radius =
    3958.8;


  const x =
    (lat2 - lat1) *
    Math.PI /
    180;


  const y =
    (lon2 - lon1) *
    Math.PI /
    180;


  const a =
    Math.sin(x / 2) ** 2 +
    Math.cos(
      lat1 *
        Math.PI /
        180
    ) *
    Math.cos(
      lat2 *
        Math.PI /
        180
    ) *
    Math.sin(y / 2) ** 2;


  return (
    radius *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );

}


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

        toast.classList.remove(
          "show"
        );

      },
      2400
    );

}

const SUPABASE_URL =
  "https://vvbgksamdlhkkchyhlyl.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_WaNsM-y0X9VH8pgnAQYFkg_2o68bx6S";

const { createClient } = window.supabase;

const db = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* =========================
   STATE
========================= */

const state = {

  mode: "organizer",

  screen: "home",

  roomId: null,

  roomCode: "",

  room: null,

  organizerToken: "",

  participantToken: "",

  participantId: null,

  participantName: "",

  groupSize: 4,

  candidateDates: [],

  selectedDates: new Set(),

  availability: {},

  budget: null,

  activity: "",

  results: [],

  selectedResult: null,

  selectedPlace: null,

  location: {
    lat: null,
    lng: null
  },

  places: []

};


const SCREEN_ORDER = [
  "home",
  "details",
  "created",
  "dates",
  "availability",
  "budget",
  "activity",
  "results",
  "places",
  "final"
];


const TIME_SLOTS = [
  "11:00 AM",
  "1:00 PM",
  "3:00 PM",
  "5:00 PM",
  "7:00 PM",
  "8:30 PM"
];


/* =========================
   ONE-WORD ROAM CODES
========================= */

const CODE_WORDS = [

  "SUNSET",
  "PEACH",
  "WANDER",
  "GLOW",
  "BREEZE",
  "LAGOON",
  "CITRUS",
  "MOSAIC",
  "CANAL",
  "CIELO",
  "SPRITZ",
  "GONDOLA",
  "PIAZZA",
  "VELVET",
  "OLIVE",
  "TERRACE",
  "PALM",
  "MANGO",
  "BLOSSOM",
  "PICNIC",
  "SUNNY",
  "WAVES",
  "BASIL",
  "LEMON",
  "ORANGE",
  "PATIO",
  "ROOFTOP",
  "RIVIERA",
  "SAIL",
  "SIESTA",
  "FIESTA",
  "JAZZ",
  "MUSIC",
  "DANCE",
  "PASTA",
  "PIZZA",
  "GELATO",
  "LATTE",
  "BRUNCH",
  "DINNER",
  "MOVIE",
  "BOWLING",
  "PARK",
  "TRAIL",
  "GARDEN",
  "MEADOW",
  "FOREST",
  "RIVER",
  "CLOUD",
  "STAR",
  "MOON",
  "COMET",
  "NOVA",
  "COSMO",
  "ORBIT",
  "SPARK",
  "HAPPY",
  "CHILL",
  "VIBES",
  "HANGOUT",
  "FRIENDS",
  "TOGETHER",
  "WEEKEND",
  "SATURDAY",
  "SUNDAY",
  "FRIDAY",
  "FUNDAY",
  "ADVENTURE",
  "ESCAPE",
  "JOURNEY",
  "TRAVEL",
  "DISCOVER",
  "MELLOW",
  "COZY",
  "SUNRISE",
  "DAYLIGHT",
  "MIDNIGHT",
  "GOLDEN",
  "CORAL",
  "AMBER",
  "TANGERINE",
  "MARIGOLD",
  "DAISY",
  "ROSE",
  "RAINBOW",
  "FRESH",
  "COOL",
  "FIREFLY",
  "BUTTERFLY",
  "BUBBLE",
  "CARAMEL",
  "COOKIE",
  "WAFFLE",
  "TACO",
  "SUSHI",
  "RAMEN",
  "BAGEL",
  "COCOA",
  "HONEY",
  "MAPLE",
  "CINNAMON",
  "GINGER",
  "BERRY",
  "CHERRY",
  "APPLE",
  "MELON",
  "KIWI",
  "MINT",
  "PINE",
  "CEDAR",
  "HARBOR",
  "ISLAND",
  "BEACH",
  "SHORE",
  "COAST",
  "COVE",
  "MARINA",
  "SAILOR",
  "VOYAGE",
  "ANCHOR",
  "COMPASS",
  "NORTH",
  "SOUTH",
  "EAST",
  "WEST",
  "SUN",
  "MOONLIGHT",
  "STARLIGHT",
  "DAYDREAM",
  "DREAMY",
  "MAGIC",
  "LUCKY",
  "CHEERS",
  "SMILE",
  "LAUGH",
  "PLAY",
  "CREATE",
  "MEMORY",
  "MOMENT",
  "TOAST",
  "SOCIAL",
  "LOCAL",
  "URBAN",
  "CITY",
  "DOWNTOWN",
  "VILLAGE",
  "MARKET"

];


/* =========================
   HELPERS
========================= */

function $(id) {
  return document.getElementById(id);
}


function showScreen(name) {

  document
    .querySelectorAll(".screen")
    .forEach(screen => {
      screen.classList.remove("active");
    });

  const target = $(`screen-${name}`);

  if (target) {
    target.classList.add("active");
  }

  state.screen = name;

  updateProgress();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function updateProgress() {

  const progress = $("progress");

  if (!progress) return;

  if (
    state.screen === "home" ||
    state.screen === "join" ||
    state.screen === "join-confirm"
  ) {
    progress.style.width = "0%";
    return;
  }

  const index =
    SCREEN_ORDER.indexOf(state.screen);

  const percent =
    Math.max(
      0,
      Math.min(
        100,
        (index / (SCREEN_ORDER.length - 1)) * 100
      )
    );

  progress.style.width = `${percent}%`;
}


function randomToken(length = 32) {

  const bytes =
    new Uint8Array(length);

  crypto.getRandomValues(bytes);

  return Array
    .from(
      bytes,
      byte =>
        byte.toString(16).padStart(2, "0")
    )
    .join("");
}


function normalizeRoamCode(value) {

  return String(value || "")
    .toUpperCase()
    .trim()
    .replace(/[^A-Z]/g, "");
}


function isValidRoamCode(value) {

  return /^[A-Z]{4,20}$/.test(value);
}


function randomWord() {

  return CODE_WORDS[
    Math.floor(
      Math.random() * CODE_WORDS.length
    )
  ];
}


async function createUniqueRoamCode() {

  for (let i = 0; i < 100; i++) {

    const code = randomWord();

    const {
      data,
      error
    } = await db
      .from("rooms")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return code;
    }
  }

  throw new Error(
    "Could not create a unique Roam code."
  );
}


function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================
   NAVIGATION
========================= */

function goHome() {

  showScreen("home");
}


function startRoam() {

  state.mode = "organizer";

  resetFlow();

  showScreen("details");
}


function openJoin() {

  state.mode = "participant";

  showScreen("join");
}


function startOver() {

  resetFlow();

  showScreen("home");
}


function resetFlow() {

  state.roomId = null;
  state.roomCode = "";
  state.room = null;

  state.organizerToken = "";
  state.participantToken = "";

  state.participantId = null;
  state.participantName = "";

  state.groupSize = 4;

  state.candidateDates = [];

  state.selectedDates = new Set();

  state.availability = {};

  state.budget = null;

  state.activity = "";

  state.results = [];

  state.selectedResult = null;

  state.selectedPlace = null;

  state.location = {
    lat: null,
    lng: null
  };

  state.places = [];

  if ($("roamName")) {
    $("roamName").value = "";
  }

  if ($("roamLocation")) {
    $("roamLocation").value = "";
  }

  if ($("joinCode")) {
    $("joinCode").value = "";
  }

  if ($("participantName")) {
    $("participantName").value = "";
  }

  updateGroupSizeDisplay();
}


/* =========================
   GROUP SIZE
========================= */

function changeGroupSize(amount) {

  state.groupSize =
    Math.max(
      2,
      Math.min(
        50,
        state.groupSize + amount
      )
    );

  updateGroupSizeDisplay();
}


function updateGroupSizeDisplay() {

  if ($("groupSize")) {
    $("groupSize").textContent =
      state.groupSize;
  }
}


/* =========================
   CREATE ROAM
========================= */

async function createRoam() {

  const name =
    $("roamName")?.value.trim();

  const locationText =
    $("roamLocation")?.value.trim();

  if (!name) {

    showToast("Give your Roam a name.");

    $("roamName")?.focus();

    return;
  }

  if (!locationText) {

    showToast(
      "Tell us where you're hanging out."
    );

    $("roamLocation")?.focus();

    return;
  }

  try {

    showToast("Creating your Roam…");

    const code =
      await createUniqueRoamCode();

    const organizerToken =
      randomToken();

    const payload = {

      code,

      name,

      location_text:
        locationText,

      lat:
        state.location.lat,

      lng:
        state.location.lng,

      group_size:
        state.groupSize,

      candidate_dates: [],

      activity: null,

      organizer_token:
        organizerToken
    };


    const {
      data,
      error
    } = await db
      .from("rooms")
      .insert(payload)
      .select("*")
      .single();


    if (error) {
      throw error;
    }


    state.room = data;

    state.roomId =
      data.id;

    state.roomCode =
      data.code;

    state.organizerToken =
      organizerToken;


    $("inviteCode").textContent =
      data.code;


    showScreen("created");

  } catch (error) {

    console.error(error);

    showToast(
      "Couldn't create the Roam. Try again."
    );
  }
}


/* =========================
   COPY / SHARE
========================= */

async function copyText(text) {

  if (
    navigator.clipboard &&
    window.isSecureContext
  ) {

    return navigator.clipboard.writeText(text);
  }

  const area =
    document.createElement("textarea");

  area.value = text;

  area.style.position = "fixed";
  area.style.opacity = "0";

  document.body.appendChild(area);

  area.select();

  document.execCommand("copy");

  area.remove();

  return Promise.resolve();
}


async function copyInviteCode() {

  try {

    await copyText(
      state.roomCode
    );

    showToast(
      `Copied ${state.roomCode}`
    );

  } catch {

    showToast(
      "Couldn't copy the code."
    );
  }
}


async function shareRoam() {

  const text =
    `Join my Roam! Use code ${state.roomCode}.`;

  if (navigator.share) {

    try {

      await navigator.share({
        title: "Join my Roam",
        text,
        url: window.location.href
      });

      return;

    } catch {}
  }

  await copyText(
    `${text} ${window.location.href}`
  );

  showToast(
    "Share message copied."
  );
}


/* =========================
   DATES
========================= */

function buildNextDates(count = 14) {

  const dates = [];

  const now = new Date();

  for (let i = 1; i <= count; i++) {

    const date =
      new Date(now);

    date.setHours(
      12,
      0,
      0,
      0
    );

    date.setDate(
      now.getDate() + i
    );

    const iso =
      date.toISOString().slice(0, 10);

    const weekday =
      date.toLocaleDateString(
        undefined,
        { weekday: "short" }
      );

    const month =
      date.toLocaleDateString(
        undefined,
        { month: "short" }
      );

    const day =
      date.getDate();

    dates.push({

      date: iso,

      label:
        `${weekday}, ${month} ${day}`
    });
  }

  return dates;
}


function goToDates() {

  state.candidateDates =
    buildNextDates();

  state.selectedDates =
    new Set();

  renderDateGrid();

  showScreen("dates");
}


function renderDateGrid() {

  const grid =
    $("dateGrid");

  if (!grid) return;

  grid.innerHTML =
    state.candidateDates
      .map(item => {

        const selected =
          state.selectedDates
            .has(item.date);

        const parts =
          item.label.split(",");

        return `

          <button
            class="date-card ${selected ? "selected" : ""}"
            onclick="
              toggleDate(
                '${item.date}',
                this
              )
            "
          >

            <span class="dow">
              ${escapeHtml(parts[0])}
            </span>

            <span class="day">
              ${escapeHtml(
                parts.slice(1).join(",").trim()
              )}
            </span>

          </button>

        `;
      })
      .join("");
}


function toggleDate(date, element) {

  if (
    state.selectedDates.has(date)
  ) {

    state.selectedDates.delete(date);

    element.classList.remove(
      "selected"
    );

  } else {

    if (
      state.selectedDates.size >= 7
    ) {

      showToast(
        "Pick up to 7 dates."
      );

      return;
    }

    state.selectedDates.add(date);

    element.classList.add(
      "selected"
    );
  }
}


async function saveDates() {

  if (
    state.selectedDates.size < 2
  ) {

    showToast(
      "Pick at least 2 dates."
    );

    return;
  }


  state.candidateDates =
    state.candidateDates.filter(
      item =>
        state.selectedDates.has(
          item.date
        )
    );


  try {

    const {
      error
    } = await db
      .from("rooms")
      .update({
        candidate_dates:
          state.candidateDates
      })
      .eq(
        "id",
        state.roomId
      );


    if (error) {
      throw error;
    }


    state.availability = {};

    renderAvailability();

    showScreen(
      "availability"
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Couldn't save the dates."
    );
  }
}


/* =========================
   AVAILABILITY
========================= */

function renderAvailability() {

  const container =
    $("availabilityDates");

  if (!container) return;


  container.innerHTML =
    state.candidateDates
      .map(item => {

        const selectedTimes =
          state.availability[
            item.date
          ] || [];


        return `

          <div class="availability-block">

            <div class="availability-title">
              ${escapeHtml(item.label)}
            </div>

            <div class="time-grid">

              ${TIME_SLOTS
                .map(time => `

                  <button
                    class="time-card ${
                      selectedTimes.includes(time)
                        ? "selected"
                        : ""
                    }"
                    onclick="
                      toggleTime(
                        '${item.date}',
                        '${time}',
                        this
                      )
                    "
                  >
                    ${time}
                  </button>

                `)
                .join("")}

            </div>

          </div>

        `;
      })
      .join("");
}


function toggleTime(
  date,
  time,
  element
) {

  if (!state.availability[date]) {

    state.availability[date] =
      [];
  }


  const times =
    state.availability[date];


  const index =
    times.indexOf(time);


  if (index >= 0) {

    times.splice(index, 1);

    element.classList.remove(
      "selected"
    );

  } else {

    times.push(time);

    element.classList.add(
      "selected"
    );
  }
}


async function saveAvailability() {

  const hasTime =
    Object.values(
      state.availability
    ).some(
      times =>
        Array.isArray(times) &&
        times.length > 0
    );


  if (!hasTime) {

    showToast(
      "Pick at least one time."
    );

    return;
  }


  if (
    state.mode === "participant"
  ) {

    await saveParticipantAvailability();

    return;
  }


  state.budget = null;

  document
    .querySelectorAll(
      ".budget-card"
    )
    .forEach(card =>
      card.classList.remove(
        "selected"
      )
    );


  $("budgetContinue")
    ?.classList.add(
      "disabled"
    );


  showScreen("budget");
}


/* =========================
   BUDGET
========================= */

function selectBudget(
  element,
  amount
) {

  const numericAmount =
    Number(amount);


  if (!Number.isFinite(
    numericAmount
  )) {
    return;
  }


  document
    .querySelectorAll(
      ".budget-card"
    )
    .forEach(card =>
      card.classList.remove(
        "selected"
      )
    );


  const target =
    element?.closest?.(
      ".budget-card"
    ) || element;


  target?.classList.add(
    "selected"
  );


  state.budget =
    numericAmount;


  $("budgetContinue")
    ?.classList.remove(
      "disabled"
    );
}


async function saveBudget() {

  if (state.budget == null) {

    showToast(
      "Choose a budget."
    );

    return;
  }


  if (
    state.mode === "participant"
  ) {

    await saveParticipantBudget();

    return;
  }


  showScreen("activity");
}


/* =========================
   ACTIVITY
========================= */

async function selectActivity(
  element,
  activity
) {

  document
    .querySelectorAll(
      ".activity-card"
    )
    .forEach(card =>
      card.classList.remove(
        "selected"
      )
    );


  element?.classList.add(
    "selected"
  );


  state.activity =
    activity;


  try {

    if (state.roomId) {

      const {
        error
      } = await db
        .from("rooms")
        .update({
          activity
        })
        .eq(
          "id",
          state.roomId
        );


      if (error) {
        throw error;
      }
    }


    await calculateResults();

    showScreen("results");

  } catch (error) {

    console.error(error);

    showToast(
      "Couldn't save the activity."
    );
  }
}


/* =========================
   RESULTS
========================= */

async function calculateResults() {

  const {
    data: participants,
    error
  } = await db
    .from("participants")
    .select("*")
    .eq(
      "room_id",
      state.roomId
    );


  if (error) {
    throw error;
  }


  const scores = [];


  for (
    const dateItem
    of state.candidateDates
  ) {

    for (
      const time
      of TIME_SLOTS
    ) {

      let available = 0;


      for (
        const participant
        of participants || []
      ) {

        const times =
          participant
            .availability?.[
              dateItem.date
            ] || [];


        if (
          times.includes(time)
        ) {
          available++;
        }
      }


      if (available > 0) {

        const total =
          participants.length;


        scores.push({

          date:
            dateItem.date,

          label:
            dateItem.label,

          time,

          available,

          total,

          percent:
            Math.round(
              (available /
                Math.max(total, 1)) *
                100
            )
        });
      }
    }
  }


  scores.sort(
    (a, b) =>
      b.percent - a.percent
  );


  state.results =
    scores.slice(0, 3);


  if (
    !state.results.length
  ) {

    state.results = [

      {
        date:
          state.candidateDates[0]?.date,

        label:
          state.candidateDates[0]?.label ||
          "Flexible",

        time:
          "7:00 PM",

        available: 1,

        total: 1,

        percent: 100
      }

    ];
  }


  state.selectedResult =
    state.results[0];


  renderResults(
    state.results
  );


  await loadAverageBudget();
}


function renderResults(
  results
) {

  const list =
    $("resultsList");

  if (!list) return;


  list.innerHTML =
    results.map(
      (result, index) => `

        <button
          class="result-card ${
            index === 0
              ? "best"
              : ""
          }"
          onclick="
            selectResult(
              ${index}
            )
          "
        >

          <div class="result-rank">
            ${index + 1}
          </div>

          <div class="result-info">

            <strong>
              ${escapeHtml(
                result.label
              )}
            </strong>

            <span>
              ${escapeHtml(
                result.time
              )}
            </span>

          </div>

          <div class="result-score">
            ${result.percent}% fit
          </div>

        </button>

      `
    ).join("");
}


function selectResult(index) {

  state.selectedResult =
    state.results[index];


  document
    .querySelectorAll(
      ".result-card"
    )
    .forEach(
      (card, i) => {

        card.classList.toggle(
          "best",
          i === index
        );
      }
    );
}


async function loadAverageBudget() {

  const target =
    $("averageBudget");

  if (
    !target ||
    !state.roomId
  ) {
    return;
  }


  try {

    const {
      data,
      error
    } = await db.rpc(
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


    if (
      average != null
    ) {

      target.innerHTML = `

        <strong>
          Group budget: $${Number(
            average
          ).toFixed(0)} average
        </strong>

        <p>
          Your individual budget stays private.
        </p>

      `;

    } else {

      target.innerHTML = `

        <strong>
          Budget kept private
        </strong>

        <p>
          Your individual budget stays private.
        </p>

      `;
    }

  } catch {

    target.innerHTML = `

      <strong>
        Budget kept private
      </strong>

      <p>
        Your individual budget stays private.
      </p>

    `;
  }
}


/* =========================
   PLACES
========================= */

async function showPlaces() {

  showScreen("places");


  const list =
    $("placesList");


  list.innerHTML = `

    <div class="loading-card">
      Finding nearby places…
    </div>

  `;


  try {

    await ensureCoordinates();


    if (
      !state.location.lat ||
      !state.location.lng
    ) {

      throw new Error(
        "No coordinates"
      );
    }


    const places =
      await fetchNearbyPlaces(
        state.location.lat,
        state.location.lng,
        state.activity
      );


    state.places =
      places;


    renderPlaces(
      places
    );


  } catch (error) {

    console.error(error);


    list.innerHTML = `

      <div class="empty-card">

        We couldn't find nearby places
        right now.

      </div>

    `;
  }
}


async function ensureCoordinates() {

  if (
    state.location.lat &&
    state.location.lng
  ) {
    return;
  }


  if (
    !state.room?.location_text
  ) {
    return;
  }


  const url =
    "https://nominatim.openstreetmap.org/search" +
    "?format=jsonv2&limit=1&q=" +
    encodeURIComponent(
      state.room.location_text
    );


  const response =
    await fetch(url);


  if (!response.ok) {

    throw new Error(
      "Geocoding failed"
    );
  }


  const data =
    await response.json();


  if (data?.[0]) {

    state.location.lat =
      Number(
        data[0].lat
      );

    state.location.lng =
      Number(
        data[0].lon
      );
  }
}


function activityQuery(
  activity
) {

  switch (activity) {

    case "food":

      return `
        ["amenity"~"restaurant|fast_food|bar|pub"]
      `;

    case "coffee":

      return `
        ["amenity"="cafe"]
      `;

    case "movies":

      return `
        ["amenity"="cinema"]
      `;

    case "bowling":

      return `
        ["leisure"="bowling_alley"]
      `;

    case "outdoors":

      return `
        ["leisure"~"park|nature_reserve|sports_centre|pitch"]
      `;

    case "arts":

      return `
        ["tourism"~"museum|gallery|arts_centre"]
      `;

    case "games":

      return `
        ["leisure"~"bowling_alley|amusement_arcade|escape_game"]
      `;

    default:

      return `
        ["name"]
      `;
  }
}


async function fetchNearbyPlaces(
  lat,
  lng,
  activity
) {

  const selector =
    activityQuery(
      activity
    );


  const query = `

    [out:json][timeout:20];

    (

      node${selector}
      (around:6000,${lat},${lng});

      way${selector}
      (around:6000,${lat},${lng});

    );

    out center tags;

  `;


  const response =
    await fetch(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "text/plain"
        },

        body: query
      }
    );


  if (!response.ok) {

    throw new Error(
      "Overpass request failed"
    );
  }


  const data =
    await response.json();


  const results =
    (data.elements || [])

      .map(element => {

        const tags =
          element.tags || {};


        const placeLat =
          element.lat ??
          element.center?.lat;


        const placeLng =
          element.lon ??
          element.center?.lon;


        if (
          !tags.name ||
          placeLat == null ||
          placeLng == null
        ) {
          return null;
        }


        return {

          id:
            `${element.type}-${element.id}`,

          name:
            tags.name,

          type:
            readablePlaceType(
              tags
            ),

          lat:
            Number(placeLat),

          lng:
            Number(placeLng),

          distance:
            distanceMiles(
              lat,
              lng,
              Number(placeLat),
              Number(placeLng)
            )
        };

      })

      .filter(Boolean)

      .sort(
        (a, b) =>
          a.distance -
          b.distance
      );


  const unique = [];

  const seen =
    new Set();


  for (
    const place
    of results
  ) {

    const key =
      place.name.toLowerCase();


    if (
      seen.has(key)
    ) {
      continue;
    }


    seen.add(key);

    unique.push(place);


    if (
      unique.length >= 8
    ) {
      break;
    }
  }


  return unique;
}


function readablePlaceType(
  tags
) {

  if (
    tags.amenity ===
    "restaurant"
  ) {
    return "Restaurant";
  }

  if (
    tags.amenity ===
    "cafe"
  ) {
    return "Café";
  }

  if (
    tags.amenity ===
    "cinema"
  ) {
    return "Cinema";
  }

  if (
    tags.amenity ===
    "bar"
  ) {
    return "Bar";
  }

  if (
    tags.amenity ===
    "pub"
  ) {
    return "Pub";
  }

  if (
    tags.leisure ===
    "bowling_alley"
  ) {
    return "Bowling";
  }

  if (
    tags.leisure ===
    "park"
  ) {
    return "Park";
  }

  if (
    tags.tourism ===
    "museum"
  ) {
    return "Museum";
  }

  if (
    tags.tourism ===
    "gallery"
  ) {
    return "Gallery";
  }

  if (
    tags.tourism ===
    "arts_centre"
  ) {
    return "Arts Centre";
  }

  if (
    tags.leisure ===
    "escape_game"
  ) {
    return "Escape Game";
  }

  if (
    tags.leisure ===
    "amusement_arcade"
  ) {
    return "Arcade";
  }

  return "Nearby place";
}


function renderPlaces(
  places
) {

  const list =
    $("placesList");

  if (!list) return;


  if (!places.length) {

    list.innerHTML = `

      <div class="empty-card">
        No matching places were found nearby.
      </div>

    `;

    return;
  }


  list.innerHTML =
    places.map(
      (place, index) => `

        <div
          class="place-card ${
            state.selectedPlace?.id ===
            place.id
              ? "selected"
              : ""
          }"
        >

          <div class="place-top">

            <div>

              <h3>
                ${escapeHtml(
                  place.name
                )}
              </h3>

              <div class="place-type">
                ${escapeHtml(
                  place.type
                )}
              </div>

            </div>

            <div class="place-distance">

              ${place.distance.toFixed(1)}
              mi

            </div>

          </div>


          <button
            onclick="
              selectPlace(
                ${index}
              )
            "
          >

            ${
              state.selectedPlace?.id ===
              place.id
                ? "Selected ✓"
                : "Choose this place"
            }

          </button>

        </div>

      `
    ).join("");
}


function selectPlace(index) {

  state.selectedPlace =
    state.places[index] ||
    null;


  renderPlaces(
    state.places
  );
}


/* =========================
   FINAL PLAN
========================= */

function finishPlan() {

  if (
    !state.selectedResult &&
    state.results.length
  ) {

    state.selectedResult =
      state.results[0];
  }


  renderFinalPlan();

  showScreen("final");
}


function finalMessage(
  result,
  place
) {

  const name =
    state.room?.name ||
    "the hangout";


  const location =
    place?.name ||
    state.room?.location_text ||
    "the area";


  return (
    `${name} is happening ` +
    `${result.label} at ` +
    `${result.time}. ` +
    `Meet at ${location}. ` +
    `See you there!`
  );
}


function renderFinalPlan() {

  const card =
    $("finalCard");

  if (!card) return;


  const result =
    state.selectedResult ||
    {
      label:
        "Your chosen date",

      time:
        "A time that works"
    };


  const place =
    state.selectedPlace;


  card.innerHTML = `

    <div class="final-code">
      ${escapeHtml(
        state.roomCode
      )}
    </div>

    <h3>
      ${escapeHtml(
        state.room?.name ||
        "Roam"
      )}
    </h3>

    <p>
      <strong>
        📅 ${escapeHtml(
          result.label
        )}
      </strong>
    </p>

    <p>
      <strong>
        ⏰ ${escapeHtml(
          result.time
        )}
      </strong>
    </p>

    <p>
      <strong>
        📍 ${escapeHtml(
          place?.name ||
          state.room?.location_text ||
          "Your chosen area"
        )}
      </strong>
    </p>

    <div class="final-divider"></div>

    <p>
      ${escapeHtml(
        finalMessage(
          result,
          place
        )
      )}
    </p>

  `;
}


async function copyPlan() {

  const result =
    state.selectedResult ||
    {};

  const text =
    finalMessage(
      result,
      state.selectedPlace
    ) +
    ` Roam code: ${state.roomCode}`;


  try {

    await copyText(text);

    showToast(
      "Plan copied."
    );

  } catch {

    showToast(
      "Couldn't copy the plan."
    );
  }
}


async function sharePlan() {

  const result =
    state.selectedResult ||
    {};


  const text =
    finalMessage(
      result,
      state.selectedPlace
    ) +
    ` Roam code: ${state.roomCode}`;


  if (navigator.share) {

    try {

      await navigator.share({
        title:
          state.room?.name ||
          "Roam",

        text
      });

      return;

    } catch {}
  }


  await copyText(text);

  showToast(
    "Plan copied."
  );
}


/* =========================
   JOIN
========================= */

async function joinRoam() {

  const input =
    $("joinCode");


  const code =
    normalizeRoamCode(
      input?.value
    );


  if (
    !isValidRoamCode(code)
  ) {

    showToast(
      "Enter the one-word Roam code."
    );

    input?.focus();

    return;
  }


  try {

    showToast(
      "Finding your Roam…"
    );


    const {
      data,
      error
    } = await db
      .from("rooms")
      .select("*")
      .eq(
        "code",
        code
      )
      .maybeSingle();


    if (error) {
      throw error;
    }


    if (!data) {

      showToast(
        "That Roam code wasn't found."
      );

      return;
    }


    state.mode =
      "participant";


    state.room =
      data;


    state.roomId =
      data.id;


    state.roomCode =
      data.code;


    state.groupSize =
      data.group_size;


    state.candidateDates =
      Array.isArray(
        data.candidate_dates
      )
        ? data.candidate_dates
        : [];


    state.activity =
      data.activity ||
      "";


    state.location = {

      lat:
        data.lat,

      lng:
        data.lng
    };


    $("joinRoomName").textContent =
      data.name;


    $("joinRoomLocation").textContent =
      data.location_text;


    $("joinRoomCode").textContent =
      data.code;


    showScreen(
      "join-confirm"
    );


  } catch (error) {

    console.error(error);

    showToast(
      "Couldn't join that Roam."
    );
  }
}


async function startParticipantFlow() {

  const name =
    $("participantName")
      ?.value
      .trim();


  if (!name) {

    showToast(
      "Enter your name."
    );

    $("participantName")
      ?.focus();

    return;
  }


  if (
    !state.candidateDates.length
  ) {

    showToast(
      "The organizer hasn't picked dates yet."
    );

    return;
  }


  state.participantName =
    name;


  state.participantToken =
    randomToken();


  state.availability =
    {};


  renderAvailability();

  showScreen(
    "availability"
  );
}


async function saveParticipantAvailability() {

  try {

    const payload = {

      room_id:
        state.roomId,

      name:
        state.participantName,

      participant_token:
        state.participantToken,

      availability:
        state.availability,

      budget:
        null
    };


    const {
      data,
      error
    } = await db
      .from("participants")
      .insert(payload)
      .select("*")
      .single();


    if (error) {
      throw error;
    }


    state.participantId =
      data.id;


    state.budget =
      null;


    document
      .querySelectorAll(
        ".budget-card"
      )
      .forEach(card =>
        card.classList.remove(
          "selected"
        )
      );


    $("budgetContinue")
      ?.classList.add(
        "disabled"
      );


    showScreen(
      "budget"
    );


  } catch (error) {

    console.error(error);

    showToast(
      "Couldn't save your availability."
    );
  }
}


async function saveParticipantBudget() {

  if (!state.participantId) {

    showToast(
      "Your response wasn't created yet."
    );

    return;
  }


  try {

    const {
      error
    } = await db
      .from("participants")
      .update({
        budget:
          state.budget
      })
      .eq(
        "id",
        state.participantId
      )
      .eq(
        "participant_token",
        state.participantToken
      );


    if (error) {
      throw error;
    }


    showScreen(
      "activity"
    );


  } catch (error) {

    console.error(error);

    showToast(
      "Couldn't save your budget."
    );
  }
}


/* =========================
   LOCATION
========================= */

function useCurrentLocation() {

  if (!navigator.geolocation) {

    showToast(
      "Location isn't available."
    );

    return;
  }


  showToast(
    "Getting your location…"
  );


  navigator.geolocation.getCurrentPosition(

    async position => {

      state.location.lat =
        position.coords.latitude;


      state.location.lng =
        position.coords.longitude;


      try {

        const address =
          await reverseGeocode(
            state.location.lat,
            state.location.lng
          );


        if (
          $("roamLocation") &&
          address
        ) {

          $("roamLocation").value =
            address;
        }


        showToast(
          "Location added."
        );

      } catch {

        showToast(
          "Location found."
        );
      }

    },

    () => {

      showToast(
        "Couldn't access your location."
      );

    },

    {
      enableHighAccuracy: true,

      timeout: 10000,

      maximumAge: 60000
    }
  );
}


async function reverseGeocode(
  lat,
  lng
) {

  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?format=jsonv2&lat=${lat}&lon=${lng}`;


  const response =
    await fetch(url);


  if (!response.ok) {

    throw new Error(
      "Reverse geocoding failed"
    );
  }


  const data =
    await response.json();


  return (
    data.display_name ||
    data.address?.city ||
    data.address?.town ||
    data.address?.village ||
    ""
  );
}


/* =========================
   DISTANCE
========================= */

function distanceMiles(
  lat1,
  lon1,
  lat2,
  lon2
) {

  const R =
    3958.7613;


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


  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}


function toRadians(
  degrees
) {

  return degrees *
    Math.PI /
    180;
}


/* =========================
   TOAST
========================= */

let toastTimer;


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
    toastTimer
  );


  toastTimer =
    setTimeout(
      () =>
        toast.classList.remove(
          "show"
        ),
      2800
    );
}


/* =========================
   GLOBAL FUNCTIONS
========================= */

window.goHome = goHome;
window.startRoam = startRoam;
window.openJoin = openJoin;
window.startOver = startOver;

window.changeGroupSize =
  changeGroupSize;

window.createRoam =
  createRoam;

window.copyInviteCode =
  copyInviteCode;

window.shareRoam =
  shareRoam;

window.goToDates =
  goToDates;

window.toggleDate =
  toggleDate;

window.saveDates =
  saveDates;

window.toggleTime =
  toggleTime;

window.saveAvailability =
  saveAvailability;

window.selectBudget =
  selectBudget;

window.saveBudget =
  saveBudget;

window.selectActivity =
  selectActivity;

window.selectResult =
  selectResult;

window.showPlaces =
  showPlaces;

window.selectPlace =
  selectPlace;

window.finishPlan =
  finishPlan;

window.copyPlan =
  copyPlan;

window.sharePlan =
  sharePlan;

window.joinRoam =
  joinRoam;

window.startParticipantFlow =
  startParticipantFlow;

window.useCurrentLocation =
  useCurrentLocation;


updateGroupSizeDisplay();

updateProgress();

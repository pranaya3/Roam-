/* =========================================================
   ROAM — GROUP HANGOUT PLANNER
   ========================================================= */

/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  "https://vvbgksamdlhkkchyhlyl.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_WaNsM-y0X9VH8pgnAQYFkg_2o68bx6S";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =========================================================
   APP STATE
========================================================= */

const state = {
  roomId: null,
  roomCode: null,

  organizerToken: null,
  participantToken: null,
  participantId: null,

  joinedRoom: false,

  roamName: "",
  location: "",

  latitude: null,
  longitude: null,

  groupSize:
    Number(localStorage.getItem("roamGroupSize")) || 4,

  selectedDates: [],
  selectedTimes: [],

  participantName: "",
  budget: null,
  activity: null,

  selectedTime: null,
  selectedPlace: null,

  results: [],

  savingBudget: false,
  creatingRoom: false
};


/* =========================================================
   CONSTANTS
========================================================= */

const TIME_OPTIONS = [
  "9:00 AM",
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
  "8:00 PM",
  "9:00 PM"
];


const SCREEN_PROGRESS = {
  home: "HOME",
  details: "01 / START",
  created: "ROAM READY",
  dates: "02 / DATES",
  availability: "03 / TIME",
  budget: "04 / BUDGET",
  activity: "05 / ACTIVITY",
  results: "MATCHES",
  places: "06 / PLACE",
  final: "FINAL PLAN",
  join: "JOIN",
  joinConfirm: "JOIN"
};


/* =========================================================
   ACTIVITIES
========================================================= */

const ACTIVITY_DATA = {
  eat: {
    label: "Eat",
    subtitle: "Find somewhere good.",
    filters: [
      ["amenity", "restaurant"],
      ["amenity", "cafe"],
      ["amenity", "fast_food"]
    ]
  },

  movies: {
    label: "Movies",
    subtitle: "Lights down.",
    filters: [
      ["amenity", "cinema"]
    ]
  },

  bowling: {
    label: "Bowling",
    subtitle: "Strike night.",
    filters: [
      ["leisure", "bowling_alley"]
    ]
  },

  coffee: {
    label: "Coffee",
    subtitle: "Slow down.",
    filters: [
      ["amenity", "cafe"]
    ]
  },

  outdoors: {
    label: "Outdoors",
    subtitle: "Get some air.",
    filters: [
      ["leisure", "park"],
      ["leisure", "garden"],
      ["leisure", "nature_reserve"]
    ]
  },

  arts: {
    label: "Arts",
    subtitle: "See something.",
    filters: [
      ["tourism", "museum"],
      ["tourism", "gallery"],
      ["amenity", "arts_centre"]
    ]
  },

  games: {
    label: "Games",
    subtitle: "Let the competition begin.",
    filters: [
      ["leisure", "amusement_arcade"],
      ["leisure", "bowling_alley"]
    ]
  },

  other: {
    label: "Other",
    subtitle: "We'll find something.",
    filters: [
      ["tourism", "attraction"],
      ["amenity", "community_centre"]
    ]
  }
};


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  updateGroupSizeDisplay();

  const savedCode =
    localStorage.getItem("roamCode");

  if (savedCode) {
    const mini =
      document.getElementById("roamCodeMini");

    const miniText =
      document.getElementById("roamCodeMiniText");

    if (mini && miniText) {
      miniText.textContent = savedCode;
    }
  }
});


/* =========================================================
   SCREEN NAVIGATION
========================================================= */

function showScreen(screenId) {
  document
    .querySelectorAll(".screen")
    .forEach(screen => {
      screen.classList.remove("active");
    });

  const target =
    document.getElementById(screenId);

  if (!target) {
    console.warn(
      "Roam: screen not found:",
      screenId
    );
    return;
  }

  target.classList.add("active");

  const progress =
    document.getElementById("progressText");

  if (progress) {
    progress.textContent =
      SCREEN_PROGRESS[screenId] || "ROAM";
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  updateMiniCode(screenId);
}


function updateMiniCode(screenId) {
  const mini =
    document.getElementById("roamCodeMini");

  const miniText =
    document.getElementById("roamCodeMiniText");

  if (!mini || !miniText) return;

  const shouldShow =
    !!state.roomCode &&
    !["home", "details", "join", "joinConfirm"].includes(
      screenId
    );

  mini.style.display =
    shouldShow ? "flex" : "none";

  miniText.textContent =
    state.roomCode || "";
}


/* =========================================================
   START / RESET
========================================================= */

function startRoam() {
  resetState();

  const savedSize =
    Number(localStorage.getItem("roamGroupSize"));

  if (
    Number.isFinite(savedSize) &&
    savedSize >= 2 &&
    savedSize <= 50
  ) {
    state.groupSize = savedSize;
  }

  updateGroupSizeDisplay();

  const roamName =
    document.getElementById("roamName");

  const location =
    document.getElementById("location");

  if (roamName) roamName.value = "";
  if (location) location.value = "";

  showScreen("details");
}


function resetState() {
  state.roomId = null;
  state.roomCode = null;

  state.organizerToken = null;
  state.participantToken = null;
  state.participantId = null;

  state.joinedRoom = false;

  state.roamName = "";
  state.location = "";

  state.latitude = null;
  state.longitude = null;

  state.selectedDates = [];
  state.selectedTimes = [];

  state.participantName = "";
  state.budget = null;
  state.activity = null;

  state.selectedTime = null;
  state.selectedPlace = null;

  state.results = [];

  state.savingBudget = false;
  state.creatingRoom = false;

  localStorage.removeItem("roamRoomId");
  localStorage.removeItem("roamCode");
}


/* =========================================================
   GROUP SIZE
========================================================= */

function changeGroupSize(delta) {
  const next =
    state.groupSize + Number(delta);

  if (next < 2 || next > 50) {
    return;
  }

  state.groupSize = next;

  localStorage.setItem(
    "roamGroupSize",
    String(next)
  );

  updateGroupSizeDisplay();
}


function updateGroupSizeDisplay() {
  const display =
    document.getElementById("groupSizeDisplay");

  if (display) {
    display.textContent =
      state.groupSize;
  }
}


/* =========================================================
   CREATE ROAM
========================================================= */

async function saveRoamDetails() {
  if (state.creatingRoom) return;

  const nameInput =
    document.getElementById("roamName");

  const locationInput =
    document.getElementById("location");

  const name =
    nameInput?.value.trim() || "";

  const locationText =
    locationInput?.value.trim() || "";

  if (!name) {
    showToast("Give your Roam a name first.");
    nameInput?.focus();
    return;
  }

  if (!locationText) {
    showToast("Enter a location first.");
    locationInput?.focus();
    return;
  }

  if (
    state.latitude == null ||
    state.longitude == null
  ) {
    await geocodeLocation(locationText);
  }

  state.roamName = name;
  state.location = locationText;

  state.creatingRoom = true;

  try {
    showToast("Creating your Roam...");

    const organizerToken =
      createToken();

    const code =
      await createUniqueRoomCode();

    const { data, error } =
      await db
        .from("rooms")
        .insert({
          code,
          name,
          location_text: locationText,
          lat: state.latitude,
          lng: state.longitude,
          group_size: state.groupSize,
          candidate_dates: [],
          activity: null,
          organizer_token: organizerToken
        })
        .select()
        .single();

    if (error) {
      throw error;
    }

    state.roomId = data.id;
    state.roomCode = data.code;
    state.organizerToken = organizerToken;
    state.joinedRoom = false;

    localStorage.setItem(
      "roamRoomId",
      data.id
    );

    localStorage.setItem(
      "roamCode",
      data.code
    );

    renderCreatedScreen();

    showScreen("created");

  } catch (error) {
    console.error(
      "Roam creation error:",
      error
    );

    showToast(
      getErrorMessage(
        error,
        "Could not create your Roam."
      )
    );

  } finally {
    state.creatingRoom = false;
  }
}


/* =========================================================
   5-WORD ROAM CODE
========================================================= */

const CODE_WORDS_1 = [
  "HAPPY",
  "SUNNY",
  "COZY",
  "CHILL",
  "BRIGHT",
  "SWEET",
  "WILD",
  "GOLDEN",
  "LAZY",
  "FRESH",
  "FUN",
  "GOOD"
];


const CODE_WORDS_2 = [
  "SUNSET",
  "SUNRISE",
  "WEEKEND",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
  "MOON",
  "STAR",
  "SUMMER",
  "AUTUMN",
  "SPRING",
  "WINTER"
];


const CODE_WORDS_3 = [
  "PIZZA",
  "TACOS",
  "PASTA",
  "PEACH",
  "COOKIE",
  "COFFEE",
  "CAKE",
  "BURGER",
  "NOODLES",
  "WAFFLE",
  "DONUT",
  "SUSHI"
];


const CODE_WORDS_4 = [
  "MUSIC",
  "MOVIE",
  "DANCE",
  "GAME",
  "PARK",
  "BEACH",
  "CAFE",
  "PICNIC",
  "HIKE",
  "SHOPPING",
  "DINNER",
  "ADVENTURE"
];


const CODE_WORDS_5 = [
  "FRIENDS",
  "VIBES",
  "FUN",
  "LAUGHS",
  "MEMORIES",
  "HANGOUT",
  "PLANS",
  "ROAM",
  "GOODTIMES",
  "SMILES",
  "STORIES",
  "CHILL"
];


function randomWord(list) {
  return list[
    Math.floor(Math.random() * list.length)
  ];
}


function generateRoomCode() {
  return [
    randomWord(CODE_WORDS_1),
    randomWord(CODE_WORDS_2),
    randomWord(CODE_WORDS_3),
    randomWord(CODE_WORDS_4),
    randomWord(CODE_WORDS_5)
  ].join(" · ");
}


function normalizeInvitePhrase(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[•·|]+/g, " ")
    .replace(/[,.\/\\_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .join(" · ");
}


function isValidInvitePhrase(value) {
  return (
    String(value || "")
      .split(" · ")
      .filter(Boolean)
      .length === 5
  );
}


async function createUniqueRoomCode() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code =
      normalizeInvitePhrase(
        generateRoomCode()
      );

    if (!isValidInvitePhrase(code)) {
      continue;
    }

    const { data, error } =
      await db
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


/* =========================================================
   CREATED SCREEN
========================================================= */

function renderCreatedScreen() {
  const phrase =
    document.getElementById("invitePhrase");

  if (phrase) {
    phrase.textContent =
      state.roomCode || "";
  }
}


async function copyRoamCode() {
  if (!state.roomCode) {
    showToast("Your Roam code isn't ready yet.");
    return;
  }

  const success =
    await copyText(state.roomCode);

  if (success) {
    showToast("Roam code copied!");
  } else {
    showToast("Couldn't copy the code.");
  }
}


async function shareRoamCode() {
  if (!state.roomCode) return;

  const text =
    `Join my Roam: ${state.roomCode}`;

  if (
    navigator.share
  ) {
    try {
      await navigator.share({
        title: state.roamName || "Roam",
        text
      });

      return;
    } catch (error) {
      if (
        error?.name === "AbortError"
      ) {
        return;
      }
    }
  }

  const copied =
    await copyText(text);

  if (copied) {
    showToast("Share message copied!");
  }
}


function continueAfterCreate() {
  showScreen("dates");
  renderDates();
}


/* =========================================================
   DATES
========================================================= */

function getUpcomingDates(count = 14) {
  const dates = [];

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  for (let i = 0; i < count; i++) {
    const date =
      new Date(today);

    date.setDate(
      today.getDate() + i
    );

    dates.push(date);
  }

  return dates;
}


function localDateKey(date) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function renderDates() {
  const grid =
    document.getElementById("dateGrid");

  if (!grid) return;

  grid.innerHTML = "";

  const dates =
    getUpcomingDates(14);

  dates.forEach(date => {
    const key =
      localDateKey(date);

    const button =
      document.createElement("button");

    button.type = "button";
    button.className = "date-card";

    if (
      state.selectedDates.includes(key)
    ) {
      button.classList.add("selected");
    }

    button.innerHTML = `
      <span>
        ${date.toLocaleDateString(
          undefined,
          { weekday: "short" }
        )}
      </span>

      <strong>
        ${date.getDate()}
      </strong>

      <small>
        ${date.toLocaleDateString(
          undefined,
          { month: "short" }
        )}
      </small>
    `;

    button.addEventListener(
      "click",
      () => {
        toggleDate(key);
      }
    );

    grid.appendChild(button);
  });
}


function toggleDate(dateKey) {
  const index =
    state.selectedDates.indexOf(
      dateKey
    );

  if (index >= 0) {
    state.selectedDates.splice(
      index,
      1
    );
  } else {
    state.selectedDates.push(
      dateKey
    );
  }

  renderDates();
}


async function saveDates() {
  if (!state.selectedDates.length) {
    showToast(
      "Pick at least one day."
    );
    return;
  }

  if (!state.roomId) {
    showToast(
      "Your Roam is missing."
    );
    return;
  }

  try {
    const { error } =
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
      throw error;
    }

    renderTimes();
    showScreen("availability");

  } catch (error) {
    console.error(
      "Save dates error:",
      error
    );

    showToast(
      "Couldn't save your dates."
    );
  }
}


/* =========================================================
   AVAILABILITY
========================================================= */

function renderTimes() {
  const grid =
    document.getElementById("timeGrid");

  if (!grid) return;

  grid.innerHTML = "";

  state.selectedTimes = [];

  TIME_OPTIONS.forEach(time => {
    const button =
      document.createElement("button");

    button.type = "button";
    button.className = "time-card";
    button.textContent = time;

    button.addEventListener(
      "click",
      () => {
        toggleTime(time, button);
      }
    );

    grid.appendChild(button);
  });
}


function toggleTime(time, element) {
  const index =
    state.selectedTimes.indexOf(
      time
    );

  if (index >= 0) {
    state.selectedTimes.splice(
      index,
      1
    );

    element.classList.remove(
      "selected"
    );

  } else {
    state.selectedTimes.push(
      time
    );

    element.classList.add(
      "selected"
    );
  }
}


async function saveAvailability() {
  const nameInput =
    document.getElementById(
      "participantName"
    );

  const name =
    nameInput?.value.trim() || "";

  if (!name) {
    showToast(
      "Enter your name first."
    );

    nameInput?.focus();

    return;
  }

  if (!state.selectedTimes.length) {
    showToast(
      "Pick at least one time."
    );

    return;
  }

  state.participantName = name;

  showScreen("budget");

  const button =
    document.getElementById(
      "budgetContinue"
    );

  if (button) {
    button.disabled =
      state.budget == null;
  }
}


/* =========================================================
   BUDGET
========================================================= */

/*
   IMPORTANT:
   Your index.html uses:

   onclick="selectBudget(this, 20)"

   Therefore this function MUST be:
   selectBudget(element, amount)
*/

function selectBudget(element, amount) {
  const numericAmount =
    Number(amount);

  if (!Number.isFinite(numericAmount)) {
    console.warn(
      "Invalid budget:",
      amount
    );

    return;
  }

  state.budget =
    numericAmount;

  document
    .querySelectorAll(
      ".budget-card"
    )
    .forEach(card => {
      card.classList.remove(
        "selected"
      );
    });

  const target =
    element?.closest?.(
      ".budget-card"
    ) || element;

  if (
    target &&
    target.classList
  ) {
    target.classList.add(
      "selected"
    );
  }

  const continueButton =
    document.getElementById(
      "budgetContinue"
    );

  if (continueButton) {
    continueButton.disabled =
      false;
  }
}


async function finishBudget() {
  if (state.savingBudget) {
    return;
  }

  if (state.budget == null) {
    showToast(
      "Pick a budget first."
    );

    return;
  }

  if (!state.participantName) {
    showToast(
      "Enter your name first."
    );

    showScreen("availability");

    return;
  }

  if (!state.roomId) {
    showToast(
      "Your Roam is missing."
    );

    return;
  }

  state.savingBudget = true;

  const continueButton =
    document.getElementById(
      "budgetContinue"
    );

  if (continueButton) {
    continueButton.disabled =
      true;

    continueButton.innerHTML =
      `Saving <span>…</span>`;
  }

  try {
    const participantToken =
      state.participantToken ||
      createToken();

    state.participantToken =
      participantToken;

    const { data, error } =
      await db
        .from("participants")
        .insert({
          room_id: state.roomId,
          name: state.participantName,
          participant_token:
            participantToken,
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

    /*
      If this person is joining someone else's Roam,
      they wait for the organizer to finish the plan.
    */

    if (state.joinedRoom) {
      showToast(
        "You're in! The organizer will finish the plan."
      );

      return;
    }

    /*
      Organizer continues to activity selection.
    */

    showScreen("activity");

  } catch (error) {
    console.error(
      "Budget save error:",
      error
    );

    showToast(
      getErrorMessage(
        error,
        "Couldn't save your budget."
      )
    );

  } finally {
    state.savingBudget = false;

    if (continueButton) {
      continueButton.disabled =
        state.budget == null;

      continueButton.innerHTML =
        `Continue <span>→</span>`;
    }
  }
}


/* =========================================================
   ACTIVITY
========================================================= */

async function selectActivity(activity) {
  if (!ACTIVITY_DATA[activity]) {
    return;
  }

  state.activity =
    activity;

  const activityData =
    ACTIVITY_DATA[activity];

  /*
    Save activity to the room.
  */

  if (state.roomId) {
    try {
      const { error } =
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
        throw error;
      }

    } catch (error) {
      console.error(
        "Activity save error:",
        error
      );

      showToast(
        "Couldn't save the activity."
      );

      return;
    }
  }

  showScreen("results");

  await calculateResults();

  /*
    Update places subtitle.
  */

  const subtitle =
    document.getElementById(
      "placesSubtitle"
    );

  if (subtitle) {
    subtitle.textContent =
      `${activityData.label} near you.`;
  }
}


/* =========================================================
   RESULTS
========================================================= */

async function calculateResults() {
  if (!state.roomId) {
    return;
  }

  try {
    const { data, error } =
      await db
        .from("participants")
        .select("*")
        .eq(
          "room_id",
          state.roomId
        );

    if (error) {
      throw error;
    }

    const participants =
      data || [];

    const scores = {};

    state.selectedDates.forEach(
      date => {
        state.selectedTimes.forEach(
          time => {
            const key =
              `${date}|${time}`;

            let score = 0;

            participants.forEach(
              person => {
                const availability =
                  person.availability ||
                  {};

                const dates =
                  availability.dates ||
                  [];

                const times =
                  availability.times ||
                  [];

                if (
                  dates.includes(date) &&
                  times.includes(time)
                ) {
                  score++;
                }
              }
            );

            scores[key] =
              score;
          }
        );
      }
    );

    /*
      If this is the organizer,
      their availability is already stored
      when finishBudget() runs.
    */

    const ranked =
      Object.entries(scores)
        .sort(
          (a, b) => b[1] - a[1]
        )
        .slice(0, 3);

    state.results =
      ranked.map(
        ([key, score]) => {
          const [
            date,
            time
          ] = key.split("|");

          return {
            date,
            time,
            score
          };
        }
      );

    if (!state.results.length) {
      /*
        Fallback in case no matching combination
        exists yet.
      */

      state.results =
        state.selectedDates
          .slice(0, 3)
          .map(date => ({
            date,
            time:
              state.selectedTimes[0] ||
              "6:00 PM",
            score: 0
          }));
    }

    state.selectedTime =
      state.results[0] || null;

    renderResults();

    await loadAverageBudget();

  } catch (error) {
    console.error(
      "Results error:",
      error
    );

    showToast(
      "Couldn't calculate the best times."
    );
  }
}


function renderResults() {
  const list =
    document.getElementById(
      "resultsList"
    );

  if (!list) return;

  list.innerHTML = "";

  state.results.forEach(
    (result, index) => {
      const card =
        document.createElement(
          "button"
        );

      card.type = "button";
      card.className =
        "result-card";

      if (index === 0) {
        card.classList.add(
          "selected"
        );
      }

      const date =
        new Date(
          `${result.date}T12:00:00`
        );

      const dateText =
        date.toLocaleDateString(
          undefined,
          {
            weekday: "long",
            month: "long",
            day: "numeric"
          }
        );

      card.innerHTML = `
        <div>
          <span>OPTION ${index + 1}</span>

          <strong>
            ${escapeHtml(dateText)}
          </strong>

          <small>
            ${escapeHtml(result.time)}
          </small>
        </div>

        <div>
          <strong>
            ${result.score}
          </strong>

          <span>
            ${result.score === 1 ? "person" : "people"}
          </span>
        </div>
      `;

      card.addEventListener(
        "click",
        () => {
          document
            .querySelectorAll(
              ".result-card"
            )
            .forEach(
              other =>
                other.classList.remove(
                  "selected"
                )
            );

          card.classList.add(
            "selected"
          );

          state.selectedTime =
            result;
        }
      );

      list.appendChild(card);
    }
  );
}


/* =========================================================
   AVERAGE BUDGET
========================================================= */

async function loadAverageBudget() {
  if (!state.roomId) {
    return;
  }

  const output =
    document.getElementById(
      "averageBudget"
    );

  if (!output) return;

  try {
    const { data, error } =
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

    let average = null;

    if (
      Array.isArray(data)
    ) {
      average =
        data[0]?.average_budget;
    } else {
      average =
        data?.average_budget;
    }

    if (
      average == null ||
      Number.isNaN(
        Number(average)
      )
    ) {
      output.textContent =
        "—";

      return;
    }

    output.textContent =
      `$${Number(average).toFixed(0)}`;

  } catch (error) {
    console.error(
      "Average budget error:",
      error
    );

    output.textContent =
      "—";
  }
}


/* =========================================================
   PLACES
========================================================= */

async function showPlaces() {
  if (!state.activity) {
    showToast(
      "Pick an activity first."
    );

    return;
  }

  showScreen("places");

  const loading =
    document.getElementById(
      "placesLoading"
    );

  const list =
    document.getElementById(
      "placesList"
    );

  if (loading) {
    loading.style.display =
      "flex";
  }

  if (list) {
    list.innerHTML = "";
  }

  try {
    /*
      Make sure we have coordinates.
    */

    if (
      state.latitude == null ||
      state.longitude == null
    ) {
      await geocodeLocation(
        state.location
      );
    }

    if (
      state.latitude == null ||
      state.longitude == null
    ) {
      throw new Error(
        "We couldn't find that location."
      );
    }

    const places =
      await findNearbyPlaces();

    if (!places.length) {
      renderNoPlaces();

      return;
    }

    renderPlaces(places);

  } catch (error) {
    console.error(
      "Places error:",
      error
    );

    renderNoPlaces();

  } finally {
    if (loading) {
      loading.style.display =
        "none";
    }
  }
}


async function findNearbyPlaces() {
  const activityData =
    ACTIVITY_DATA[state.activity];

  if (!activityData) {
    return [];
  }

  const radius = 12000;

  const filters =
    activityData.filters
      .map(
        ([key, value]) =>
          `nwr["${key}"="${value}"](around:${radius},${state.latitude},${state.longitude});`
      )
      .join("\n");

  const query = `
    [out:json][timeout:25];
    (
      ${filters}
    );
    out center tags;
  `;

  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
  ];

  let lastError = null;

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
                "text/plain;charset=UTF-8",
              "Accept":
                "application/json"
            },
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
        json.elements || []
      );

    } catch (error) {
      lastError = error;
      console.warn(
        "Overpass endpoint failed:",
        endpoint,
        error
      );
    }
  }

  throw (
    lastError ||
    new Error(
      "No place service available."
    )
  );
}


function cleanPlaces(elements) {
  const places = [];

  const seen = new Set();

  elements.forEach(
    element => {
      const tags =
        element.tags || {};

      const name =
        tags.name;

      if (!name) {
        return;
      }

      const id =
        `${element.type}-${element.id}`;

      if (seen.has(id)) {
        return;
      }

      seen.add(id);

      const lat =
        element.lat ??
        element.center?.lat;

      const lng =
        element.lon ??
        element.center?.lon;

      if (
        lat == null ||
        lng == null
      ) {
        return;
      }

      const distance =
        distanceMiles(
          state.latitude,
          state.longitude,
          lat,
          lng
        );

      places.push({
        id,
        name,
        lat,
        lng,
        distance,
        address:
          buildAddress(tags),
        category:
          tags.amenity ||
          tags.tourism ||
          tags.leisure ||
          "",
        phone:
          tags.phone ||
          "",
        website:
          tags.website ||
          ""
      });
    }
  );

  places.sort(
    (a, b) =>
      a.distance - b.distance
  );

  return places.slice(0, 12);
}


function renderPlaces(places) {
  const list =
    document.getElementById(
      "placesList"
    );

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

      const imageUrl =
        getPlaceImage(
          place.name
        );

      card.innerHTML = `
        <div
          class="place-image"
          style="
            background-image:
              url('${escapeAttribute(imageUrl)}');
          "
        ></div>

        <div class="place-content">

          <div class="place-info">

            <span>
              ${escapeHtml(
                place.category ||
                state.activity
              )}
            </span>

            <h3>
              ${escapeHtml(
                place.name
              )}
            </h3>

            <p>
              ${escapeHtml(
                place.address ||
                `${place.distance.toFixed(1)} miles away`
              )}
            </p>

            <small>
              ${place.distance.toFixed(1)}
              miles away
            </small>

          </div>

          <button
            class="place-action"
            type="button"
          >
            Choose →
          </button>

        </div>
      `;

      const chooseButton =
        card.querySelector(
          ".place-action"
        );

      chooseButton?.addEventListener(
        "click",
        () => {
          choosePlace(place);
        }
      );

      list.appendChild(card);
    }
  );
}


function choosePlace(place) {
  state.selectedPlace =
    place;

  renderFinalPlan();

  showScreen("final");
}


function renderNoPlaces() {
  const list =
    document.getElementById(
      "placesList"
    );

  if (!list) return;

  list.innerHTML = `
    <div
      class="place-card"
      style="grid-column:1/-1;padding:30px;"
    >
      <div class="place-content">

        <div class="place-info">

          <span>
            NEARBY
          </span>

          <h3>
            We couldn't find places automatically.
          </h3>

          <p>
            Try another location or use the
            search below.
          </p>

        </div>

        <button
          class="place-action"
          type="button"
          onclick="openGoogleMapsSearch()"
        >
          Search Maps →
        </button>

      </div>
    </div>
  `;
}


function openGoogleMapsSearch() {
  const query =
    encodeURIComponent(
      `${ACTIVITY_DATA[state.activity]?.label || "places"} near ${state.location}`
    );

  window.open(
    `https://www.google.com/maps/search/?api=1&query=${query}`,
    "_blank",
    "noopener,noreferrer"
  );
}


/* =========================================================
   FINAL PLAN
========================================================= */

function renderFinalPlan() {
  const result =
    state.selectedTime ||
    state.results[0];

  const dateOutput =
    document.getElementById(
      "finalDate"
    );

  const timeOutput =
    document.getElementById(
      "finalTime"
    );

  const activityOutput =
    document.getElementById(
      "finalActivity"
    );

  const placeOutput =
    document.getElementById(
      "finalPlace"
    );

  const peopleOutput =
    document.getElementById(
      "finalPeople"
    );

  const budgetOutput =
    document.getElementById(
      "finalBudget"
    );

  if (result) {
    const date =
      new Date(
        `${result.date}T12:00:00`
      );

    if (dateOutput) {
      dateOutput.textContent =
        date.toLocaleDateString(
          undefined,
          {
            weekday: "long",
            month: "long",
            day: "numeric"
          }
        );
    }

    if (timeOutput) {
      timeOutput.textContent =
        result.time;
    }
  }

  if (activityOutput) {
    activityOutput.textContent =
      ACTIVITY_DATA[
        state.activity
      ]?.label ||
      "Hangout";
  }

  if (placeOutput) {
    placeOutput.textContent =
      state.selectedPlace?.name ||
      "A place nearby";
  }

  if (peopleOutput) {
    peopleOutput.textContent =
      `${state.groupSize} people`;
  }

  if (budgetOutput) {
    budgetOutput.textContent =
      state.budget != null
        ? `Around $${state.budget}/person`
        : "Budget flexible";
  }
}


async function copyPlan() {
  const text =
    buildPlanText();

  const success =
    await copyText(text);

  if (success) {
    showToast(
      "Plan copied!"
    );
  } else {
    showToast(
      "Couldn't copy the plan."
    );
  }
}


async function sharePlan() {
  const text =
    buildPlanText();

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

      return;

    } catch (error) {
      if (
        error?.name === "AbortError"
      ) {
        return;
      }
    }
  }

  const copied =
    await copyText(text);

  if (copied) {
    showToast(
      "Share message copied!"
    );
  }
}


function buildPlanText() {
  const result =
    state.selectedTime ||
    state.results[0];

  let dateText =
    "Date TBD";

  let timeText =
    "Time TBD";

  if (result) {
    const date =
      new Date(
        `${result.date}T12:00:00`
      );

    dateText =
      date.toLocaleDateString(
        undefined,
        {
          weekday: "long",
          month: "long",
          day: "numeric"
        }
      );

    timeText =
      result.time;
  }

  const activity =
    ACTIVITY_DATA[
      state.activity
    ]?.label ||
    "Hangout";

  const place =
    state.selectedPlace?.name ||
    "A place nearby";

  return [
    `ROAM: ${state.roamName || "Hangout"}`,
    "",
    `${dateText} at ${timeText}`,
    `${activity} — ${place}`,
    `${state.groupSize} people`,
    state.budget != null
      ? `Around $${state.budget} per person`
      : "",
    "",
    state.roomCode
      ? `Roam code: ${state.roomCode}`
      : ""
  ]
    .filter(Boolean)
    .join("\n");
}


/* =========================================================
   LOCATION
========================================================= */

async function getUserLocation() {
  const status =
    document.getElementById(
      "locationStatus"
    );

  if (!navigator.geolocation) {
    showToast(
      "Location isn't supported by this browser."
    );

    return;
  }

  if (status) {
    status.textContent =
      "Finding your location...";
  }

  navigator.geolocation.getCurrentPosition(
    async position => {
      state.latitude =
        position.coords.latitude;

      state.longitude =
        position.coords.longitude;

      try {
        const locationText =
          await reverseGeocode(
            state.latitude,
            state.longitude
          );

        state.location =
          locationText;

        const input =
          document.getElementById(
            "location"
          );

        if (input) {
          input.value =
            locationText;
        }

        if (status) {
          status.textContent =
            "Location found.";
        }

        showToast(
          "Location found!"
        );

      } catch (error) {
        console.error(
          "Reverse geocode error:",
          error
        );

        if (status) {
          status.textContent =
            "Location found.";
        }
      }
    },

    error => {
      console.error(
        "Geolocation error:",
        error
      );

      if (status) {
        status.textContent =
          "Couldn't access your location.";
      }

      showToast(
        "Couldn't get your location."
      );
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }
  );
}


async function geocodeLocation(
  locationText
) {
  if (!locationText) {
    return;
  }

  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(locationText)}`;

    const response =
      await fetch(
        url,
        {
          headers: {
            "Accept":
              "application/json"
          }
        }
      );

    if (!response.ok) {
      throw new Error(
        `Nominatim returned ${response.status}`
      );
    }

    const results =
      await response.json();

    if (!results.length) {
      throw new Error(
        "Location not found."
      );
    }

    state.latitude =
      Number(results[0].lat);

    state.longitude =
      Number(results[0].lon);

  } catch (error) {
    console.error(
      "Geocode error:",
      error
    );

    /*
      We don't block the user if the map service
      doesn't respond. Places can still fall back
      to Google Maps.
    */
  }
}


async function reverseGeocode(
  latitude,
  longitude
) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;

  const response =
    await fetch(
      url,
      {
        headers: {
          "Accept":
            "application/json"
        }
      }
    );

  if (!response.ok) {
    throw new Error(
      `Reverse geocode returned ${response.status}`
    );
  }

  const data =
    await response.json();

  const address =
    data.address || {};

  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    "";

  const stateName =
    address.state || "";

  if (city && stateName) {
    return `${city}, ${stateName}`;
  }

  return (
    data.display_name ||
    "Current location"
  );
}


/* =========================================================
   JOIN A ROAM
========================================================= */

async function joinRoam() {
  const input =
    document.getElementById(
      "joinCode"
    );

  const raw =
    input?.value || "";

  const code =
    normalizeInvitePhrase(raw);

  if (!isValidInvitePhrase(code)) {
    showToast(
      "Enter all five words."
    );

    input?.focus();

    return;
  }

  try {
    showToast(
      "Finding your Roam..."
    );

    const { data, error } =
      await db
        .from("rooms")
        .select("*")
        .eq("code", code)
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      showToast(
        "We couldn't find that Roam."
      );

      return;
    }

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
      data.group_size || 4;

    state.selectedDates =
      Array.isArray(
        data.candidate_dates
      )
        ? data.candidate_dates
        : [];

    state.activity =
      data.activity ||
      null;

    state.joinedRoom =
      true;

    state.participantToken =
      createToken();

    localStorage.setItem(
      "roamCode",
      data.code
    );

    localStorage.setItem(
      "roamRoomId",
      data.id
    );

    renderJoinConfirmation();

    showScreen(
      "joinConfirm"
    );

  } catch (error) {
    console.error(
      "Join error:",
      error
    );

    showToast(
      getErrorMessage(
        error,
        "Couldn't join that Roam."
      )
    );
  }
}


function renderJoinConfirmation() {
  const name =
    document.getElementById(
      "joinRoomName"
    );

  const code =
    document.getElementById(
      "joinRoomCode"
    );

  const location =
    document.getElementById(
      "joinRoomLocation"
    );

  if (name) {
    name.textContent =
      state.roamName ||
      "this Roam";
  }

  if (code) {
    code.textContent =
      state.roomCode ||
      "—";
  }

  if (location) {
    location.textContent =
      state.location ||
      "—";
  }
}


function continueJoin() {
  if (!state.roomId) {
    showToast(
      "Your Roam wasn't loaded."
    );

    return;
  }

  if (!state.selectedDates.length) {
    showToast(
      "The organizer hasn't picked dates yet."
    );

    return;
  }

  const nameInput =
    document.getElementById(
      "participantName"
    );

  if (nameInput) {
    nameInput.value = "";
  }

  renderTimes();

  showScreen(
    "availability"
  );
}


/* =========================================================
   UTILITY FUNCTIONS
========================================================= */

function createToken() {
  if (
    window.crypto &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID() +
      crypto.randomUUID();
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


async function copyText(text) {
  try {
    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(
        text
      );

      return true;
    }
  } catch (error) {
    console.warn(
      "Clipboard API failed:",
      error
    );
  }

  try {
    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value =
      text;

    textarea.style.position =
      "fixed";

    textarea.style.opacity =
      "0";

    document.body.appendChild(
      textarea
    );

    textarea.focus();
    textarea.select();

    const success =
      document.execCommand(
        "copy"
      );

    textarea.remove();

    return success;

  } catch (error) {
    console.error(
      "Fallback copy failed:",
      error
    );

    return false;
  }
}


function showToast(message) {
  const toast =
    document.getElementById(
      "toast"
    );

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
      3000
    );
}


function escapeHtml(value) {
  return String(value ?? "")
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


function escapeAttribute(value) {
  return escapeHtml(value);
}


function getErrorMessage(
  error,
  fallback
) {
  if (
    error?.message
  ) {
    return error.message;
  }

  if (
    error?.details
  ) {
    return error.details;
  }

  return fallback;
}


/* =========================================================
   PLACE HELPERS
========================================================= */

function buildAddress(tags) {
  const parts = [];

  if (tags["addr:housenumber"]) {
    parts.push(
      tags["addr:housenumber"]
    );
  }

  if (tags["addr:street"]) {
    parts.push(
      tags["addr:street"]
    );
  }

  if (tags["addr:city"]) {
    parts.push(
      tags["addr:city"]
    );
  }

  if (tags["addr:state"]) {
    parts.push(
      tags["addr:state"]
    );
  }

  return parts.join(", ");
}


function getPlaceImage(name) {
  return (
    `https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80`
  );
}


function distanceMiles(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const earthRadius =
    3958.7613;

  const dLat =
    degreesToRadians(
      lat2 - lat1
    );

  const dLon =
    degreesToRadians(
      lon2 - lon1
    );

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      degreesToRadians(lat1)
    ) *
      Math.cos(
        degreesToRadians(lat2)
      ) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}


function degreesToRadians(
  degrees
) {
  return (
    degrees *
    Math.PI /
    180
  );
}


/* =========================================================
   GLOBAL FUNCTIONS
   =========================================================
   Inline onclick handlers in index.html need these
   functions to exist on window.
========================================================= */

window.showScreen =
  showScreen;

window.startRoam =
  startRoam;

window.changeGroupSize =
  changeGroupSize;

window.saveRoamDetails =
  saveRoamDetails;

window.copyRoamCode =
  copyRoamCode;

window.shareRoamCode =
  shareRoamCode;

window.continueAfterCreate =
  continueAfterCreate;

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

window.copyPlan =
  copyPlan;

window.sharePlan =
  sharePlan;

window.getUserLocation =
  getUserLocation;

window.joinRoam =
  joinRoam;

window.continueJoin =
  continueJoin;

window.openGoogleMapsSearch =
  openGoogleMapsSearch;

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

  participantId: null,

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
   TIME OPTIONS
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


/* =========================================================
   5-WORD ROAM CODE SYSTEM
========================================================= */

const codeWords = [

  [
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
  ],

  [
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
  ],

  [
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
  ],

  [
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
  ],

  [
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
  ]

];


function generateRoomCode() {

  return codeWords
    .map(words => {

      return words[
        Math.floor(
          Math.random() * words.length
        )
      ];

    })
    .join(" ");

}


function normalizeInvitePhrase(value) {

  return String(value || "")
    .toUpperCase()
    .replace(/[·,|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

}


function displayInvitePhrase(value) {

  const normalized =
    normalizeInvitePhrase(value);

  return normalized
    .split(" ")
    .filter(Boolean)
    .join(" · ");

}


function isValidInvitePhrase(value) {

  const words =
    normalizeInvitePhrase(value)
      .split(" ")
      .filter(Boolean);

  return words.length === 5;

}


/* =========================================================
   ACTIVITY DATA
========================================================= */

const activityData = {

  eat: {

    label: "Eat",

    queries: [
      ["amenity", "restaurant"],
      ["amenity", "cafe"],
      ["amenity", "fast_food"]
    ]

  },

  movies: {

    label: "Movies",

    queries: [
      ["amenity", "cinema"]
    ]

  },

  bowling: {

    label: "Bowling",

    queries: [
      ["leisure", "bowling_alley"]
    ]

  },

  coffee: {

    label: "Coffee",

    queries: [
      ["amenity", "cafe"]
    ]

  },

  outdoors: {

    label: "Outdoors",

    queries: [
      ["leisure", "park"],
      ["leisure", "garden"],
      ["leisure", "nature_reserve"]
    ]

  },

  arts: {

    label: "Arts",

    queries: [
      ["tourism", "museum"],
      ["tourism", "gallery"],
      ["amenity", "arts_centre"]
    ]

  },

  games: {

    label: "Games",

    queries: [
      ["leisure", "amusement_arcade"],
      ["leisure", "bowling_alley"]
    ]

  },

  other: {

    label: "Something else",

    queries: [
      ["tourism", "attraction"],
      ["amenity", "community_centre"]
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

    created: "ROAM CREATED",

    dates: "02 / DATES",

    availability: "03 / TIME",

    budget: "04 / BUDGET",

    activity: "05 / VIBE",

    results: "06 / MATCH",

    places: "PLACES",

    final: "DONE",

    join: "JOIN A ROAM",

    joinConfirm: "JOIN A ROAM"

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

  state.participantId =
    null;

  state.joinedRoom =
    false;

  state.roamName =
    "";

  state.location =
    "";

  state.latitude =
    null;

  state.longitude =
    null;

  state.selectedDates =
    [];

  state.selectedTimes =
    [];

  state.participantName =
    "";

  state.budget =
    null;

  state.activity =
    "";

  state.selectedTime =
    null;

  state.selectedPlace =
    null;


  const roamName =
    document.getElementById(
      "roamName"
    );

  if (roamName) {
    roamName.value = "";
  }


  const location =
    document.getElementById(
      "location"
    );

  if (location) {
    location.value = "";
  }


  const participantName =
    document.getElementById(
      "participantName"
    );

  if (participantName) {
    participantName.value = "";
  }


  const groupSize =
    document.getElementById(
      "groupSizeDisplay"
    );

  if (groupSize) {

    groupSize.textContent =
      state.groupSize;

  }


  document
    .querySelectorAll(
      ".budget-card"
    )
    .forEach(card => {

      card.classList.remove(
        "selected"
      );

    });


  const budgetContinue =
    document.getElementById(
      "budgetContinue"
    );

  if (budgetContinue) {
    budgetContinue.disabled = true;
  }


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


  const element =
    document.getElementById(
      "groupSizeDisplay"
    );


  if (element) {

    element.textContent =
      state.groupSize;

  }

}


/* =========================================================
   DETAILS + CREATE ROOM
========================================================= */

async function saveRoamDetails() {

  const nameElement =
    document.getElementById(
      "roamName"
    );


  const locationElement =
    document.getElementById(
      "location"
    );


  const name =
    nameElement
      ? nameElement.value.trim()
      : "";


  const inputLocation =
    locationElement
      ? locationElement.value.trim()
      : "";


  /*
    Use the typed location if there is one.
    Otherwise use the location found by GPS.
  */

  const location =
    inputLocation ||
    state.location ||
    "";


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
    Joined users should not create
    another room.
  */

  if (state.joinedRoom) {

    renderDates();

    showScreen(
      "dates"
    );

    return;

  }


  try {

    /*
      Make sure the organizer token exists.
    */

    state.organizerToken =
      state.organizerToken ||
      generateToken();


    /*
      Generate the new 5-word phrase.
    */

    const code =
      await createUniqueRoomCode();


    console.log(
      "Attempting to create Roam:",
      {
        code,
        name: state.roamName,
        location: state.location,
        groupSize: state.groupSize
      }
    );


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

      console.error(
        "SUPABASE CREATE ERROR:",
        error
      );

      throw error;

    }


    if (!data) {

      throw new Error(
        "Supabase created the request but returned no room."
      );

    }


    state.roomId =
      data.id;

    state.roomCode =
      normalizeInvitePhrase(
        data.code
      );


    /*
      Save the code locally.
    */

    localStorage.setItem(
      "roamRoomCode",
      state.roomCode
    );


    const invite =
      document.getElementById(
        "invitePhrase"
      );


    if (invite) {

      invite.textContent =
        displayInvitePhrase(
          state.roomCode
        );

    }


    setMiniCode(
      state.roomCode
    );


    showScreen(
      "created"
    );


  } catch (error) {

    console.error(
      "CREATE ROOM ERROR:",
      error
    );


    /*
      IMPORTANT:
      Show the actual Supabase error
      instead of hiding it.
    */

    const message =
      error?.message ||
      error?.details ||
      error?.hint ||
      "Unknown database error.";


    showToast(
      `Couldn't create your Roam: ${message}`
    );

  }

}


/* =========================================================
   UNIQUE ROOM CODE
========================================================= */

async function createUniqueRoomCode() {

  for (
    let attempt = 0;
    attempt < 10;
    attempt++
  ) {

    const code =
      normalizeInvitePhrase(
        generateRoomCode()
      );


    if (!isValidInvitePhrase(code)) {

      continue;

    }


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

      console.error(
        "ROOM CODE CHECK ERROR:",
        error
      );

      throw error;

    }


    if (!data) {

      return code;

    }

  }


  throw new Error(
    "Could not create a unique 5-word Roam code."
  );

}


/* =========================================================
   TOKEN
========================================================= */

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
   CREATED SCREEN
========================================================= */

function setMiniCode(code) {

  const mini =
    document.getElementById(
      "roamCodeMini"
    );

  const miniText =
    document.getElementById(
      "roamCodeMiniText"
    );


  if (mini) {

    mini.classList.add(
      "show"
    );

  }


  if (miniText) {

    miniText.textContent =
      displayInvitePhrase(code);

  }

}


async function copyRoamCode() {

  if (!state.roomCode) {

    showToast(
      "No Roam code yet."
    );

    return;

  }


  const code =
    displayInvitePhrase(
      state.roomCode
    );


  try {

    await navigator.clipboard.writeText(
      code
    );


    showToast(
      "Roam code copied."
    );


  } catch {

    window.prompt(
      "Copy your Roam code:",
      code
    );

  }

}


async function shareRoamCode() {

  if (!state.roomCode) {
    return;
  }


  const code =
    displayInvitePhrase(
      state.roomCode
    );


  const text =
    `Join my Roam ✦\n\n${state.roamName}\n\nRoam code:\n${code}`;


  if (
    navigator.share
  ) {

    try {

      await navigator.share({

        title:
          `Join ${state.roamName}`,

        text

      });

      return;

    } catch {

      return;

    }

  }


  try {

    await navigator.clipboard.writeText(
      text
    );


    showToast(
      "Invite copied."
    );

  } catch {

    window.prompt(
      "Copy this invite:",
      text
    );

  }

}


function continueAfterCreate() {

  renderDates();

  showScreen(
    "dates"
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


    date.setHours(
      12,
      0,
      0,
      0
    );


    date.setDate(
      today.getDate() + i
    );


    const year =
      date.getFullYear();


    const monthNumber =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        "0"
      );


    const dayNumber =
      String(
        date.getDate()
      ).padStart(
        2,
        "0"
      );


    const key =
      `${year}-${monthNumber}-${dayNumber}`;


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
                selected =>
                  selected !== key
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

      showToast(
        `Couldn't save the dates: ${error.message || "Unknown error."}`
      );

      return;

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


  if (!grid) {
    return;
  }


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

  const input =
    document.getElementById(
      "participantName"
    );


  const name =
    input
      ? input.value.trim()
      : "";


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

  if (!state.budget) {

    showToast(
      "Pick a budget."
    );

    return;

  }


  /*
    Save participant.
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
        data,
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

          })
          .select()
          .single();


      if (error) {
        throw error;
      }


      state.participantId =
        data.id;


    } catch (error) {

      console.error(
        "PARTICIPANT SAVE ERROR:",
        error
      );


      showToast(
        `Couldn't save your answers: ${error.message || "Unknown error."}`
      );

      return;

    }

  }


  /*
    If a friend joined the Roam,
    they don't choose the activity.
    The organizer does.
  */

  if (state.joinedRoom) {

    const room =
      await getCurrentRoom();


    if (
      room &&
      room.activity
    ) {

      state.activity =
        room.activity;


      await generateResults();

      showScreen(
        "results"
      );

      return;

    }


    showToast(
      "Your answers are saved! The organizer will choose the vibe."
    );


    showScreen(
      "results"
    );


    const list =
      document.getElementById(
        "resultsList"
      );


    if (list) {

      list.innerHTML = `
        <div class="result-card best">
          <div class="result-day">
            ROAM SAVED
          </div>

          <div class="result-time">
            Waiting for the organizer
          </div>

          <div class="result-meta">
            Your availability and budget are saved.
            The organizer is choosing the activity.
          </div>
        </div>
      `;

    }


    return;

  }


  /*
    Organizer chooses activity.
  */

  showScreen(
    "activity"
  );

}


/* =========================================================
   GET CURRENT ROOM
========================================================= */

async function getCurrentRoom() {

  if (!state.roomId) {
    return null;
  }


  const {
    data,
    error
  } =
    await db
      .from("rooms")
      .select("*")
      .eq(
        "id",
        state.roomId
      )
      .maybeSingle();


  if (error) {

    console.error(
      "ROOM FETCH ERROR:",
      error
    );

    return null;

  }


  return data || null;

}


/* =========================================================
   ACTIVITY
========================================================= */

async function selectActivity(
  activity
) {

  state.activity =
    activity;


  /*
    Only the organizer changes
    the room activity.
  */

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

      showToast(
        `Couldn't save the activity: ${error.message || "Unknown error."}`
      );

      return;

    }

  }


  await generateResults();


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


  if (!list) {
    return;
  }


  list.innerHTML = "";


  let results = [];


  /*
    Get all participant availability.
  */

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

            const dates =
              Array.isArray(
                availability.dates
              )
                ? availability.dates
                : [];

            const times =
              Array.isArray(
                availability.times
              )
                ? availability.times
                : [];


            dates.forEach(
              date => {

                times.forEach(
                  time => {

                    const key =
                      `${date}|${time}`;


                    scores[key] =
                      (
                        scores[key] ||
                        0
                      ) + 1;

                  }
                );

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
          ([key, count]) => {

            const [
              date,
              time
            ] =
              key.split("|");


            results.push({

              date,

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
    Fallback.
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


    results =
      dates
        .slice(0, 3)
        .map(
          (date, index) => ({

            date,

            time:
              times[
                index %
                times.length
              ],

            count:
              1

          })
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
          ${escapeHtml(result.time)}
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


  if (!element) {
    return;
  }


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


  const subtitle =
    document.getElementById(
      "placesSubtitle"
    );


  if (!list) {
    return;
  }


  list.innerHTML =
    "";


  if (loading) {

    loading.classList.add(
      "active"
    );

  }


  if (subtitle) {

    subtitle.textContent =
      state.location
        ? `Places near ${state.location}.`
        : "Real places near you.";

  }


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


    if (loading) {

      loading.classList.remove(
        "active"
      );

    }


    renderPlaces(
      places
    );


  } catch (error) {

    console.error(
      "PLACES ERROR:",
      error
    );


    if (loading) {

      loading.classList.remove(
        "active"
      );

    }


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
    config.queries
      .map(
        ([key, value]) => `

          nwr[
            ${key}=${value}
          ](
            around:7000,
            ${latitude},
            ${longitude}
          );

        `
      )
      .join("");


  const query = `

    [out:json][timeout:25];

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
        headers: {
          "Content-Type":
            "text/plain"
        },
        body:
          query
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


  if (!list) {
    return;
  }


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


      const button =
        card.querySelector(
          ".place-action"
        );


      button.addEventListener(
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


  if (!list) {
    return;
  }


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
    "";


  choices.forEach(
    (name, index) => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "place-card";


      card.innerHTML = `

        <div class="place-image">

          <img
            src="${getPlaceImage(
              state.activity,
              index
            )}"
            alt="${escapeHtml(name)}"
          />

        </div>

        <div class="place-content">

          <small>
            ${escapeHtml(label)}
          </small>

          <h3>
            ${escapeHtml(name)}
          </h3>

          <p class="place-info">
            Search for this activity nearby.
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
        .querySelector(
          ".place-action"
        )
        .addEventListener(
          "click",
          () => {

            choosePlace({

              name,

              category:
                label,

              address:
                "Nearby",

              distance:
                null

            });

          }
        );


      list.appendChild(
        card
      );

    }
  );

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


  const finalDate =
    document.getElementById(
      "finalDate"
    );


  if (finalDate) {

    finalDate.textContent =
      `${weekday.toUpperCase()} · ${dateText.toUpperCase()}`;

  }


  const finalTime =
    document.getElementById(
      "finalTime"
    );


  if (finalTime) {

    finalTime.textContent =
      time;

  }


  const finalActivity =
    document.getElementById(
      "finalActivity"
    );


  if (finalActivity) {

    finalActivity.textContent =
      activityData[
        state.activity
      ]?.label ||
      "Hangout";

  }


  const finalPlace =
    document.getElementById(
      "finalPlace"
    );


  if (finalPlace) {

    finalPlace.textContent =
      state.selectedPlace?.name ||
      "Your chosen place";

  }


  const finalPeople =
    document.getElementById(
      "finalPeople"
    );


  if (finalPeople) {

    finalPeople.textContent =
      `${state.groupSize} PEOPLE`;

  }


  const finalBudget =
    document.getElementById(
      "finalBudget"
    );


  if (finalBudget) {

    finalBudget.textContent =
      `~$${state.budget || 0} EACH`;

  }

}


/* =========================================================
   COPY / SHARE FINAL PLAN
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

Roam code: ${displayInvitePhrase(
    state.roomCode || ""
  )}
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


  if (status) {

    status.textContent =
      "Finding you...";

  }


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


          const locationInput =
            document.getElementById(
              "location"
            );


          if (locationInput) {

            locationInput.value =
              address;

          }

        }


        if (status) {

          status.textContent =
            "Location found.";

        }


      } catch {

        if (status) {

          status.textContent =
            "Location found.";

        }

      }

    },

    error => {

      console.error(
        "LOCATION ERROR:",
        error
      );


      if (status) {

        status.textContent =
          "Couldn't access your location.";

      }


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
   JOIN SCREEN
========================================================= */

function openJoinScreen() {

  const input =
    document.getElementById(
      "joinCode"
    );


  const savedCode =
    localStorage.getItem(
      "roamRoomCode"
    );


  if (
    input &&
    savedCode
  ) {

    input.value =
      displayInvitePhrase(
        savedCode
      );

  }


  showScreen(
    "join"
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


  const rawCode =
    input
      ? input.value
      : "";


  const code =
    normalizeInvitePhrase(
      rawCode
    );


  if (
    !isValidInvitePhrase(code)
  ) {

    showToast(
      "Enter all 5 Roam words."
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


    if (error) {

      console.error(
        "JOIN ERROR:",
        error
      );


      showToast(
        `Couldn't find that Roam: ${error.message || "Unknown error."}`
      );

      return;

    }


    if (!data) {

      showToast(
        "That Roam code doesn't exist."
      );

      return;

    }


    loadRoomIntoState(
      data
    );


    localStorage.setItem(
      "roamRoomCode",
      data.code
    );


    setMiniCode(
      data.code
    );


    const roomName =
      document.getElementById(
        "joinRoomName"
      );


    const roomCode =
      document.getElementById(
        "joinRoomCode"
      );


    const roomLocation =
      document.getElementById(
        "joinRoomLocation"
      );


    if (roomName) {

      roomName.textContent =
        data.name;

    }


    if (roomCode) {

      roomCode.textContent =
        displayInvitePhrase(
          data.code
        );

    }


    if (roomLocation) {

      roomLocation.textContent =
        data.location_text ||
        "Location not specified";

    }


    showScreen(
      "joinConfirm"
    );


  } catch (error) {

    console.error(
      "JOIN CRASHED:",
      error
    );


    showToast(
      `Something went wrong joining: ${error.message || "Unknown error."}`
    );

  }

}


/* =========================================================
   LOAD ROOM
========================================================= */

function loadRoomIntoState(
  data
) {

  state.roomId =
    data.id;

  state.roomCode =
    normalizeInvitePhrase(
      data.code
    );

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

}


/* =========================================================
   CONTINUE JOINING
========================================================= */

function continueJoin() {

  state.joinedRoom =
    true;


  const nameInput =
    document.getElementById(
      "participantName"
    );


  if (nameInput) {

    nameInput.value = "";

  }


  renderDates();

  renderTimes();


  showScreen(
    "availability"
  );

}


/* =========================================================
   BACKWARDS COMPATIBILITY
========================================================= */

function showJoinMessage() {

  openJoinScreen();

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
      4000
    );

}


/* =========================================================
   STARTUP
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const groupSize =
      document.getElementById(
        "groupSizeDisplay"
      );


    if (groupSize) {

      groupSize.textContent =
        state.groupSize;

    }


    const savedCode =
      localStorage.getItem(
        "roamRoomCode"
      );


    const joinCode =
      document.getElementById(
        "joinCode"
      );


    if (
      joinCode &&
      savedCode
    ) {

      joinCode.value =
        displayInvitePhrase(
          savedCode
        );

    }


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

window.copyRoamCode =
  copyRoamCode;

window.shareRoamCode =
  shareRoamCode;

window.continueAfterCreate =
  continueAfterCreate;

window.joinRoam =
  joinRoam;

window.continueJoin =
  continueJoin;

window.showJoinMessage =
  showJoinMessage;

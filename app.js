// ==========================================
// ROAM — GROUP HANGOUT PLANNER
// ==========================================


// ------------------------------------------
// APP STATE
// ------------------------------------------

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
  selectedPlace: null
};


// ------------------------------------------
// AVAILABLE TIMES
// ------------------------------------------

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


// ------------------------------------------
// SAMPLE PLACES
// ------------------------------------------

const places = {

  morning: [
    {
      name: "Caffè Roma",
      type: "Coffee & Breakfast",
      description: "A cozy Italian-style café for coffee, pastries, and catching up.",
      price: "$$",
      emoji: "☕"
    },
    {
      name: "La Dolce Vita Café",
      type: "Café",
      description: "Relaxed coffee, pastries, and a perfect slow morning.",
      price: "$",
      emoji: "🥐"
    },
    {
      name: "Mercato Brunch",
      type: "Brunch",
      description: "Fresh food, good coffee, and a lively weekend atmosphere.",
      price: "$$",
      emoji: "🍳"
    }
  ],

  afternoon: [
    {
      name: "Piazza Picnic",
      type: "Park & Picnic",
      description: "Grab some food and spend the afternoon outside.",
      price: "$",
      emoji: "🧺"
    },
    {
      name: "Gelato Corner",
      type: "Dessert",
      description: "Walk around town with gelato and good company.",
      price: "$",
      emoji: "🍨"
    },
    {
      name: "The Market",
      type: "Shopping & Food",
      description: "Browse local vendors, grab snacks, and explore.",
      price: "$$",
      emoji: "🛍️"
    }
  ],

  evening: [
    {
      name: "Trattoria Rosa",
      type: "Italian Dinner",
      description: "Classic pasta, pizza, wine, and a cozy atmosphere.",
      price: "$$",
      emoji: "🍝"
    },
    {
      name: "Osteria Verde",
      type: "Dinner",
      description: "A relaxed neighborhood spot with great food.",
      price: "$$",
      emoji: "🍷"
    },
    {
      name: "Casa Luna",
      type: "Dinner & Drinks",
      description: "Dinner followed by cocktails and conversation.",
      price: "$$$",
      emoji: "🥂"
    }
  ],

  night: [
    {
      name: "Vino Rosso",
      type: "Wine Bar",
      description: "Wine, small plates, and a late-night vibe.",
      price: "$$",
      emoji: "🍷"
    },
    {
      name: "Luna Lounge",
      type: "Lounge",
      description: "Music, drinks, and a fun place to keep the night going.",
      price: "$$",
      emoji: "🎶"
    },
    {
      name: "Midnight Pizza",
      type: "Late Night Food",
      description: "Because every great night eventually needs pizza.",
      price: "$",
      emoji: "🍕"
    }
  ]

};


// ------------------------------------------
// SCREEN NAVIGATION
// ------------------------------------------

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


// ------------------------------------------
// GROUP SIZE
// ------------------------------------------

function changeGroupSize(amount) {

  state.groupSize += amount;

  if (state.groupSize < 2) {
    state.groupSize = 2;
  }

  if (state.groupSize > 30) {
    state.groupSize = 30;
  }

  document.getElementById("groupSize").textContent =
    state.groupSize;
}


// ------------------------------------------
// CREATE ROAM
// ------------------------------------------

function saveCreate() {

  const name = document.getElementById("roamName").value.trim();
  const location = document.getElementById("location").value.trim();

  if (!name) {
    alert("Give your Roam a name first!");
    return;
  }

  if (!location) {
    alert("Add your location first!");
    return;
  }

  state.roamName = name;
  state.location = location;

  createDateOptions();

  showScreen("days");
}


// ------------------------------------------
// CREATE DATES
// ------------------------------------------

function createDateOptions() {

  const grid = document.getElementById("dateGrid");

  grid.innerHTML = "";

  const today = new Date();

  for (let i = 1; i <= 10; i++) {

    const date = new Date(today);

    date.setDate(today.getDate() + i);

    const weekday = date.toLocaleDateString("en-US", {
      weekday: "short"
    });

    const month = date.toLocaleDateString("en-US", {
      month: "short"
    });

    const day = date.getDate();

    const button = document.createElement("button");

    button.className = "date-card";

    button.innerHTML = `
      <small>${weekday}</small>
      <strong>${day}</strong>
      <small>${month}</small>
    `;

    button.dataset.date =
      `${weekday}, ${month} ${day}`;

    button.onclick = () => {

      button.classList.toggle("selected");

      const dateValue = button.dataset.date;

      if (state.dates.includes(dateValue)) {

        state.dates =
          state.dates.filter(d => d !== dateValue);

      } else {

        state.dates.push(dateValue);

      }

    };

    grid.appendChild(button);
  }
}


// ------------------------------------------
// SAVE DAYS
// ------------------------------------------

function saveDays() {

  if (state.dates.length === 0) {
    alert("Choose at least one day.");
    return;
  }

  createTimeOptions();

  showScreen("availability");
}


// ------------------------------------------
// TIME BUTTONS
// ------------------------------------------

function createTimeOptions() {

  const grid = document.getElementById("timeGrid");

  grid.innerHTML = "";

  times.forEach(time => {

    const button = document.createElement("button");

    button.className = "time-button";

    button.textContent = time;

    button.onclick = () => {

      button.classList.toggle("selected");

      if (state.availability.includes(time)) {

        state.availability =
          state.availability.filter(t => t !== time);

      } else {

        state.availability.push(time);

      }

    };

    grid.appendChild(button);

  });
}


// ------------------------------------------
// SAVE AVAILABILITY
// ------------------------------------------

function saveAvailability() {

  const name =
    document.getElementById("participantName").value.trim();

  if (!name) {
    alert("Enter your name.");
    return;
  }

  if (state.availability.length === 0) {
    alert("Choose at least one available time.");
    return;
  }

  state.participantName = name;

  showScreen("budget");
}


// ------------------------------------------
// BUDGET
// ------------------------------------------

function selectBudget(amount) {

  state.budget = amount;

  document
    .querySelectorAll(".budget-grid button")
    .forEach(button => {
      button.classList.remove("selected");
    });

  const selected =
    document.querySelector(
      `[data-budget="${amount}"]`
    );

  if (selected) {
    selected.classList.add("selected");
  }
}


// ------------------------------------------
// FINISH BUDGET
// ------------------------------------------

function finishBudget() {

  if (!state.budget) {
    alert("Choose a budget first.");
    return;
  }

  /*
    Prototype average.

    In a real version, every participant would submit
    their own anonymous budget to the database.
  */

  const sampleBudgets = [
    state.budget,
    30,
    50,
    50,
    30,
    80,
    50,
    30
  ];

  const total =
    sampleBudgets.reduce(
      (sum, value) => sum + value,
      0
    );

  state.averageBudget =
    Math.round(total / sampleBudgets.length);

  generateResults();

  showScreen("results");
}


// ------------------------------------------
// GENERATE RESULTS
// ------------------------------------------

function generateResults() {

  const resultsList =
    document.getElementById("resultsList");

  resultsList.innerHTML = "";

  const chosenDate =
    state.dates[0];

  const availableTimes =
    state.availability.length
      ? state.availability
      : times;

  const results = [];

  availableTimes.slice(0, 3).forEach((time, index) => {

    const randomAvailability =
      Math.max(
        2,
        state.groupSize -
        Math.floor(Math.random() * 4)
      );

    results.push({
      date: chosenDate,
      time: time,
      available: randomAvailability
    });

  });

  state.selectedResult = results[0];

  results.forEach((result, index) => {

    const card =
      document.createElement("div");

    card.className = "result-card";

    card.innerHTML = `
      <div>
        <p>${result.date}</p>
        <h3>${result.time}</h3>
        <p>
          ${getTimeVibe(result.time)}
        </p>
      </div>

      <div>
        <span class="availability-badge">
          ${result.available}/${state.groupSize} available
        </span>
      </div>
    `;

    card.onclick = () => {

      document
        .querySelectorAll(".result-card")
        .forEach(c => c.style.borderColor = "");

      card.style.borderColor =
        "var(--red)";

      state.selectedResult = result;
    };

    resultsList.appendChild(card);

  });

  document.getElementById("averageBudget")
    .textContent =
    `$${state.averageBudget}`;
}


// ------------------------------------------
// TIME VIBE
// ------------------------------------------

function getTimeVibe(time) {

  const hour =
    parseInt(
      time.split(":")[0]
    );

  const isPM =
    time.includes("PM");

  let convertedHour = hour;

  if (isPM && hour !== 12) {
    convertedHour += 12;
  }

  if (convertedHour < 12) {
    return "Coffee & brunch";
  }

  if (convertedHour < 17) {
    return "Explore & snack";
  }

  if (convertedHour < 21) {
    return "Dinner & drinks";
  }

  return "Late night";
}


// ------------------------------------------
// PLACES
// ------------------------------------------

function showPlaces() {

  const result =
    state.selectedResult;

  if (!result) {
    alert("Choose a time first.");
    return;
  }

  const vibe =
    getVibeCategory(result.time);

  const placeOptions =
    places[vibe];

  const container =
    document.getElementById("placesList");

  container.innerHTML = "";

  placeOptions.forEach((place, index) => {

    const card =
      document.createElement("div");

    card.className = "place-card";

    card.innerHTML = `

      <div class="place-image">
        ${place.emoji}
      </div>

      <div class="place-content">

        <h3>${place.name}</h3>

        <p>
          ${place.type}
        </p>

        <p>
          ${place.description}
        </p>

        <div class="place-meta">
          <span>${place.price}</span>
          <span>📍 Nearby</span>
        </div>

      </div>
    `;

    card.onclick = () => {

      document
        .querySelectorAll(".place-card")
        .forEach(c => c.style.borderColor = "");

      card.style.borderColor =
        "var(--red)";

      state.selectedPlace = place;

    };

    if (index === 0) {
      state.selectedPlace = place;
    }

    container.appendChild(card);

  });

  showScreen("places");
}


// ------------------------------------------
// VIBE CATEGORY
// ------------------------------------------

function getVibeCategory(time) {

  const hour =
    parseInt(time.split(":")[0]);

  const isPM =
    time.includes("PM");

  let convertedHour = hour;

  if (isPM && hour !== 12) {
    convertedHour += 12;
  }

  if (convertedHour < 12) {
    return "morning";
  }

  if (convertedHour < 17) {
    return "afternoon";
  }

  if (convertedHour < 21) {
    return "evening";
  }

  return "night";
}


// ------------------------------------------
// FINAL PLAN
// ------------------------------------------

function showFinal() {

  if (!state.selectedResult) {
    alert("Choose a time.");
    return;
  }

  if (!state.selectedPlace) {
    alert("Choose a place.");
    return;
  }

  document.getElementById("finalName")
    .textContent =
    state.roamName;

  document.getElementById("finalDate")
    .textContent =
    state.selectedResult.date;

  document.getElementById("finalTime")
    .textContent =
    state.selectedResult.time;

  document.getElementById("finalPlace")
    .textContent =
    state.selectedPlace.name;

  document.getElementById("finalPeople")
    .textContent =
    `${state.groupSize} people`;

  document.getElementById("finalBudget")
    .textContent =
    `$${state.averageBudget}/person`;

  const message = createFinalMessage();

  document.getElementById("finalMessage")
    .textContent =
    message;

  showScreen("final");
}


// ------------------------------------------
// FINAL MESSAGE
// ------------------------------------------

function createFinalMessage() {

  return `
🇮🇹 IT'S A ROAM!

${state.roamName}

📅 ${state.selectedResult.date}
⏰ ${state.selectedResult.time}
📍 ${state.selectedPlace.name} — ${state.location}
👥 ${state.groupSize} people
💰 Around $${state.averageBudget} per person

${state.selectedPlace.type}.

See you there! 🍝
  `.trim();

}


// ------------------------------------------
// COPY PLAN
// ------------------------------------------

function copyPlan() {

  const message =
    createFinalMessage();

  navigator.clipboard
    .writeText(message)
    .then(() => {

      alert(
        "Your Roam plan was copied! 🇮🇹"
      );

    })
    .catch(() => {

      alert(
        "Couldn't copy automatically. Try again."
      );

    });
}


// ------------------------------------------
// SHARE PLAN
// ------------------------------------------

function sharePlan() {

  const message =
    createFinalMessage();

  if (navigator.share) {

    navigator.share({
      title: "It's a Roam! 🇮🇹",
      text: message
    });

  } else {

    navigator.clipboard
      .writeText(message);

    alert(
      "Sharing isn't supported here, so the plan was copied instead."
    );

  }
}


// ------------------------------------------
// RESTART
// ------------------------------------------

function restart() {

  window.location.reload();

}


// ------------------------------------------
// INITIALIZATION
// ------------------------------------------

document.addEventListener(
  "DOMContentLoaded",
  () => {

    createDateOptions();

  }
);
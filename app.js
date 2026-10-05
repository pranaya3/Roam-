/* =========================================================
   ROAM — APP
   ========================================================= */

(() => {
  "use strict";

  /* =======================================================
     SUPABASE
  ======================================================= */

  let supabaseClient = null;

  const config = window.ROAM_CONFIG || {};

  if (
    window.supabase &&
    config.supabaseUrl &&
    config.supabasePublishableKey &&
    !config.supabasePublishableKey.includes("PASTE_YOUR")
  ) {
    supabaseClient = window.supabase.createClient(
      config.supabaseUrl,
      config.supabasePublishableKey
    );
  }


  /* =======================================================
     STATE
  ======================================================= */

  const state = {
    mode: "organizer",

    room: null,
    roomId: null,

    organizerToken: null,
    participantToken: null,

    roomCode: "",

    roamName: "",
    location: "",
    lat: null,
    lng: null,

    groupSize: 4,
    organizerName: "",

    candidateDates: [],
    selectedDates: [],

    selectedTimes: [],

    budget: null,

    activity: "",
    customPlace: "",
    customPlaceAddress: "",

    selectedPlace: null,

    places: [],

    joinCode: "",
    joinName: "",

    bestTimes: [],

    loading: false
  };


  /* =======================================================
     CONSTANTS
  ======================================================= */

  const ACTIVITIES = [
    {
      id: "food",
      name: "Food & drinks",
      image:
        "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=85",
      tags: ["amenity=restaurant", "amenity=bar", "amenity=pub", "amenity=food_court"]
    },

    {
      id: "coffee",
      name: "Coffee & dessert",
      image:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=85",
      tags: ["amenity=cafe", "shop=confectionery", "amenity=ice_cream"]
    },

    {
      id: "outdoors",
      name: "Outdoors",
      image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85",
      tags: ["leisure=park", "leisure=garden", "tourism=picnic_site"]
    },

    {
      id: "arts",
      name: "Arts & culture",
      image:
        "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=900&q=85",
      tags: ["tourism=museum", "tourism=gallery", "amenity=arts_centre"]
    },

    {
      id: "games",
      name: "Games",
      image:
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=85",
      tags: ["leisure=bowling_alley", "leisure=amusement_arcade", "leisure=escape_game"]
    },

    {
      id: "shopping",
      name: "Shopping",
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=85",
      tags: ["shop=mall", "shop=department_store", "shop=clothes"]
    },

    {
      id: "custom",
      name: "My own place",
      image:
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85",
      tags: []
    }
  ];


  const BUDGETS = [
    {
      value: 15,
      label: "$0–15",
      description: "Keep it cheap"
    },

    {
      value: 30,
      label: "$15–30",
      description: "Casual"
    },

    {
      value: 50,
      label: "$30–50",
      description: "A little extra"
    },

    {
      value: 75,
      label: "$50–75",
      description: "Treat yourself"
    }
  ];


  const TIME_OPTIONS = [
    "Morning",
    "Late morning",
    "Afternoon",
    "Late afternoon",
    "Early evening",
    "Evening",
    "Night"
  ];


  /* =======================================================
     HELPERS
  ======================================================= */

  const $ = (id) => document.getElementById(id);


  function createToken() {
    if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID() + "-" + Date.now();
    }

    return (
      Math.random().toString(36).slice(2) +
      Math.random().toString(36).slice(2) +
      Date.now()
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


  function normalizeCode(value) {
    return String(value || "")
      .trim()
      .toUpperCase();
  }


  function showToast(message) {
    const toast = $("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }


  function setLoading(button, loading, loadingText = "Working...") {
    if (!button) return;

    if (loading) {
      button.dataset.originalText = button.textContent;
      button.textContent = loadingText;
      button.disabled = true;
    } else {
      button.textContent =
        button.dataset.originalText || button.textContent;
      delete button.dataset.originalText;
      button.disabled = false;
    }
  }


  function requireSupabase() {
    if (!supabaseClient) {
      showToast(
        "Roam needs your Supabase Publishable key in config.js."
      );

      console.error(
        "Supabase is not initialized. Check config.js."
      );

      return false;
    }

    return true;
  }


  function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.remove("active");
    });

    const screen = $(screenId);

    if (screen) {
      screen.classList.add("active");
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  }


  function resetState() {
    state.mode = "organizer";

    state.room = null;
    state.roomId = null;

    state.organizerToken = null;
    state.participantToken = null;

    state.roomCode = "";

    state.roamName = "";
    state.location = "";
    state.lat = null;
    state.lng = null;

    state.groupSize = 4;
    state.organizerName = "";

    state.candidateDates = [];
    state.selectedDates = [];

    state.selectedTimes = [];

    state.budget = null;

    state.activity = "";
    state.customPlace = "";
    state.customPlaceAddress = "";

    state.selectedPlace = null;

    state.places = [];

    state.joinCode = "";
    state.joinName = "";

    state.bestTimes = [];
  }


  /* =======================================================
     HOME / NAVIGATION
  ======================================================= */

  function goHome() {
    resetState();

    $("roamName").value = "";
    $("location").value = "";
    $("organizerName").value = "";
    $("groupSize").value = "4";

    showScreen("home");
  }


  function startRoam() {
    state.mode = "organizer";

    renderCandidateDates();

    showScreen("create");
  }


  function openJoin() {
    state.mode = "join";

    $("joinCode").value = "";
    $("joinName").value = "";

    showScreen("join");
  }


  /* =======================================================
     LOCATION
  ======================================================= */

  function useMyLocation() {
    const status = $("locationStatus");

    if (!navigator.geolocation) {
      showToast("Location isn't supported by this browser.");
      return;
    }

    status.textContent = "Finding your location...";

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        state.lat = position.coords.latitude;
        state.lng = position.coords.longitude;

        try {
          const result = await reverseGeocode(
            state.lat,
            state.lng
          );

          if (result) {
            state.location = result;

            $("location").value = result;

            status.textContent = "Location found.";
          } else {
            status.textContent =
              "Location found. You can edit it above.";
          }
        } catch (error) {
          console.error(error);

          status.textContent =
            "Location found. You can edit it above.";
        }
      },

      () => {
        status.textContent = "";

        showToast(
          "We couldn't access your location. Enter it manually."
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }


  async function reverseGeocode(lat, lng) {
    const url =
      "https://nominatim.openstreetmap.org/reverse" +
      `?lat=${encodeURIComponent(lat)}` +
      `&lon=${encodeURIComponent(lng)}` +
      "&format=json" +
      "&zoom=10";

    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Reverse geocoding failed.");
    }

    const data = await response.json();

    return (
      data.display_name ||
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      ""
    );
  }


  /* =======================================================
     DATE SELECTION
  ======================================================= */

  function buildCandidateDates() {
    const dates = [];

    const today = new Date();

    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);

      date.setHours(12, 0, 0, 0);
      date.setDate(today.getDate() + i);

      dates.push(date);
    }

    return dates;
  }


  function formatDateValue(date) {
    return date.toISOString().split("T")[0];
  }


  function renderCandidateDates() {
    const grid = $("dateGrid");

    if (!grid) return;

    const dates = buildCandidateDates();

    state.candidateDates = dates.map(formatDateValue);

    grid.innerHTML = dates
      .map((date) => {
        const value = formatDateValue(date);

        const weekday = date.toLocaleDateString(
          undefined,
          { weekday: "short" }
        );

        const month = date.toLocaleDateString(
          undefined,
          { month: "short" }
        );

        const day = date.getDate();

        return `
          <button
            type="button"
            class="date-card"
            data-date="${value}"
          >
            <strong>${day}</strong>
            <span>${weekday}</span>
            <small>${month}</small>
          </button>
        `;
      })
      .join("");

    grid.querySelectorAll(".date-card").forEach((button) => {
      button.addEventListener("click", () => {
        const date = button.dataset.date;

        if (state.selectedDates.includes(date)) {
          state.selectedDates =
            state.selectedDates.filter(
              (item) => item !== date
            );

          button.classList.remove("selected");
        } else {
          state.selectedDates.push(date);

          button.classList.add("selected");
        }

        updateDateButton();
      });
    });

    updateDateButton();
  }


  function updateDateButton() {
    const button = $("datesNext");

    if (!button) return;

    button.disabled =
      state.selectedDates.length === 0;
  }


  /* =======================================================
     TIME SELECTION
  ======================================================= */

  function renderTimes() {
    const grid = $("timeGrid");

    if (!grid) return;

    grid.innerHTML = TIME_OPTIONS
      .map(
        (time) => `
          <button
            type="button"
            class="time-card ${
              state.selectedTimes.includes(time)
                ? "selected"
                : ""
            }"
            data-time="${escapeHtml(time)}"
          >
            ${escapeHtml(time)}
          </button>
        `
      )
      .join("");

    grid.querySelectorAll(".time-card").forEach((button) => {
      button.addEventListener("click", () => {
        const time = button.dataset.time;

        if (state.selectedTimes.includes(time)) {
          state.selectedTimes =
            state.selectedTimes.filter(
              (item) => item !== time
            );

          button.classList.remove("selected");
        } else {
          state.selectedTimes.push(time);

          button.classList.add("selected");
        }

        updateTimeButton();
      });
    });

    updateTimeButton();
  }


  function updateTimeButton() {
    const button = $("timesNext");

    if (!button) return;

    button.disabled =
      state.selectedTimes.length === 0;
  }


  /* =======================================================
     BUDGET
  ======================================================= */

  function renderBudgets() {
    const grid = $("budgetGrid");

    if (!grid) return;

    grid.innerHTML = BUDGETS
      .map(
        (budget) => `
          <button
            type="button"
            class="budget-card ${
              state.budget === budget.value
                ? "selected"
                : ""
            }"
            data-budget="${budget.value}"
          >
            <strong>${escapeHtml(budget.label)}</strong>
            <span>${escapeHtml(budget.description)}</span>
          </button>
        `
      )
      .join("");

    grid.querySelectorAll(".budget-card").forEach((button) => {
      button.addEventListener("click", () => {
        const value = Number(button.dataset.budget);

        state.budget = value;

        grid
          .querySelectorAll(".budget-card")
          .forEach((item) => {
            item.classList.remove("selected");
          });

        button.classList.add("selected");
      });
    });
  }


  /* =======================================================
     ACTIVITY
  ======================================================= */

  function renderActivities() {
    const grid = $("activityGrid");

    if (!grid) return;

    grid.innerHTML = ACTIVITIES
      .map(
        (activity) => `
          <button
            type="button"
            class="activity-card ${
              state.activity === activity.id
                ? "selected"
                : ""
            }"
            data-activity="${activity.id}"
          >
            <img
              src="${activity.image}"
              alt="${escapeHtml(activity.name)}"
              loading="lazy"
            >

            <span>
              ${escapeHtml(activity.name)}
            </span>
          </button>
        `
      )
      .join("");

    grid
      .querySelectorAll(".activity-card")
      .forEach((button) => {
        button.addEventListener("click", () => {
          state.activity =
            button.dataset.activity;

          state.selectedPlace = null;

          grid
            .querySelectorAll(".activity-card")
            .forEach((item) => {
              item.classList.remove("selected");
            });

          button.classList.add("selected");

          updateCustomPlaceVisibility();
          updateActivityButton();
        });
      });

    updateCustomPlaceVisibility();
    updateActivityButton();
  }


  function updateCustomPlaceVisibility() {
    const box = $("customPlaceBox");

    if (!box) return;

    const isCustom =
      state.activity === "custom";

    box.hidden = !isCustom;

    if (!isCustom) {
      $("customPlace").value = "";
      $("customPlaceAddress").value = "";

      state.customPlace = "";
      state.customPlaceAddress = "";
    }

    updateActivityButton();
  }


  function updateActivityButton() {
    const button = $("activityNext");

    if (!button) return;

    if (!state.activity) {
      button.disabled = true;
      return;
    }

    if (state.activity === "custom") {
      button.disabled =
        $("customPlace").value.trim().length === 0;

      return;
    }

    button.disabled = false;
  }


  /* =======================================================
     ROOM CODE
  ======================================================= */

  const CODE_WORDS = [
    "ORANGE",
    "PEACH",
    "ROAM",
    "SUNSET",
    "CANAL",
    "GONDOLA",
    "CITRUS",
    "BREEZE",
    "WANDER",
    "PICNIC",
    "GELATO",
    "VISTA",
    "LAGOON",
    "MANGO",
    "PALM",
    "SIENNA",
    "SPRING",
    "WEEKEND",
    "SUNNY",
    "MOSAIC"
  ];


  async function generateUniqueCode() {
    if (!supabaseClient) {
      return (
        CODE_WORDS[
          Math.floor(Math.random() * CODE_WORDS.length)
        ]
      );
    }

    const shuffled = [...CODE_WORDS].sort(
      () => Math.random() - 0.5
    );

    for (const word of shuffled) {
      const { data, error } = await supabaseClient
        .from("rooms")
        .select("id")
        .eq("code", word)
        .maybeSingle();

      if (error) {
        console.error(error);
        continue;
      }

      if (!data) {
        return word;
      }
    }

    return (
      CODE_WORDS[
        Math.floor(Math.random() * CODE_WORDS.length)
      ] +
      Math.floor(10 + Math.random() * 90)
    );
  }


  /* =======================================================
     CREATE ROOM
  ======================================================= */

  async function createRoom() {
    if (!requireSupabase()) return;

    const button = $("activityNext");

    state.roamName =
      $("roamName").value.trim();

    state.location =
      $("location").value.trim();

    state.groupSize =
      Number($("groupSize").value);

    state.organizerName =
      $("organizerName").value.trim();

    state.customPlace =
      $("customPlace").value.trim();

    state.customPlaceAddress =
      $("customPlaceAddress").value.trim();

    if (!state.roamName) {
      showToast("Give your Roam a name.");
      showScreen("create");
      return;
    }

    if (!state.location) {
      showToast("Add a location.");
      showScreen("create");
      return;
    }

    if (
      !state.groupSize ||
      state.groupSize < 2 ||
      state.groupSize > 50
    ) {
      showToast("Group size must be between 2 and 50.");
      showScreen("create");
      return;
    }

    if (!state.organizerName) {
      showToast("Add your name.");
      showScreen("create");
      return;
    }

    if (!state.selectedDates.length) {
      showToast("Choose at least one day.");
      showScreen("dates");
      return;
    }

    if (!state.selectedTimes.length) {
      showToast("Choose at least one time.");
      showScreen("times");
      return;
    }

    if (!state.activity) {
      showToast("Choose an activity.");
      showScreen("activity");
      return;
    }

    if (
      state.activity === "custom" &&
      !state.customPlace
    ) {
      showToast("Add the place you want to use.");
      return;
    }

    setLoading(button, true, "Creating...");

    try {
      state.organizerToken = createToken();

      state.roomCode =
        await generateUniqueCode();

      const roomInsert = {
        code: state.roomCode,

        name: state.roamName,

        location_text: state.location,

        lat: state.lat,

        lng: state.lng,

        group_size: state.groupSize,

        candidate_dates:
          state.selectedDates,

        activity: state.activity,

        organizer_token:
          state.organizerToken
      };

      const {
        data: room,
        error: roomError
      } = await supabaseClient
        .from("rooms")
        .insert(roomInsert)
        .select()
        .single();

      if (roomError) {
        console.error(roomError);

        throw roomError;
      }

      state.room = room;
      state.roomId = room.id;

      const participantInsert = {
        room_id: room.id,

        name: state.organizerName,

        participant_token:
          state.organizerToken,

        availability: {
          dates: state.selectedDates,
          times: state.selectedTimes
        },

        budget: state.budget
      };

      const {
        error: participantError
      } = await supabaseClient
        .from("participants")
        .insert(participantInsert);

      if (participantError) {
        console.error(participantError);

        throw participantError;
      }

      localStorage.setItem(
        "roamOrganizerToken",
        state.organizerToken
      );

      localStorage.setItem(
        "roamRoomId",
        room.id
      );

      $("roomCode").textContent =
        state.roomCode;

      showScreen("code");

    } catch (error) {
      console.error("Create Roam error:", error);

      showToast(
        "Roam couldn't save that yet. Check your connection and try again."
      );

    } finally {
      setLoading(button, false);
    }
  }


  /* =======================================================
     JOIN ROOM
  ======================================================= */

  async function findRoam() {
    if (!requireSupabase()) return;

    const button = $("findRoam");

    const code =
      normalizeCode($("joinCode").value);

    if (!code) {
      showToast("Enter a Roam code.");
      return;
    }

    setLoading(button, true, "Finding...");

    try {
      const {
        data: room,
        error
      } = await supabaseClient
        .from("rooms")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (error) {
        console.error(error);
        throw error;
      }

      if (!room) {
        showToast("We couldn't find that Roam.");
        return;
      }

      state.mode = "join";

      state.room = room;
      state.roomId = room.id;
      state.roomCode = room.code;

      state.roamName = room.name;
      state.location = room.location_text;

      state.lat = room.lat;
      state.lng = room.lng;

      state.groupSize = room.group_size;

      state.candidateDates =
        Array.isArray(room.candidate_dates)
          ? room.candidate_dates
          : [];

      state.activity =
        room.activity || "";

      state.joinCode = code;

      $("joinTitle").textContent =
        room.name;

      $("joinLocation").textContent =
        room.location_text;

      $("joinCodeDisplay").textContent =
        room.code;

      showScreen("joinConfirm");

    } catch (error) {
      console.error("Find Roam error:", error);

      showToast(
        "Roam couldn't be found right now. Check your connection and try again."
      );

    } finally {
      setLoading(button, false);
    }
  }


  /* =======================================================
     JOIN PARTICIPANT
  ======================================================= */

  async function startJoinAvailability() {
    const name =
      $("joinName").value.trim();

    if (!name) {
      showToast("Enter your name.");
      return;
    }

    state.joinName = name;

    state.selectedDates = [];
    state.selectedTimes = [];

    renderJoinDates();

    showScreen("dates");
  }


  function renderJoinDates() {
    const grid = $("dateGrid");

    if (!grid) return;

    const dates =
      state.candidateDates || [];

    if (!dates.length) {
      grid.innerHTML = `
        <div class="empty-card">
          <strong>No dates were added.</strong>
        </div>
      `;

      return;
    }

    grid.innerHTML = dates
      .map((value) => {
        const date =
          new Date(`${value}T12:00:00`);

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

        return `
          <button
            type="button"
            class="date-card"
            data-date="${escapeHtml(value)}"
          >
            <strong>${day}</strong>
            <span>${weekday}</span>
            <small>${month}</small>
          </button>
        `;
      })
      .join("");

    grid
      .querySelectorAll(".date-card")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const date =
            button.dataset.date;

          if (
            state.selectedDates.includes(date)
          ) {
            state.selectedDates =
              state.selectedDates.filter(
                (item) => item !== date
              );

            button.classList.remove("selected");

          } else {
            state.selectedDates.push(date);

            button.classList.add("selected");
          }

          updateDateButton();
        });
      });

    updateDateButton();

    $("datesHeading").textContent =
      "Which days are you available?";

    $("datesDescription").textContent =
      "Select every day you could hang out.";
  }


  /* =======================================================
     JOIN TIME / BUDGET
  ======================================================= */

  async function saveJoinParticipant() {
    if (!requireSupabase()) return;

    if (!state.selectedDates.length) {
      showToast("Choose at least one day.");
      showScreen("dates");
      return;
    }

    if (!state.selectedTimes.length) {
      showToast("Choose at least one time.");
      showScreen("times");
      return;
    }

    const button = $("budgetNext");

    state.participantToken =
      createToken();

    setLoading(button, true, "Joining...");

    try {
      const participantInsert = {
        room_id: state.roomId,

        name: state.joinName,

        participant_token:
          state.participantToken,

        availability: {
          dates: state.selectedDates,
          times: state.selectedTimes
        },

        budget: state.budget
      };

      const {
        error
      } = await supabaseClient
        .from("participants")
        .insert(participantInsert);

      if (error) {
        console.error(error);
        throw error;
      }

      localStorage.setItem(
        "roamParticipantToken",
        state.participantToken
      );

      localStorage.setItem(
        "roamRoomId",
        state.roomId
      );

      await loadRoomAndBuildPlan();

    } catch (error) {
      console.error(
        "Join participant error:",
        error
      );

      showToast(
        "We couldn't save your availability. Try again."
      );

    } finally {
      setLoading(button, false);
    }
  }


  /* =======================================================
     ROOM PARTICIPANTS / BEST TIMES
  ======================================================= */

  async function getParticipants() {
    const {
      data,
      error
    } = await supabaseClient
      .from("participants")
      .select("*")
      .eq("room_id", state.roomId);

    if (error) {
      throw error;
    }

    return data || [];
  }


  function calculateBestTimes(participants) {
    if (!participants.length) {
      return [];
    }

    const candidateDates =
      state.candidateDates || [];

    const dateScores = {};

    candidateDates.forEach((date) => {
      dateScores[date] = 0;
    });

    participants.forEach((participant) => {
      const availability =
        participant.availability || {};

      const dates =
        Array.isArray(availability.dates)
          ? availability.dates
          : [];

      dates.forEach((date) => {
        if (dateScores[date] !== undefined) {
          dateScores[date]++;
        }
      });
    });

    const sortedDates =
      Object.entries(dateScores)
        .sort((a, b) => b[1] - a[1]);


    const timeScores = {};

    TIME_OPTIONS.forEach((time) => {
      timeScores[time] = 0;
    });

    participants.forEach((participant) => {
      const availability =
        participant.availability || {};

      const times =
        Array.isArray(availability.times)
          ? availability.times
          : [];

      times.forEach((time) => {
        if (timeScores[time] !== undefined) {
          timeScores[time]++;
        }
      });
    });

    const sortedTimes =
      Object.entries(timeScores)
        .sort((a, b) => b[1] - a[1]);


    const bestDate =
      sortedDates[0]?.[0] ||
      candidateDates[0] ||
      null;

    const bestTimes =
      sortedTimes
        .filter((item) => item[1] > 0)
        .slice(0, 3)
        .map((item) => ({
          time: item[0],
          count: item[1]
        }));


    /*
      If everyone overlaps on a time, put those
      times first. Otherwise Roam still gives
      the strongest group matches.
    */

    state.bestTimes = bestTimes;

    return {
      date: bestDate,
      dateCount:
        sortedDates[0]?.[1] || 0,
      times: bestTimes
    };
  }


  async function loadRoomAndBuildPlan() {
    if (!requireSupabase()) return;

    try {
      const {
        data: room,
        error
      } = await supabaseClient
        .from("rooms")
        .select("*")
        .eq("id", state.roomId)
        .single();

      if (error) {
        throw error;
      }

      state.room = room;

      state.candidateDates =
        Array.isArray(room.candidate_dates)
          ? room.candidate_dates
          : [];

      state.activity =
        room.activity || "";

      const participants =
        await getParticipants();

      const matching =
        calculateBestTimes(participants);

      state.bestTimes =
        matching.times || [];

      if (
        state.mode === "organizer" &&
        state.activity === "custom"
      ) {
        await showCustomPlaceResult();

        return;
      }

      await loadPlaces();

    } catch (error) {
      console.error(
        "Build plan error:",
        error
      );

      showToast(
        "Roam couldn't build your plan right now."
      );
    }
  }


  /* =======================================================
     PLACES
  ======================================================= */

  async function loadPlaces() {
    const list = $("placesList");

    if (!list) return;

    list.innerHTML = `
      <div class="loading-card">
        Finding places near ${escapeHtml(
          state.location
        )}...
      </div>
    `;

    $("placesNext").disabled = true;

    try {
      const activity =
        ACTIVITIES.find(
          (item) =>
            item.id === state.activity
        );

      if (!activity) {
        throw new Error("Unknown activity.");
      }

      const places =
        await searchPlaces(
          activity.tags
        );

      state.places = places;

      renderPlaces();

      showScreen("places");

    } catch (error) {
      console.error(
        "Place search error:",
        error
      );

      state.places = [];

      renderPlaces();

      showScreen("places");
    }
  }


  async function geocodeLocation() {
    if (state.lat && state.lng) {
      return {
        lat: state.lat,
        lng: state.lng
      };
    }

    const query =
      encodeURIComponent(state.location);

    const url =
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;

    const response =
      await fetch(url, {
        headers: {
          Accept: "application/json"
        }
      });

    if (!response.ok) {
      throw new Error("Geocoding failed.");
    }

    const data =
      await response.json();

    if (!data.length) {
      throw new Error(
        "Could not locate the area."
      );
    }

    state.lat =
      Number(data[0].lat);

    state.lng =
      Number(data[0].lon);

    return {
      lat: state.lat,
      lng: state.lng
    };
  }


  async function searchPlaces(tags) {
    const location =
      await geocodeLocation();

    const radius = 8000;

    const tagQueries =
      tags.map((tag) => {
        const [key, value] =
          tag.split("=");

        return `
          node[
            "${key}"="${value}"
          ](
            around:${radius},
            ${location.lat},
            ${location.lng}
          );

          way[
            "${key}"="${value}"
          ](
            around:${radius},
            ${location.lat},
            ${location.lng}
          );

          relation[
            "${key}"="${value}"
          ](
            around:${radius},
            ${location.lat},
            ${location.lng}
          );
        `;
      }).join("\n");

    const query = `
      [out:json][timeout:20];

      (
        ${tagQueries}
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
              "text/plain;charset=UTF-8"
          },

          body: query
        }
      );

    if (!response.ok) {
      throw new Error(
        "Place search failed."
      );
    }

    const data =
      await response.json();

    const results =
      (data.elements || [])
        .map((element) => {
          const tags =
            element.tags || {};

          const lat =
            element.lat ??
            element.center?.lat;

          const lng =
            element.lon ??
            element.center?.lon;

          return {
            id: `${element.type}-${element.id}`,

            name:
              tags.name ||
              tags.brand ||
              "Unnamed place",

            address:
              tags["addr:street"]
                ? `${tags["addr:housenumber"] || ""} ${
                    tags["addr:street"]
                  }`
                    .trim()
                : "",

            lat,
            lng,

            website:
              tags.website ||
              tags["contact:website"] ||
              "",

            category:
              tags.amenity ||
              tags.shop ||
              tags.tourism ||
              tags.leisure ||
              ""
          };
        })
        .filter(
          (place) =>
            place.name !==
            "Unnamed place"
        )
        .filter(
          (place, index, array) =>
            array.findIndex(
              (item) =>
                item.name.toLowerCase() ===
                place.name.toLowerCase()
            ) === index
        )
        .slice(0, 8);

    return results;
  }


  function renderPlaces() {
    const list = $("placesList");

    if (!list) return;

    if (!state.places.length) {
      list.innerHTML = `
        <div class="empty-card">
          <strong>
            We couldn't find a place automatically.
          </strong>

          <br><br>

          Try again later, or choose your own place
          when creating a Roam.
        </div>
      `;

      $("placesNext").disabled = true;

      return;
    }

    list.innerHTML =
      state.places
        .map(
          (place, index) => `
            <button
              type="button"
              class="place-card ${
                state.selectedPlace?.id ===
                place.id
                  ? "selected"
                  : ""
              }"
              data-place-id="${escapeHtml(
                place.id
              )}"
            >

              <span class="place-number">
                ${index + 1}
              </span>

              <span class="place-info">

                <strong>
                  ${escapeHtml(place.name)}
                </strong>

                ${
                  place.address
                    ? `
                      <span>
                        ${escapeHtml(
                          place.address
                        )}
                      </span>
                    `
                    : ""
                }

              </span>

              <span class="place-check">
                ${
                  state.selectedPlace?.id ===
                  place.id
                    ? "✓"
                    : "→"
                }
              </span>

            </button>
          `
        )
        .join("");

    list
      .querySelectorAll(".place-card")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const id =
              button.dataset.placeId;

            state.selectedPlace =
              state.places.find(
                (place) =>
                  place.id === id
              ) || null;

            renderPlaces();

            $("placesNext").disabled =
              !state.selectedPlace;
          }
        );
      });

    $("placesNext").disabled =
      !state.selectedPlace;
  }


  /* =======================================================
     CUSTOM PLACE
  ======================================================= */

  async function showCustomPlaceResult() {
    state.selectedPlace = {
      id: "custom",
      name: state.customPlace,
      address:
        state.customPlaceAddress,
      custom: true
    };

    await finishPlan();
  }


  /* =======================================================
     FINAL PLAN
  ======================================================= */

  function formatPlanDate(value) {
    if (!value) {
      return "Time to be decided";
    }

    const date =
      new Date(`${value}T12:00:00`);

    return date.toLocaleDateString(
      undefined,
      {
        weekday: "long",
        month: "long",
        day: "numeric"
      }
    );
  }


  function getActivityName() {
    const activity =
      ACTIVITIES.find(
        (item) =>
          item.id === state.activity
      );

    return (
      activity?.name ||
      "Hanging out"
    );
  }


  function getBestTimeText() {
    if (!state.bestTimes.length) {
      return "Time to be decided";
    }

    return state.bestTimes
      .slice(0, 3)
      .map((item) => item.time)
      .join(" • ");
  }


  function renderFinalPlan() {
    const container =
      $("finalPlan");

    if (!container) return;

    const date =
      calculateBestDate();

    const place =
      state.selectedPlace;

    const placeName =
      place?.name ||
      "Place to be decided";

    const placeAddress =
      place?.address ||
      "";

    container.innerHTML = `
      <div class="plan-row">
        <span>WHEN</span>

        <strong>
          ${escapeHtml(
            formatPlanDate(date)
          )}

          <br>

          ${escapeHtml(
            getBestTimeText()
          )}
        </strong>
      </div>


      <div class="plan-row">
        <span>WHERE</span>

        <strong>
          ${escapeHtml(placeName)}

          ${
            placeAddress
              ? `
                <br>
                <small>
                  ${escapeHtml(
                    placeAddress
                  )}
                </small>
              `
              : ""
          }
        </strong>
      </div>


      <div class="plan-row">
        <span>VIBE</span>

        <strong>
          ${escapeHtml(
            getActivityName()
          )}
        </strong>
      </div>


      <div class="plan-row">
        <span>ROAM CODE</span>

        <strong>
          ${escapeHtml(
            state.roomCode
          )}
        </strong>
      </div>
    `;

    $("finalHeading").textContent =
      state.roamName ||
      "You're going out.";
  }


  function calculateBestDate() {
    if (!state.room) {
      return state.candidateDates[0] || null;
    }

    const candidateDates =
      state.candidateDates || [];

    return candidateDates[0] || null;
  }


  async function finishPlan() {
    renderFinalPlan();

    showScreen("final");
  }


  async function selectPlace() {
    if (!state.selectedPlace) {
      showToast("Pick a place first.");
      return;
    }

    await finishPlan();
  }


  /* =======================================================
     COPY
  ======================================================= */

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);

      showToast("Copied!");
    } catch (error) {
      console.error(error);

      showToast(
        "Couldn't copy automatically."
      );
    }
  }


  function buildCopyPlan() {
    const date =
      calculateBestDate();

    const place =
      state.selectedPlace;

    const placeName =
      place?.name ||
      "Place to be decided";

    const placeAddress =
      place?.address ||
      "";

    return `${state.roamName}

WHEN
${formatPlanDate(date)}
${getBestTimeText()}

WHERE
${placeName}${placeAddress ? `\n${placeAddress}` : ""}

VIBE
${getActivityName()}

ROAM CODE
${state.roomCode}`;
  }


  /* =======================================================
     EVENT HANDLERS
  ======================================================= */

  function bindEvents() {

    /* Home */

    $("homeBtn")
      ?.addEventListener(
        "click",
        goHome
      );

    $("startBtn")
      ?.addEventListener(
        "click",
        startRoam
      );

    $("joinNavBtn")
      ?.addEventListener(
        "click",
        openJoin
      );


    /* Location */

    $("locateBtn")
      ?.addEventListener(
        "click",
        useMyLocation
      );


    /* Create */

    $("createNext")
      ?.addEventListener(
        "click",
        () => {
          state.roamName =
            $("roamName").value.trim();

          state.location =
            $("location").value.trim();

          state.groupSize =
            Number($("groupSize").value);

          state.organizerName =
            $("organizerName")
              .value
              .trim();

          if (!state.roamName) {
            showToast(
              "Give your Roam a name."
            );

            return;
          }

          if (!state.location) {
            showToast(
              "Add a location."
            );

            return;
          }

          if (
            !state.groupSize ||
            state.groupSize < 2 ||
            state.groupSize > 50
          ) {
            showToast(
              "Choose a group size from 2 to 50."
            );

            return;
          }

          if (!state.organizerName) {
            showToast(
              "Add your name."
            );

            return;
          }

          state.selectedDates = [];

          renderCandidateDates();

          showScreen("dates");
        }
      );


    /* Dates */

    $("datesNext")
      ?.addEventListener(
        "click",
        () => {
          if (
            !state.selectedDates.length
          ) {
            showToast(
              "Choose at least one day."
            );

            return;
          }

          renderTimes();

          showScreen("times");
        }
      );


    $("datesBack")
      ?.addEventListener(
        "click",
        () => {
          showScreen(
            state.mode === "join"
              ? "joinConfirm"
              : "create"
          );
        }
      );


    /* Times */

    $("timesNext")
      ?.addEventListener(
        "click",
        () => {
          if (
            !state.selectedTimes.length
          ) {
            showToast(
              "Choose at least one time."
            );

            return;
          }

          renderBudgets();

          showScreen("budget");
        }
      );


    $("timesBack")
      ?.addEventListener(
        "click",
        () => {
          showScreen("dates");
        }
      );


    /* Budget */

    $("budgetNext")
      ?.addEventListener(
        "click",
        async () => {

          if (state.mode === "join") {
            await saveJoinParticipant();
            return;
          }

          renderActivities();

          showScreen("activity");
        }
      );


    $("skipBudget")
      ?.addEventListener(
        "click",
        async () => {

          state.budget = null;

          if (state.mode === "join") {
            await saveJoinParticipant();
            return;
          }

          renderActivities();

          showScreen("activity");
        }
      );


    $("budgetBack")
      ?.addEventListener(
        "click",
        () => {
          showScreen("times");
        }
      );


    /* Activity */

    $("customPlace")
      ?.addEventListener(
        "input",
        () => {
          state.customPlace =
            $("customPlace")
              .value
              .trim();

          updateActivityButton();
        }
      );


    $("customPlaceAddress")
      ?.addEventListener(
        "input",
        () => {
          state.customPlaceAddress =
            $("customPlaceAddress")
              .value
              .trim();
        }
      );


    $("activityNext")
      ?.addEventListener(
        "click",
        createRoom
      );


    $("activityBack")
      ?.addEventListener(
        "click",
        () => {
          showScreen("budget");
        }
      );


    /* Code */

    $("copyCode")
      ?.addEventListener(
        "click",
        () => {
          copyText(
            state.roomCode
          );
        }
      );


    $("viewRoam")
      ?.addEventListener(
        "click",
        async () => {
          await loadRoomAndBuildPlan();
        }
      );


    /* Join */

    $("findRoam")
      ?.addEventListener(
        "click",
        findRoam
      );


    $("joinNext")
      ?.addEventListener(
        "click",
        startJoinAvailability
      );


    /* Places */

    $("placesNext")
      ?.addEventListener(
        "click",
        selectPlace
      );


    $("placesBack")
      ?.addEventListener(
        "click",
        () => {
          showScreen(
            state.mode === "organizer"
              ? "activity"
              : "budget"
          );
        }
      );


    /* Final */

    $("copyPlan")
      ?.addEventListener(
        "click",
        () => {
          copyText(
            buildCopyPlan()
          );
        }
      );


    $("doneBtn")
      ?.addEventListener(
        "click",
        goHome
      );


    /* Generic back buttons */

    document
      .querySelectorAll(
        "[data-back]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            showScreen(
              button.dataset.back
            );
          }
        );
      });
  }


  /* =======================================================
     INITIALIZE
  ======================================================= */

  function initialize() {

    renderCandidateDates();

    renderTimes();

    renderBudgets();

    renderActivities();

    bindEvents();

    console.log(
      "Roam initialized.",
      supabaseClient
        ? "Supabase connected."
        : "Supabase not configured."
    );
  }


  document.addEventListener(
    "DOMContentLoaded",
    initialize
  );

})();

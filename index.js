let currentPage = 4;
let pages; // array med alle elementer med class = page 
// Global variabel til ugenummeret
let currentWeekNumber;
let hasChanged = false; // Global flag der indikerer, at der er ændringer

let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(event) {
    touchStartX = event.changedTouches[0].screenX;
}

function handleTouchEnd(event) {
    touchEndX = event.changedTouches[0].screenX;
    handleSwipeGesture();
}

function handleSwipeGesture() {
    const swipeThreshold = 50; // Minimum distance for a swipe to be recognized

    if (touchEndX < touchStartX - swipeThreshold) {
        // Swipe left
        shiftPage("ArrowRight");
    } else if (touchEndX > touchStartX + swipeThreshold) {
        // Swipe right
        shiftPage("ArrowLeft");
    }
}

function setupSwipeListeners() {
    const body = document.body;
    body.addEventListener("touchstart", handleTouchStart, false);
    body.addEventListener("touchend", handleTouchEnd, false);
}

function setup() {
  console.log('P5.js er loaded');

  pages = selectAll('.page');
  // Registrer klik på footer-pile
  select('#prev-page').mousePressed(() => shiftPage("ArrowLeft"));
  select('#next-page').mousePressed(() => shiftPage("ArrowRight"));
  // Registrer klik på uge-pile
  select('#prev-week').mousePressed(() => changeWeek(-1));
  select('#next-week').mousePressed(() => changeWeek(1));
  // Registrer knappen "Tilføj fokusområde" til at kalde addFocusItem
  select('#add-focus-btn').mousePressed(()=>addFocusItem(true));
  // Set the current week number dynamically
  currentWeekNumber = getCurrentWeekNumber();
  updateWeekDisplay();
  initializeMenu()
  initializeSubmenu()
  // evt. kald getWeek() for at hente data for ugen
  getWeek();
  shiftPage(currentPage);
  setupSwipeListeners();
}

let isChangingWeek = false; // Flag to indicate if a week change is in progress

// Global model for den aktuelle uge
let currentWeekData = {};

function getCurrentWeekNumber() {
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), 0, 1);
  const days = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startDate.getDay() + 1) / 7);
  return weekNumber;
}

function changeWeek(direction) {
  if (hasChanged) {
    console.log('Calling setWeek from changeWeek');
    setWeek().then(() => {
      hasChanged = false;
      isChangingWeek = true; // Set the flag to indicate a week change is in progress
      currentWeekNumber += direction;
      if (currentWeekNumber < 1) {
        currentWeekNumber = 1;
      }
      updateWeekDisplay();
      getWeek().then(() => {
        isChangingWeek = false; // Reset the flag after the week change is complete
      });
    });
  } else {
    isChangingWeek = true; // Set the flag to indicate a week change is in progress
    currentWeekNumber += direction;
    if (currentWeekNumber < 1) {
      currentWeekNumber = 1;
    }
    updateWeekDisplay();
    getWeek().then(() => {
      isChangingWeek = false; // Reset the flag after the week change is complete
    });
  }
}

function updateWeekDisplay() {
  select("#current-week").html(`Uge ${currentWeekNumber}`);
}

async function getWeek() {
  console.log('Trying to fetch week data for week', currentWeekNumber);
  const docPath = `/kompas/user_1/weeks/week_${currentWeekNumber}`;
  try {
    const docRef = firebase.firestore().doc(docPath);

    // Set up a real-time listener for the document
    docRef.onSnapshot((docSnap) => {
      if (docSnap.exists) {
        const newData = docSnap.data();
        if (JSON.stringify(newData) !== JSON.stringify(currentWeekData)) {
          currentWeekData = newData; // Update local data
          populateAllUI(); // Refresh the UI with the new data
          console.log(`Real-time update for week ${currentWeekNumber}:`, newData);
        }
      } else {
        console.log(`Ingen data for uge ${currentWeekNumber} findes. Initialiserer et tomt objekt.`);
        copyLastWeekData(currentWeekNumber);
      }
    });
  } catch (error) {
    console.error("Fejl ved hentning af ugedata:", error);
  }
}

async function setWeek() {
  if (!hasChanged || isChangingWeek) {
    console.log('No changes detected or week change in progress, skipping setWeek');
    return;
  }
  const docPath = `/kompas/user_1/weeks/week_${currentWeekNumber}`;
  try {
    const docRef = firebase.firestore().doc(docPath);
    await docRef.set(currentWeekData, { merge: true });
    console.log(`SetWeek: Ugedata for uge ${currentWeekNumber} opdateret:`, currentWeekData);
    hasChanged = false; // Reset the flag after saving
  } catch (error) {
    console.error("Fejl ved opdatering af ugedata:", error);
  }
}

async function copyLastWeekData(newWeekNumber) {
    const previousWeekNumber = newWeekNumber - 1;
    console.log('Påbegynd kopiering af uge', previousWeekNumber);
    try {
        console.log(`Forsøger at hente data fra uge ${previousWeekNumber}`);
        const docPath = `/kompas/user_1/weeks/week_${previousWeekNumber}`;
        const docRef = firebase.firestore().doc(docPath);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const lastWeekData = docSnap.data();
            currentWeekData = { ...lastWeekData, weekNumber: newWeekNumber };

            // Set empty strings for specific fields
            currentWeekData.inspiration = "";
            currentWeekData.laeringOgTab = "";
            currentWeekData.mennesker = "";
            currentWeekData.stolthed = "";
            currentWeekData.taknemmelighed = "";

            // Initialize an empty calendar for the new week
            currentWeekData.calendar = Array.from({ length: 7 }, () => ({ tasks: [] }));

            // Filter uncompleted tasks from last week and add them to the first day
            currentWeekData.calendar[0].tasks = lastWeekData.calendar
                ?.flatMap(day => day.tasks.filter(task => !task.completed)) || [];


            console.log("Uncompleted tasks added to the first day of the new week:", currentWeekData.calendar[0].tasks);
            populateAllUI();
            showInfo("Data kopieret fra sidste uge.");
        } else {
            console.log(`Ingen data fundet for uge ${previousWeekNumber}. Initialiserer ny uge.`);
            currentWeekData = { weekNumber: newWeekNumber, projects: [], calendar: [], stolthed: "", laeringOgTab: "", inspiration: "", mennesker: "", forbered: "", planForud: "" };
            showInfo("Ingen tidligere data fundet. Ny uge oprettet.");
        }
    } catch (error) {
        console.error("Fejl ved kopiering af ugedata:", error);
    }
}

function populateAllUI() {
  populateUIFromModel();
  initializeProjects();
  populateProjectsUI();
  populateLaeringOgTabUI();
  populateTopGoalsUI(); // Tilføj denne linje for at sikre, at topmålene også opdateres
  populateCalendarUI();
  populatePlanForudUI();
}

function shiftPage(input) {
  console.log(input, 'trying to shift page');
  if (input === "ArrowLeft") {
    input = currentPage - 1;
  }
  if (input === "ArrowRight") {
    input = currentPage + 1;
  }
  
  if (isNaN(input) || input > pages.length || input === 0) {
    return;
  }
  
  // Fjern 'visible'-klassen fra den nuværende side
  select("#page" + currentPage).removeClass('visible');
  currentPage = input;
  // Gør den nye side synlig
  select("#page" + currentPage).addClass('visible');
  
  // Tjek data-topic for den nye side og kald den relevante UI-funktion
  let newPage = select("#page" + currentPage);
  let topic = newPage.elt.getAttribute("data-topic");
  
  if (topic === "overblik") {
    populateUIFromModel();
  } else if (topic === "projekter") {
    initializeProjects();
    populateProjectsUI();
  } else if (topic === "læring") {
    populateLaeringOgTabUI();
  } else if (topic === "forpligtelse") {
    populateTopGoalsUI();
    populateCalendarUI();
  } else if (topic === "planlægning") {
    populatePlanForudUI();
  }
  // Tilføj evt. flere tjek for andre sider...
}

/**
 * Fetches week data for a specific week number from Firestore.
 * @param {number} weekNumber - The week number to fetch data for.
 * @returns {Promise<Object>} - A promise that resolves to the week data object.
 */
async function getWeekData(weekNumber) {
  console.log(`Fetching data for week ${weekNumber}...`);
  const docPath = `/kompas/user_1/weeks/week_${weekNumber}`;
  try {
      const docRef = firebase.firestore().doc(docPath);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
          console.log(`Data for week ${weekNumber} fetched successfully:`, docSnap.data());
          return docSnap.data();
      } else {
          console.warn(`No data found for week ${weekNumber}. Returning an empty object.`);
          return {}; // Return an empty object if no data exists
      }
  } catch (error) {
      console.error(`Error fetching data for week ${weekNumber}:`, error);
      throw error; // Re-throw the error for the caller to handle
  }
}



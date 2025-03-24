let currentPage = 1;
let pages; // array med alle elementer med class = page 
// Global variabel til ugenummeret
let currentWeekNumber;
let hasChanged = false; // Global flag der indikerer, at der er ændringer

// Global model for den aktuelle uge
let currentWeekData = {};

function getCurrentWeekNumber() {
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), 0, 1);
  const days = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startDate.getDay() + 1) / 7);
  return weekNumber;
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
  select('#add-focus-btn').mousePressed(addFocusItem);
  // Set the current week number dynamically
  currentWeekNumber = getCurrentWeekNumber();
  updateWeekDisplay();
  // evt. kald getWeek() for at hente data for ugen
  getWeek();
}

function changeWeek(direction) {
  currentWeekNumber += direction;
  if (currentWeekNumber < 1) {
      currentWeekNumber = 1;
  }
  updateWeekDisplay();
  getWeek();
}

function updateWeekDisplay() {
  select("#current-week").html(`Uge ${currentWeekNumber}`);
}

async function getWeek() {
  const docPath = `/kompas/user_1/weeks/week_${currentWeekNumber}`;
  try {
    const docRef = firebase.firestore().doc(docPath);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      currentWeekData = docSnap.data();
      console.log(`Ugedata for uge ${currentWeekNumber} hentet:`, currentWeekData);
      // Opdater UI'en med den hentede data
      populateAllUI();
    } else {
      console.log(`Ingen data for uge ${currentWeekNumber} findes. Initialiserer et tomt objekt.`);
      copyLastWeekData(currentWeekNumber);
    }
  } catch (error) {
    console.error("Fejl ved hentning af ugedata:", error);
  }
}

async function setWeek() {
  const docPath = `/kompas/user_1/weeks/week_${currentWeekNumber}`;
  try {
    const docRef = firebase.firestore().doc(docPath);
    await docRef.set(currentWeekData, { merge: true });
    console.log(`Ugedata for uge ${currentWeekNumber} opdateret:`, currentWeekData);
  } catch (error) {
    console.error("Fejl ved opdatering af ugedata:", error);
  }
}

async function copyLastWeekData(newWeekNumber) {
  const previousWeekNumber = newWeekNumber - 1;
  console.log('Påbegynd kopiering af uge', previousWeekNumber);
  try {
    console.log(`Forsøger at hente data fra uge ${previousWeekNumber}`);
    // Hent data fra den forrige uge
    const docPath = `/kompas/user_1/weeks/week_${previousWeekNumber}`;
    const docRef = firebase.firestore().doc(docPath);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      currentWeekData = docSnap.data();
      console.log(`Ugedata for uge ${previousWeekNumber} hentet`);
      // Opdater UI'en med den hentede data
      populateAllUI();
      currentWeekData.weekNumber = newWeekNumber;
      console.log("Data kopieret til ny uge:", currentWeekData);
      showInfo("Data kopieret fra sidste uge.");
    } else {
      console.log(`Ingen data fundet for uge ${previousWeekNumber}. Initialiserer ny uge.`);
      currentWeekData = { weekNumber: newWeekNumber, projects: [], calendar: [], stolthed: "", laeringOgTab: "", inspiration: "", mennesker: "", forbered: "", planForud: "" };
      showInfo("Ingen tidligere data fundet. Ny uge oprettet.");
    }
    // Save the copied or new week data to Firebase
    await setWeek();
  } catch (error) {
    console.error("Fejl ved kopiering af ugedata:", error);
  }
}

function populateAllUI() {
  populateUIFromModel();
  populateProjectsUI();
  populateCalendarUI();
  populateStolthedUI();
  populateLaeringOgTabUI();
  populateForberedUI();
  populatePlanForudUI();
  populateTopGoalsUI(); // Tilføj denne linje for at sikre, at topmålene også opdateres
}

function shiftPage(input) {
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
  
  if (topic === "stolthed") {
    populateStolthedUI();
  } else if (topic === "projekter") {
    initializeProjects();
    populateProjectsUI();
  } else if (topic === "læring") {
    populateLaeringOgTabUI();
  } else if (topic === "analyse") {
    populateForberedUI();
  } else if (topic === "planlægning") {
    populatePlanForudUI();
  } else if (topic === "forpligtelse") {
    populateTopGoalsUI();
  }
  // Tilføj evt. flere tjek for andre sider...
}

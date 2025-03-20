let currentPage = 1;
let pages; // array med alle elementer med class = page 
// Global variabel til ugenummeret
let currentWeekNumber = 12; 
let hasChanged = false; // Global flag der indikerer, at der er ændringer


// Global model for den aktuelle uge
let currentWeekData = {};


  // Eksempel: kald updateWeekDisplay() i setup()
  function setup(){
    console.log('P5.js er loaded');
    pages = selectAll('.page');
      // Registrer klik på footer-pile
    select('#prev-page').mousePressed(() => shiftPage("ArrowLeft"));
    select('#next-page').mousePressed(() => shiftPage("ArrowRight"));
    // Registrer knappen "Tilføj fokusområde" til at kalde addFocusItem
    select('#add-focus-btn').mousePressed(addFocusItem);
    select('#force-update-btn').mousePressed(()=>{setWeek;showInfo("Ugen er gemt");});
    updateWeekDisplay();
    // evt. kald getWeek() for at hente data for ugen
    getWeek()
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
  
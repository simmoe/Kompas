function showInfo(message) {
    // Forsøg at finde en eksisterende infoboks
    let infoBox = select('#info-box');
    
    // Hvis den ikke findes, opret den og tilføj den til body
    if (!infoBox) {
      infoBox = createDiv('');
      infoBox.id('info-box');
      infoBox.addClass('info-box');
      // Ved at tilføje den til body sikrer vi, at den ligger øverst i DOM'en
      infoBox.parent(document.body);
    }
    
    // Sæt besked og vis infoboksen
    infoBox.html(message);
    infoBox.addClass('visible');
    
    // Fjern infoboksen efter 1 sekund
    setTimeout(() => {
      infoBox.removeClass('visible');
    }, 1400);
  }
  


  function populateUIFromModel() {
    // Fokusområder:
    if (currentWeekData.focus && Array.isArray(currentWeekData.focus)) {
      currentWeekData.focus.forEach((item, index) => {
        // Find eksisterende DOM-elementer ved hjælp af id eller name
        let titleInput = select("#focus-title-" + index);
        let motivationInput = select("#focus-motivation-" + index);
        let checkboxInput = select("#focus-main-" + index);
  
        // Hvis elementet ikke findes, skal vi oprette et nyt fokusområde
        if (!titleInput) {
          addFocusItem();
          titleInput = select("#focus-title-" + index);
          motivationInput = select("#focus-motivation-" + index);
          checkboxInput = select("#focus-main-" + index);
        }
        
        // Opdater elementernes værdier ud fra modellen
        titleInput.value(item.title);
        motivationInput.value(item.motivation);
        autoResize(motivationInput.elt);
        if (checkboxInput && checkboxInput.elt) {
          checkboxInput.elt.checked = item.isMain;
        }
      });
    }
  }

  function triggerFirestoreUpdate() {
    if (!isChangingWeek && hasChanged) {
        setWeek();
        hasChanged = false; // Reset the flag after the update
        console.log("Firestore updated successfully.");
    }
}

  function addFocusItem() {
    let container = select('#focus-items');
    let newIndex = container.elt.childElementCount;
    
    let newFocusDiv = createDiv();
    newFocusDiv.addClass('focus-item');
    newFocusDiv.elt.setAttribute('data-index', newIndex);
  
    // Fokusområde label og input
    let c = createDiv().addClass('focusTitle')    
    let labelTitle = createElement('label', 'Målsætning:');
    labelTitle.attribute('for', 'focus-title-' + newIndex);
    c.child(labelTitle);
    
    let titleInput = createInput('');
    titleInput.attribute('id', 'focus-title-' + newIndex);
    titleInput.attribute('name', `focus[${newIndex}].title`);
    titleInput.attribute('placeholder', 'Ny målsætning');
    c.child(titleInput)
    newFocusDiv.child(c);
    
    // Motivation label og textarea
    let d = createDiv().addClass('focusTitle');
  
    let labelMotivation = createElement('label', 'Værdi:');
    labelMotivation.attribute('for', 'focus-motivation-' + newIndex);
    d.child(labelMotivation);
    
    let motivationTextArea = createElement('textarea');
    motivationTextArea.attribute('id', 'focus-motivation-' + newIndex);
    motivationTextArea.attribute('name', `focus[${newIndex}].motivation`);
    motivationTextArea.attribute('placeholder', 'Hvad giver det dig at opnå denne målsæting?');
    motivationTextArea.attribute('required', '');
    d.child(motivationTextArea);
    newFocusDiv.child(d);
    
    // Auto-resize functionality
    setupAutoResize(motivationTextArea.elt);
    motivationTextArea.elt.addEventListener("input", function() {
        updateFocusItemModel(newFocusDiv);
        hasChanged = true;
    });
    motivationTextArea.elt.addEventListener("focusout", function() {
        if (!isChangingWeek && hasChanged) {
            updateFocusItemModel(newFocusDiv);
            initializeProjects();
            console.log('Calling triggerFirestoreUpdate from focusout event in addFocusItem');
            triggerFirestoreUpdate(); // Replaces setWeek()
            showInfo("Fokusområdet er gemt");
        }
    });
    
    // Checkbox-container med label og checkbox
    let checkboxDiv = createDiv();
    checkboxDiv.addClass('checkbox');
    
    let labelCheckbox = createElement('label', 'Aktuel:');
    labelCheckbox.attribute('for', 'focus-main-' + newIndex);
    checkboxDiv.child(labelCheckbox);
    
    let checkboxInput = createElement('input');
    checkboxInput.elt.setAttribute('type', 'checkbox');
    checkboxInput.attribute('id', 'focus-main-' + newIndex);
    checkboxInput.attribute('name', `focus[${newIndex}].isMain`);
    checkboxDiv.child(checkboxInput);
    
    newFocusDiv.child(checkboxDiv);
  
    // Tilføj event listener til checkboxen for at opdatere modellen ved ændring
    checkboxInput.elt.addEventListener("change", function() {
      updateFocusItemModel(newFocusDiv);
      // Efter en ændring i checkboxen opdaterer vi projects-arrayet
      initializeProjects();
      // Hvis projektlisten er synlig, kan vi også genopbygge UI'en for den
      if (select("#page2").hasClass("visible")) {
        populateProjectsUI();
      }
      hasChanged = true;
      console.log('Calling triggerFirestoreUpdate from change event in addFocusItem');
      triggerFirestoreUpdate(); // Replaces setWeek()
      showInfo("Fokusområdet er gemt");
      console.log("Checkbox ændret for index:", newIndex, " - Model opdateret.");
    });
    
    // Delete ikon med integreret event listener
    let deleteSpan = createSpan('delete');
    deleteSpan.addClass('material-icons delete-icon');
    deleteSpan.attribute('id', 'delete-focus-' + newIndex);
    
    deleteSpan.mousePressed(() => {
      // Brug newFocusDiv, som vi allerede har referencen til
      let index = parseInt(newFocusDiv.elt.getAttribute('data-index'), 10);
      newFocusDiv.remove();
      
      if (currentWeekData.focus && index !== -1) {
        currentWeekData.focus.splice(index, 1);
      }
      
      // Opdater data-index for de resterende elementer
      let remainingItems = selectAll('.focus-item');
      remainingItems.forEach((item, i) => {
        item.elt.setAttribute('data-index', i);
      });
      
      hasChanged = true;
      console.log('Calling triggerFirestoreUpdate from delete event in addFocusItem');
      triggerFirestoreUpdate(); // Replaces setWeek()
    });
    
    newFocusDiv.child(deleteSpan);
    
    // Sæt event listeners på de nye inputfelter, så modellen opdateres ved ændringer
    let inputs = newFocusDiv.elt.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        updateFocusItemModel(newFocusDiv);
      });
      input.addEventListener('focusout', () => {
        if (!isChangingWeek && hasChanged) {
            updateFocusItemModel(newFocusDiv);
            initializeProjects();
            console.log('Calling triggerFirestoreUpdate from focusout event in addFocusItem');
            triggerFirestoreUpdate(); // Replaces setWeek()
            showInfo("Fokusområdet er gemt");
        }
      });
    });
    
    container.child(newFocusDiv);
  }
  
  

  function updateFocusItemModel(focusItem) {
    // Find indekset for denne container blandt alle .focus-item elementer
    const allFocusItems = selectAll('.focus-item');
    let index = allFocusItems.findIndex(item => item.elt === focusItem.elt);
  
    const titleInput = focusItem.elt.querySelector('input[type="text"]');
    const titleValue = titleInput ? titleInput.value : "";
  
    const motivationTextArea = focusItem.elt.querySelector('textarea');
    const motivationValue = motivationTextArea ? motivationTextArea.value : "";
  
    const checkbox = focusItem.elt.querySelector('input[type="checkbox"]');
    const isMain = checkbox ? checkbox.checked : false;
  
    if (!currentWeekData.focus) {
      currentWeekData.focus = [];
    }
  
    currentWeekData.focus[index] = {
      title: titleValue,
      motivation: motivationValue,
      isMain: isMain
    };
 
    autoResize(motivationTextArea);

    // Sæt dirty flag til true ved ændringer
    hasChanged = true;
  
    //console.log("Opdateret focus item ved index", index, currentWeekData.focus[index]);
  }
  
  function initializeProjects() {
    // Hvis 'projects' ikke findes, initialiser den som et tomt array
    if (!currentWeekData.projects) {
      currentWeekData.projects = [];
    }
    
    // For hvert fokusområde i currentWeekData.focus
    for (let i = 0; i < currentWeekData.focus.length; i++) {
      // Hvis et projekt ikke findes for dette indeks, opret det
      if (!currentWeekData.projects[i]) {
        currentWeekData.projects[i] = {
          focusId: i,
          title: currentWeekData.focus[i].title, // Samme titel som fokusområdet
          tasks: []  // Tom liste til delopgaver
        };
      } else {
        // Hvis projektet allerede findes, synkroniser titlen
        currentWeekData.projects[i].title = currentWeekData.focus[i].title;
      }
    }
    
    // Hvis projects-arrayet er længere end focus-arrayet, trim det
    if (currentWeekData.projects.length > currentWeekData.focus.length) {
      currentWeekData.projects.splice(currentWeekData.focus.length);
    }
    
    //console.log("Projects initialized:", currentWeekData.projects);
    
    // Opbyg UI for projektlisten
    populateProjectsUI();
  }
  
  function createTaskElement(task, projectIndex) {
    let taskDiv = createDiv().addClass('task-item');

    // Label for hovedopgave
    let taskTitleLabel = createElement('label', 'Hovedopgave:').addClass('task-title-label');

    let taskTitleInput = createInput(task.title || '').addClass('task-title-input');
    taskTitleInput.attribute('placeholder', 'Titel');
    taskTitleInput.elt.addEventListener('input', function() {
        task.title = taskTitleInput.value();
        hasChanged = true;
    });
    taskTitleInput.elt.addEventListener('focusout', function() {
        if (taskTitleInput.value().trim() !== '') {
            console.log('Calling triggerFirestoreUpdate from focusout event in createTaskElement');
            triggerFirestoreUpdate(); // Replaces setWeek()
            showInfo("Opgavelisten er gemt");
            console.log("Current task data:", task);
        }
    });

    // Label for underopgaver
    let taskDescriptionLabel = createElement('label', 'Underopgaver:').addClass('task-description-label');

    let taskDescriptionTextArea = createElement('textarea').addClass('task-description-textarea');
    taskDescriptionTextArea.attribute('placeholder', 'Underopgaver adskilt af linjeskift');
    taskDescriptionTextArea.html(task.subtasks ? task.subtasks.map(subtask => subtask.title).join('\n') : '');
    setupAutoResize(taskDescriptionTextArea.elt);
    taskDescriptionTextArea.elt.addEventListener('input', function() {
        task.subtasks = taskDescriptionTextArea.value().split('\n').map(title => ({ title, completed: false, subtasks: [] }));
        hasChanged = true;
    });
    taskDescriptionTextArea.elt.addEventListener('focusout', function() {
        console.log('Calling triggerFirestoreUpdate from focusout event in createTaskElement');
        triggerFirestoreUpdate(); // Replaces setWeek()
        showInfo("Opgavelisten er gemt");
        console.log("Current task data:", task);
    });

    let deleteIcon = createSpan('delete').addClass('material-icons delete-icon');
    deleteIcon.mousePressed(function() {
        taskDiv.remove();
        currentWeekData.projects[projectIndex].tasks = currentWeekData.projects[projectIndex].tasks.filter(t => t !== task);
        hasChanged = true;
        console.log('Calling triggerFirestoreUpdate from delete event in createTaskElement');
        triggerFirestoreUpdate(); // Replaces setWeek()
        showInfo("Opgavelisten er gemt");
    });

    // Tilføj elementerne i den ønskede rækkefølge
    taskDiv.child(taskTitleLabel);
    taskDiv.child(taskTitleInput);
    taskDiv.child(taskDescriptionLabel);
    taskDiv.child(taskDescriptionTextArea);
    taskDiv.child(deleteIcon);

    return taskDiv;
}

function populateProjectsUI() {
    let container = select("#project-list");
    container.html("");

    if (!currentWeekData.projects) {
        currentWeekData.projects = [];
    }

    currentWeekData.projects.forEach((project, projectIndex) => {
        let projectContainer = createDiv().addClass("project-container");
        projectContainer.elt.setAttribute("data-project-index", projectIndex);

        // Titel på projektet
        projectContainer.child(createElement("h2", project.title || "Ukendt Målsætning"));

        // Opgaveliste
        let taskListContainer = createDiv().addClass('task-list-container');
        project.tasks.forEach(task => {
            let taskElement = createTaskElement(task, projectIndex);
            taskListContainer.child(taskElement);
        });

        projectContainer.child(taskListContainer);

        // Tilføj opgave ikon
        let addTaskIcon = createSpan('add').addClass('material-icons add-task-icon');
        addTaskIcon.mousePressed(function() {
            let task = { title: '', completed: false, subtasks: [] };
            project.tasks.push(task);
            let taskElement = createTaskElement(task, projectIndex);
            taskListContainer.child(taskElement);
            hasChanged = true;
        });

        projectContainer.child(addTaskIcon);
        container.child(projectContainer);
    });
}  
  // Funktion til at auto-justere højden
function autoResizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }
  

// Opdaterer visningen af ugen i footer
function updateWeekDisplay() {
    select("#current-week").html("Uge " + currentWeekNumber);
  }
  

  
  // Eksempel: Opret textarea til TRIN TRE - "Hvad er du stolt af?"
function populateStolthedUI() {
    let container = select("#page3 .content"); // Antag en container i din side til trin 3
    container.html(""); // Ryd containeren  
    // Opret textarea
    let stolthedTextArea = createElement("textarea");
    stolthedTextArea.attribute("id", "stolthed-textarea");
    stolthedTextArea.attribute("placeholder", "'Jeg er stolt af...'");
    // Hvis der allerede findes gemte data, indsæt dem
    if (currentWeekData.stolthed) {
      stolthedTextArea.html(currentWeekData.stolthed);
    }
    container.child(stolthedTextArea);
  
    // Auto-resizing
    setupAutoResize(stolthedTextArea.elt);
    stolthedTextArea.elt.addEventListener("input", function() {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";
      // Opdater den lokale model ved input
      currentWeekData.stolthed = stolthedTextArea.value();
      hasChanged = true;
    });
    
    // Alternativt kan du også opdatere modellen på focusout
    stolthedTextArea.elt.addEventListener("focusout", function() {
      currentWeekData.stolthed = stolthedTextArea.value();
      setWeek();
      showInfo("Stolthed gemt");
    });
  }

  function setupAutoResize(textarea) {
    textarea.style.overflow = "hidden";
    textarea.style.resize = "none";
    autoResize(textarea);
    textarea.addEventListener("input", function() {
        autoResize(this);
    });
    textarea.addEventListener("focus", function() {
        autoResize(this);
    });
}

function autoResize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
}
  
function populateLaeringOgTabUI() {
  // Hent eller opret containeren til side 4 (TRIN FIRE)
  let container = select("#laering-container");
  container.html(""); // Ryd containeren

  // Definer de tre sektioner med deres overskrifter, nøgler og placeholders
  const sections = [
    {
      title: "Lærepunkter og tab",
      key: "laeringOgTab",
      placeholder: "Reflekter over hvad du kan lære fra sidste periode – både succeser og fejl..."
    },
    {
      title: "Taknemmelighed",
      key: "taknemmelighed",
      placeholder: "Skriv mindst 3 ting - både store og små - fra forrige periode, som du er stolt af. Tid: 2-5 minutter."
    },
    {
      title: "Kilder til inspiration",
      key: "inspiration",
      placeholder: "Skriv hvilke kilder du har fået inspiration fra, f.eks. bøger, film, andet..."
    },
    {
      title: "Mennesker og relationer",
      key: "mennesker",
      placeholder: "Skriv navne ned på mennesker du har haft glæde af i denne periode, måske også menesker du gerne ville møde fremover"
    }
  ];

  sections.forEach(sec => {
    // Opret overskrift
    let secHeader = createElement("h2", sec.title);
    container.child(secHeader);

    // Opret textarea
    let secTextArea = createElement("textarea");
    secTextArea.attribute("id", sec.key + "-textarea");
    secTextArea.attribute("placeholder", sec.placeholder);
    // Hvis der allerede findes gemte data i currentWeekData, indsæt dem
    if (currentWeekData[sec.key]) {
      secTextArea.html(currentWeekData[sec.key]);
    }
    container.child(secTextArea);

    // Styling via inline CSS
    secTextArea.elt.style.overflow = "hidden";
    secTextArea.elt.style.resize = "none";

    // Auto-resize og data-binding ved input
    setupAutoResize(secTextArea.elt);
    secTextArea.elt.addEventListener("input", function() {
      autoResize(this);
      // Opdater den lokale model med den aktuelle værdi
      currentWeekData[sec.key] = secTextArea.value();
      hasChanged = true;
    });
    // Auto-resize ved fokus
    secTextArea.elt.addEventListener("focus", function() {
      autoResize(this);
    });
    // Ved focusout opdateres firebase, hvis der er ændringer
    secTextArea.elt.addEventListener("focusout", function() {
      currentWeekData[sec.key] = secTextArea.value();
      if (hasChanged) {
        setWeek();
        hasChanged = false;
        showInfo("Ændringer gemt");
      }
    });
  });
}
  

  function populateForberedUI() {
    // Hent eller opret containeren til TRIN FEM (vi bruger id "forbered-container")
    let container = select("#forbered-container");
    container.html(""); // Ryd containeren for en frisk visning
    
    // Opret textarea
    let forberedTextArea = createElement("textarea");
    forberedTextArea.attribute("id", "forbered-textarea");
    forberedTextArea.attribute("placeholder", "F.eks. 'Mødtes ikke med X, fordi...' eller 'Projekt Y blev ikke startet, da...'");
    // Hvis der allerede findes gemte data, indsæt dem
    if (currentWeekData.forbered) {
      forberedTextArea.html(currentWeekData.forbered);
    }
    container.child(forberedTextArea);
  
    // Styling (via inline CSS – alternativt via stylesheet)
    forberedTextArea.elt.style.overflow = "hidden";
    forberedTextArea.elt.style.resize = "none";
  
    // Tilføj event listeners for auto-resizing og data-binding
    setupAutoResize(forberedTextArea.elt);
    forberedTextArea.elt.addEventListener("input", function() {
      autoResize(this);
      // Opdater den lokale model med den aktuelle værdi
      currentWeekData.forbered = forberedTextArea.value();
      hasChanged = true;
    });
    forberedTextArea.elt.addEventListener("focus", function() {
      autoResize(this);
    });
    // Når brugeren forlader feltet, opdater firebase hvis der er ændringer
    forberedTextArea.elt.addEventListener("focusout", function() {
      currentWeekData.forbered = forberedTextArea.value();
      if (hasChanged) {
        setWeek();
        hasChanged = false;
        showInfo("Ændringer gemt");
      }
    });
  }
  

 // Denne funktion henter de topmål, der er markeret som hovedmål
function getTopGoals() {
    if (!currentWeekData.focus || !Array.isArray(currentWeekData.focus)) {
        return [];
    }
    return currentWeekData.focus
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.isMain && item.title.trim() !== "");
}

const url = "https://webmail.nextkbh.dk/owa/calendar/8e671bea774a4ed8bc32194123e524e5@nextkbh.dk/616b1a695fa44c0bb544daa9165c0b5d14714702637102088490/S-1-8-568136743-293136663-2427912843-3521603543/reachcalendar.ics"

const proxyUrl = 'https://api.allorigins.win/raw?url=';

async function loadAndDisplayEvents(url) {
  try {
      const response = await fetch(proxyUrl + encodeURIComponent(url));
      const data = await response.text();

      const jcalData = ICAL.parse(data);
      const vcalendar = new ICAL.Component(jcalData[1]);
      const vevents = vcalendar.getAllSubcomponents('vevent');

      // Populate the weekly calendar with events
      vevents.forEach(event => {
          const icalEvent = new ICAL.Event(event);
          const eventDate = icalEvent.startDate.toJSDate();
          const eventDayIndex = (eventDate.getDay() + 6) % 7; // Adjust to start week on Monday (0 = Monday, ..., 6 = Sunday)

          // Ensure the calendar data exists for the day
          if (!currentWeekData.calendar[eventDayIndex]) {
              currentWeekData.calendar[eventDayIndex] = { tasks: [] };
          }

          // Add the event to the day's tasks
          const eventTitle = `${icalEvent.startDate.toJSDate().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })} - ${icalEvent.summary}`;
          currentWeekData.calendar[eventDayIndex].tasks.push({ title: eventTitle, completed: false, subtasks: [] });
      });

      // Update the UI
      populateCalendarUI();
      showInfo("Kalenderbegivenheder tilføjet.");
  } catch (error) {
      console.error("Fejl ved indlæsning af kalender:", error);
  }
}
function printTodaysEvents(vevents) {
  const today = new Date().toISOString().slice(0,10)

  const todaysEvents = vevents
    .map(event => new ICAL.Event(event))
    .filter(event => event.startDate.toJSDate().toISOString().slice(0,10) === today)

  let eventsContainer = select('#events')
  eventsContainer.html('')

  if (todaysEvents.length === 0) {
    eventsContainer.html("<p>Ingen begivenheder i dag.</p>")
  } else {
    todaysEvents.forEach(event => {
      const start = event.startDate.toJSDate().toLocaleTimeString('da-DK', {hour: '2-digit', minute:'2-digit'})
      const end = event.endDate.toJSDate().toLocaleTimeString('da-DK', {hour: '2-digit', minute:'2-digit'})
      let eventElement = createP(`${start} - ${end}: ${event.summary}`)
      eventElement.parent(eventsContainer)
    })
  }
}


function populateTopGoalsUI() {
  // Hent eller opret containeren til TRIN 6 (f.eks. en div med id "top-goals-container" på side 6)
  let container = select("#top-goals-container");
  if (!container) {
      container = createDiv();
      container.id("top-goals-container");
      // Antag, at TRIN 6-siden er #page6
      select("#page6").child(container);
  }
  container.html(""); // Ryd containeren

  // Hent topmål fra den lokale model
  let topGoals = getTopGoals();

  // Opret en paragraf med instruktion
  let instr = createElement("p", "Dine topmål for næste periode er:");
  container.child(instr);

  // Opret en container til topmål-knapperne
  let buttonContainer = createDiv();
  buttonContainer.addClass("top-goals-buttons");
  container.child(buttonContainer);

  // For hvert topmål oprettes en knap
  topGoals.forEach(({ item, index }) => {
      let btn = createButton(item.title);
      btn.addClass("top-goal-btn");
      btn.attribute("data-goal-index", index);
      btn.mousePressed(() => {
          toggleGoalDetails(index);
      });
      buttonContainer.child(btn);
  });

  // Opret en container, der skal vise detaljerne – under knapperne
  let detailsContainer = select("#top-goals-details");
  if (!detailsContainer) {
      detailsContainer = createDiv();
      detailsContainer.id("top-goals-details");
      detailsContainer.addClass("top-goals-details");
      container.child(detailsContainer);
  } else {
      detailsContainer.html("");
      detailsContainer.elt.removeAttribute("data-goal-index");
      detailsContainer.removeClass("open");
  }

  
  /* // Add input field and "OK" button for fetching calendar events
   let calendarInputContainer = createDiv().addClass("calendar-input-container");
   let calendarLabel = createElement("label", "Fetch calendar events:");
   calendarLabel.attribute("for", "calendar-url-input");
   let calendarInput = createInput("");
   calendarInput.attribute("id", "calendar-url-input");
   calendarInput.attribute("placeholder", "Indsæt iCal URL her...");
   let okButton = createButton("OK");
   okButton.mousePressed(() => {
       const calendarUrl = calendarInput.value();
       if (calendarUrl) {
           loadAndDisplayEvents(calendarUrl);
       }
   });
   calendarInputContainer.child(calendarLabel);
   calendarInputContainer.child(calendarInput);
   calendarInputContainer.child(okButton);
   container.child(calendarInputContainer); */
   
}

function toggleGoalDetails(goalIndex) {
  let detailsContainer = select("#top-goals-details");
  let currentDetailIndex = detailsContainer.elt.getAttribute("data-goal-index");

  // Hvis samme goal allerede er vist, skjul detaljerne
  if (currentDetailIndex && parseInt(currentDetailIndex) === goalIndex) {
      detailsContainer.html("");
      detailsContainer.elt.removeAttribute("data-goal-index");
      detailsContainer.removeClass("open");
  } else {
      // Hent projektet – vi antager her, at topmålene svarer til projekter
      let project = currentWeekData.projects && currentWeekData.projects[goalIndex];
      detailsContainer.html("");
      if (!project || !project.tasks || project.tasks.length === 0) {
          detailsContainer.child(createElement("p", "Ingen opgaver tilknyttet dette topmål."));
      } else {
          // Byg en rekursiv bullet-liste med alle niveauer af opgaver
          let taskList = buildTaskList(project.tasks);
          detailsContainer.child(taskList);
      }
      detailsContainer.elt.setAttribute("data-goal-index", goalIndex);
      detailsContainer.addClass("open");
  }
}  
  

  function getDateFromWeekNumber(weekNumber, dayIndex, year = new Date().getFullYear()) {
    // Beregn den første torsdag i året (ISO-8601 standard)
    let jan4 = new Date(year, 0, 4);
    let firstMonday = new Date(jan4.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1));
  
    // Tilføj antal uger og dage
    let targetDate = new Date(firstMonday);
    targetDate.setDate(firstMonday.getDate() + (weekNumber - 1) * 7 + dayIndex);
  
    // Dansk formatering
    return targetDate.toLocaleDateString("da-DK", { 
      weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' 
    });
  }
      
  function populateCalendarUI() {
    let container = select("#calendar-container");
    container.html("");

    // Ensure calendar data is initialized
    if (!currentWeekData.calendar || !Array.isArray(currentWeekData.calendar)) {
        currentWeekData.calendar = Array.from({ length: 7 }, () => ({ tasks: [] }));
    }

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        let dayContainer = createDiv().addClass("day-container");

        let dateString = getDateFromWeekNumber(currentWeekNumber, dayIndex);

        dayContainer.child(createElement("h3", dateString));

        let dayTextArea = createElement("textarea")
            .attribute("id", `calendar-day-${dayIndex}`)
            .attribute("placeholder", `Indtast opgaver for ${dateString}`);

        // Populate the textarea with existing tasks
        const existingTasks = currentWeekData.calendar[dayIndex]?.tasks || [];
        dayTextArea.html(existingTasks.map(task => task.title).join('\n'));

        dayTextArea.elt.style.overflow = "hidden";
        dayTextArea.elt.style.resize = "none";

        // Auto-resize og data-binding ved input
        setupAutoResize(dayTextArea.elt);
        dayTextArea.elt.addEventListener("input", function () {
            hasChanged = true;
        });

        dayTextArea.elt.addEventListener("focusout", function () {
            const taskTitles = dayTextArea.value().split('\n').map(title => title.trim()).filter(title => title !== '');
            const parsedTasks = taskTitles.map(title => ({ title, completed: false, subtasks: [] }));
            currentWeekData.calendar[dayIndex] = { tasks: parsedTasks };
            console.log('Calling triggerFirestoreUpdate from focusout event in populateCalendarUI');
            triggerFirestoreUpdate(); // Replaces setWeek()
            showInfo("Ændringer gemt");
            console.log("Current day tasks data:", currentWeekData.calendar[dayIndex]);
        });

        dayContainer.child(dayTextArea);
        container.child(dayContainer);
    }
}  
  function buildTaskList(tasks) {
    let ul = createElement("ul");
    tasks.forEach(task => {
        let li = createElement("li", task.title); // Brug 'title' i stedet for 'description'
        if (task.subtasks && task.subtasks.length > 0) {
            // Hvis der findes underopgaver, bygges en nestet liste
            let nestedUl = buildTaskList(task.subtasks);
            li.child(nestedUl);
        }
        ul.child(li);
    });
    return ul;
}

  function populatePlanForudUI() {
    // Hent eller opret containeren til TRIN SYV – PLANLÆG FORUD (for eksempel med id "plan-forud-container")
    let container = select("#plan-forud-container");
    container.html(""); // Ryd containeren
        
    // Opret et textarea til noterne
    let planTextArea = createElement("textarea");
    planTextArea.attribute("id", "plan-forud-textarea");
    planTextArea.attribute("placeholder", "Skriv dine noter her...");
    
    // Hvis der allerede er gemte data, indsæt dem
    if (currentWeekData.planForud) {
      planTextArea.html(currentWeekData.planForud);
    }
    container.child(planTextArea);
    
    // Anvend CSS-klasser til textarea'en via stylesheet (vi undgår inline-styling her)
    planTextArea.elt.classList.add("autosize-textarea");
    
    // Tilføj event listeners til auto-resizing og data-binding
    setupAutoResize(planTextArea.elt);
    planTextArea.elt.addEventListener("input", function() {
      currentWeekData.planForud = planTextArea.value();
      hasChanged = true;
    });
    planTextArea.elt.addEventListener("focusout", function() {
      currentWeekData.planForud = planTextArea.value();
      console.log('Calling triggerFirestoreUpdate from focusout event in populatePlanForudUI');
      triggerFirestoreUpdate(); // Replaces setWeek()
      showInfo("Ændringer gemt");
    });
  }

  function initializeInstructions() {  
    const instructions = document.querySelectorAll('.instruction');
    instructions.forEach(instruction => {
      // Gem den oprindelige tekst
      const fullText = instruction.innerHTML;
      // Sæt en kort tekst som standard
      instruction.innerHTML = 'Instruks';
      instruction.style.cursor = 'pointer';
      instruction.style.color = 'blue'; // Gør teksten klikbar
      instruction.style.display = 'flex';
      instruction.style.alignItems = 'center';
  
      // Tilføj en pil fra Google Material Icons
      const arrow = document.createElement('span');
      arrow.classList.add('material-icons', 'arrow-icon');
      arrow.innerHTML = 'expand_more';
      arrow.style.marginLeft = '8px'; // Tilføj lidt afstand mellem tekst og pil
      instruction.appendChild(arrow);
  
      // Tilføj en klik-hændelse for at folde ud og ind
      instruction.addEventListener('click', function() {
        if (instruction.innerHTML.startsWith('Instruks')) {
          instruction.innerHTML = fullText;
          arrow.innerHTML = 'expand_less'; // Skift pilens retning
          arrow.style.transform = 'rotate(180deg)'; // Roter pilen
        } else {
          instruction.innerHTML = 'Instruks';
          instruction.appendChild(arrow);
          arrow.innerHTML = 'expand_more'; // Skift pilens retning
          arrow.style.transform = 'rotate(0deg)'; // Roter pilen tilbage
        }
      });
    });
  }

function initializeMenu() {
    // Select all pages
    const pages = selectAll('.page');
    const menuContainer = select('#menu-box')

    // Populate each menu container
        pages.forEach(page => {
            const pageTitle = page.elt.getAttribute('data-title');
            const pageId = page.elt.id.match(/\d+$/)[0]; // Extract the number from the ID

            // Create menu item
            const menuItem = createDiv(pageTitle);
            menuItem.addClass('menu-item');

            // Add click event to switch pages
            menuItem.mousePressed(() => shiftPage(pageId));

            // Append menu item to the menu container
            menuItem.parent(menuContainer);
        });
}


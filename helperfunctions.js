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

  function addFocusItem(focusDiv = false) {
    let container = select('#focus-items');
    let newIndex = container.elt.childElementCount;
    
    let newFocusDiv = createDiv();
    newFocusDiv.addClass('focus-item');
    newFocusDiv.elt.setAttribute('data-index', newIndex);
  
    // Title input
    let c = createDiv().addClass('focus-title');
    let titleInput = createInput('');
    titleInput.attribute('id', 'focus-title-' + newIndex);
    titleInput.attribute('name', `focus[${newIndex}].title`);
    titleInput.attribute('placeholder', 'Ny målsætning');
    c.child(titleInput);
    newFocusDiv.child(c);
    
    // Motivation textarea
    let d = createDiv().addClass('focus-motivation');
    let motivationTextArea = createElement('textarea');
    motivationTextArea.attribute('id', 'focus-motivation-' + newIndex);
    motivationTextArea.attribute('name', `focus[${newIndex}].motivation`);
    motivationTextArea.attribute('placeholder', 'Hvad giver det dig at opnå denne målsætning?');
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
            triggerFirestoreUpdate();
            showInfo("Fokusområdet er gemt");
        }
    });
    
    // Checkbox-container with label and checkbox
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
  
    // Add event listener to checkbox
    checkboxInput.elt.addEventListener("change", function() {
        updateFocusItemModel(newFocusDiv);
        initializeProjects();
        if (select("#page2").hasClass("visible")) {
            populateProjectsUI();
        }
        hasChanged = true;
        triggerFirestoreUpdate();
        showInfo("Fokusområdet er gemt");
    });
    
    // Delete icon
    let deleteSpan = createSpan('delete');
    deleteSpan.addClass('material-icons delete-icon');
    deleteSpan.attribute('id', 'delete-focus-' + newIndex);
    deleteSpan.mousePressed(() => {
        let index = parseInt(newFocusDiv.elt.getAttribute('data-index'), 10);
        newFocusDiv.remove();
        if (currentWeekData.focus && index !== -1) {
            currentWeekData.focus.splice(index, 1);
        }
        let remainingItems = selectAll('.focus-item');
        remainingItems.forEach((item, i) => {
            item.elt.setAttribute('data-index', i);
        });
        hasChanged = true;
        triggerFirestoreUpdate();
    });
    newFocusDiv.child(deleteSpan);
    
    // Add event listeners to inputs
    let inputs = newFocusDiv.elt.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            updateFocusItemModel(newFocusDiv);
        });
        input.addEventListener('focusout', () => {
            if (!isChangingWeek && hasChanged) {
                updateFocusItemModel(newFocusDiv);
                initializeProjects();
                triggerFirestoreUpdate();
                showInfo("Fokusområdet er gemt");
            }
        });
    });
    
    container.child(newFocusDiv);

        // Automatically focus on the title input of the newly added focus item
      focusDiv &&  titleInput.elt.focus();

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
    taskDiv.child(taskTitleInput);
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
        projectContainer.child(createElement("h3", project.title || "Ukendt Målsætning"));

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
    let secHeader = createElement("h3", sec.title);
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

  // Opret en container til topmål-knapperne
  let buttonContainer = createDiv();
  buttonContainer.addClass("top-goals-buttons");
  container.child(buttonContainer);

  // For hvert topmål oprettes en knap
  topGoals.forEach(({ item, index }) => {
      let btn = createButton(item.title.substr(0, 15) + "..."); // Forkort titlen til 20 tegn
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
  detailsContainer.mousePressed(() => {
      detailsContainer.removeClass("open");
  })

  
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
      
function addCalendarTask(container, task, dayIndex) {
    // Create the task container
    const taskDiv = createDiv().addClass('calendar-task');
    taskDiv.attribute('draggable', 'true'); // Enable dragging

    // Store the index of the dragged task
    taskDiv.elt.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', currentWeekData.calendar[dayIndex].tasks.indexOf(task));
    });

    // Handle dragover to allow dropping
    taskDiv.elt.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow dropping
    });

    // Handle drop to reorder tasks
    taskDiv.elt.addEventListener('drop', (e) => {
        e.preventDefault();
        const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const targetIndex = currentWeekData.calendar[dayIndex].tasks.indexOf(task);

        // Reorder tasks in the data structure
        const [draggedTask] = currentWeekData.calendar[dayIndex].tasks.splice(draggedIndex, 1);
        currentWeekData.calendar[dayIndex].tasks.splice(targetIndex, 0, draggedTask);

        // Clear and re-render only the relevant tasks-container
        container.html('');
        currentWeekData.calendar[dayIndex].tasks.forEach((task) => {
            addCalendarTask(container, task, dayIndex);
        });

        // Focus on the active tasks-container
        container.elt.scrollIntoView({ behavior: 'smooth', block: 'start' });

        hasChanged = true;
        triggerFirestoreUpdate();
    });

    // Create the checkbox
    const checkbox = createElement('input');
    checkbox.attribute('type', 'checkbox');
    checkbox.elt.checked = task.completed;
    checkbox.addClass('calendar-checkbox');
    checkbox.changed(() => {
        task.completed = checkbox.elt.checked; // Update the task's completed state
        hasChanged = true;
        triggerFirestoreUpdate(); // Save the updated state to Firestore
        showInfo(checkbox.elt.checked ? "Opgave løst" : "Opgave på to-do listen");
    });

    // Create the title input
    const titleInput = createInput(task.title || '');
    titleInput.addClass('calendar-title');
    titleInput.attribute('placeholder', 'Ny opgave');
    titleInput.input(() => {
        task.title = titleInput.value();
        hasChanged = true;
    });
    titleInput.elt.addEventListener('focusout', () => {
        triggerFirestoreUpdate();
    });

    // Create the delete icon
    const deleteIcon = createSpan('delete');
    deleteIcon.addClass('material-icons calendar-delete-icon');
    deleteIcon.mousePressed(() => {
        const taskIndex = currentWeekData.calendar[dayIndex].tasks.indexOf(task);
        if (taskIndex > -1) {
            currentWeekData.calendar[dayIndex].tasks.splice(taskIndex, 1);
            taskDiv.remove();
            hasChanged = true;
            triggerFirestoreUpdate();
            showInfo("Opgave slettet");
        }
    });

    // Append elements to the task container
    taskDiv.child(titleInput);
    taskDiv.child(checkbox);
    taskDiv.child(deleteIcon);

    // Append the task container to the provided container
    container.child(taskDiv);
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

    // Create a container for tasks
    const tasksContainer = createDiv().addClass('tasks-container');
    const existingTasks = currentWeekData.calendar[dayIndex]?.tasks || [];
    existingTasks.forEach(task => {
      addCalendarTask(tasksContainer, task, dayIndex);
    });

    // Add a button to create new tasks
    const addTaskButton = createButton('Tilføj linje');
    addTaskButton.addClass('add-task-button');
    addTaskButton.mousePressed(() => {
      const newTask = { title: '', completed: false };
      currentWeekData.calendar[dayIndex].tasks.push(newTask);
      addCalendarTask(tasksContainer, newTask, dayIndex);
      hasChanged = true;
    });

    dayContainer.child(tasksContainer);
    dayContainer.child(addTaskButton);
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

const submenuData = {
  page1: {
    "Instruks": {
      content: [
        '"The future you see is the future you get." – Robert G. Allen',
        "Reflekter over dine vigtigste målsætninger. Brug et par minutter hver gang til at læse og redigere listen. Forsøg at skabe overordnede titler, uden at de bliver fluffy fordi de skal rumme for meget.",
        'Hvis du ser målsætningen som noget du skal fokusere på i denne periode, så sæt kryds i "Hovedfokus".'
      ]
    },
  },
  page2: {
    "Instruks" : {
      content: [
        '"Get everything into IN" - David Allen',
        "Opdel hvert af dine mål i delopgaver, så de bliver lettere at overskue og planlægge. Brug 5-10 minutter til løbende justering."
      ]
    },
  },
  page3: {
    "Instruks": {
      content: [
        '"Learn from your failure and it’s not failure. Do it again and it is." – Live Your Legend',
        '"Get over your losses instead of storing them in the pain body." – Falcon Ener Kise',
        "Skriv de vigtigste læringspunkter fra forrige periode ned - både tab og succeser - og notér, hvordan de skal integreres i dine næste skridt. Brug en enkelt linje til hvert punkt. Tid: 2-5 minutter."
      ]
    },
  },
  page4: {
    "Instruks": {
      content: [
        '"Focus is the key to the world." - William Dinsmore III',
        "Vælg aktiviteter som afspejler dit liv lige nu. Inklusiv vigtige begivenheder, hvis nødvendigt – og planlæg kerneopgaverne. Tid: 2-5 minutter."
      ]
    },
    '<span id="print-calendar">Vis kalender</span>': {
    },
  },
  page5: {
    "Instruks": {
      content: [
        "Noter, hvad du allerede nu ved, er vigtigt at fokusere på i næste periode - de elementer, du med sikkerhed ikke kan nå i denne uge. Tid: 2-5 minutter."
      ]
    },
  }
};

function initializeSubmenu() {
    // Iterate over each page in the submenuData object
    Object.keys(submenuData).forEach(pageId => {
        const pageData = submenuData[pageId];
        const placeholder = select(`#submenu-${pageId}`);

        // Ensure the placeholder exists
        if (!placeholder) return;

        // Create a shared content div for this submenu
        const sharedContentDiv = createDiv();
        sharedContentDiv.addClass("shared-content"); // Add a class for styling
        placeholder.child(sharedContentDiv);

        // Iterate over each submenu item for the page
        Object.keys(pageData).forEach(menuTitle => {
            const menuItem = pageData[menuTitle];

            // Create the button for the submenu item
            const button = createButton(menuTitle);
            button.addClass("submenu-button");
            placeholder.child(button);

            // Add click functionality to the button
            button.mousePressed(() => {
                const isVisible = sharedContentDiv.hasClass("open");

                // If the shared content div is already visible and belongs to this button, hide it
                if (isVisible && sharedContentDiv.elt.getAttribute("data-active-button") === menuTitle) {
                    sharedContentDiv.removeClass("open");
                    sharedContentDiv.elt.removeAttribute("data-active-button");
                } else {
                    // Populate the shared content div with the submenu content
                    sharedContentDiv.html(""); // Clear previous content
                    if(!menuItem.content) return;
                    menuItem.content.forEach(paragraph => {
                        const p = createP(paragraph);
                        sharedContentDiv.child(p);
                    });

                    // Show the shared content div and mark it as active for this button
                    sharedContentDiv.addClass("open");
                    sharedContentDiv.elt.setAttribute("data-active-button", menuTitle);
                }
            });
        });
    });

    select('#print-calendar').mousePressed(()=>printCalendar());

}

function getISODateForCalendar(weekNumber, dayIndex) {
    // Get the current year
    const year = new Date().getFullYear();

    // Calculate the first Monday of the year (ISO-8601 standard)
    const jan4 = new Date(year, 0, 4); // January 4th is always in the first ISO week
    const firstMonday = new Date(jan4.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))); // Adjust to the first Monday

    // Adjust the dayIndex to align with FullCalendar's Sunday-starting week
    let adjustedDayIndex = (dayIndex + 1) % 7;

    // Handle Sunday (dayIndex 6 in your logic, adjusted to 0 for FullCalendar)
    if (dayIndex === 6) {
        weekNumber += 1; // Move Sunday to the next week
        adjustedDayIndex = 0; // Reset to the first day of the next week
    }

    // Calculate the target date for the given week and adjusted day index
    const targetDate = new Date(firstMonday);
    targetDate.setDate(firstMonday.getDate() + (weekNumber - 1) * 7 + adjustedDayIndex);

    // Return the date in ISO format (YYYY-MM-DD)
    return targetDate.toISOString().split('T')[0];
}

function printCalendar() {
    // Create a modal container if it doesn't exist
    let modal = select('#calendar-modal');
    if (!modal) {
        modal = createDiv().id('calendar-modal').addClass('calendar-modal');
        modal.parent(document.body);

        // Add a print button
        const printButton = createButton('Print');
        printButton.addClass('print-button');
        printButton.mousePressed(() => {
            printModalContent();
        });
        modal.child(printButton);
        // Add a container for the FullCalendar
        const calendarContainer = createDiv().id('fullcalendar-container');
        modal.child(calendarContainer);

    } else {
        modal.remove();
        return;
    }

    // Initialize FullCalendar
    const calendarEl = document.getElementById('fullcalendar-container');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'da', // Set the locale to Danish
        initialView: 'listWeek',
        firstDay: 1, // Start the week on Monday
        headerToolbar: {
            right: 'listWeek,timeGridWeek,timeGridDay' // User can switch between views
        },
        buttonText: {
            today: 'i dag',
            month: 'måned',
            week: 'grid',
            day: 'dag',
            list: 'liste'
        },
        events: currentWeekData.calendar.flatMap((day, dayIndex) => {
            return day.tasks.map(task => ({
                title: task.title,
                start: `${getISODateForCalendar(currentWeekData.weekNumber, dayIndex)}`, // Full-day events
                allDay: true,
                backgroundColor: task.completed ? '#28a745' : '#dc3545', // Green for completed, red for pending
                borderColor: task.completed ? '#28a745' : '#dc3545' // Match border color
            }));
        })
    });

    // Render the calendar
    calendar.render();

    // Show the modal
    modal.style('display', 'block');
}

function printModalContent() {
    const modalContent = document.getElementById('calendar-modal').innerHTML;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');

    // Use modern DOM manipulation to build the document
    const printDocument = printWindow.document;

    // Set up the document structure
    printDocument.open();
    const html = printDocument.createElement('html');
    const head = printDocument.createElement('head');
    const body = printDocument.createElement('body');

    // Add title
    const title = printDocument.createElement('title');
    title.textContent = 'Print Calendar';
    head.appendChild(title);

    // Add stylesheets
    const fullCalendarStyles = printDocument.createElement('link');
    fullCalendarStyles.rel = 'stylesheet';
    fullCalendarStyles.href = 'https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/main.min.css';
    head.appendChild(fullCalendarStyles);

    const mainStyles = printDocument.createElement('link');
    mainStyles.rel = 'stylesheet';
    mainStyles.href = './styles.css';
    head.appendChild(mainStyles);

    const printStyles = printDocument.createElement('link');
    printStyles.rel = 'stylesheet';
    printStyles.href = './print-styles.css';
    head.appendChild(printStyles);

    // Add the modal content
    const printContainer = printDocument.createElement('div');
    printContainer.id = 'print-container';
    printContainer.innerHTML = modalContent;
    body.appendChild(printContainer);

    // Add a script to trigger print and close the window
    const script = printDocument.createElement('script');
    script.textContent = `
        window.onload = function() {
            window.print();
            //window.close();
        };
    `;
    body.appendChild(script);

    // Append head and body to the document
    html.appendChild(head);
    html.appendChild(body);
    printDocument.appendChild(html);
    printDocument.close();
}


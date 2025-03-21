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
    }, 2000);
  }
  


  function populateUIFromModel() {
    // For eksempel for fokusområder:
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
        if (checkboxInput && checkboxInput.elt) {
          checkboxInput.elt.checked = item.isMain;
        }
      });
    }
  }
  

  function updateFocusItemModel(focusItem) {
    // Find indekset for denne container blandt alle .focus-item elementer
    const allFocusItems = selectAll('.focus-item');
    let index = allFocusItems.findIndex(item => item.elt === focusItem.elt);
  
    const textInputs = focusItem.elt.querySelectorAll('input[type="text"]');
    const titleValue = textInputs[0] ? textInputs[0].value : "";
    const motivationValue = textInputs[1] ? textInputs[1].value : "";
  
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
    
    console.log("Projects initialized:", currentWeekData.projects);
    
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
    taskTitleInput.elt.addEventListener('blur', function() {
        if (taskTitleInput.value().trim() !== '') {
            setWeek(currentWeekNumber);
            hasChanged = false;
            showInfo("Opgavelisten er gemt");
            console.log("Current task data:", task);
        }
    });

    // Label for underopgaver
    let taskDescriptionLabel = createElement('label', 'Underopgaver:').addClass('task-description-label');

    let taskDescriptionTextArea = createElement('textarea').addClass('task-description-textarea');
    taskDescriptionTextArea.attribute('placeholder', 'Underopgaver adskilt af linjeskift');
    taskDescriptionTextArea.html(task.subtasks ? task.subtasks.map(subtask => subtask.title).join('\n') : '');
    autoResizeTextarea(taskDescriptionTextArea.elt);
    taskDescriptionTextArea.elt.addEventListener('input', function() {
        task.subtasks = taskDescriptionTextArea.value().split('\n').map(title => ({ title, completed: false, subtasks: [] }));
        autoResizeTextarea(taskDescriptionTextArea.elt);
        hasChanged = true;
    });
    taskDescriptionTextArea.elt.addEventListener('blur', function() {
        setWeek(currentWeekNumber);
        hasChanged = false;
        showInfo("Opgavelisten er gemt");
        console.log("Current task data:", task);
    });

    let deleteIcon = createSpan('delete').addClass('material-icons delete-icon');
    deleteIcon.mousePressed(function() {
        taskDiv.remove();
        currentWeekData.projects[projectIndex].tasks = currentWeekData.projects[projectIndex].tasks.filter(t => t !== task);
        hasChanged = true;
        setWeek(currentWeekNumber);
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
        projectContainer.child(createElement("h2", project.title || "Ukendt Fokusområde"));

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
  function tasksToMarkdown(tasks, level = 1) {
    let markdown = "";
    tasks.forEach(task => {
      // Opret prefix med et antal bindestreger svarende til niveauet
      let prefix = "-".repeat(level);
      markdown += `${prefix} ${task.description}\n`;
      // Hvis der findes underopgaver, kaldes funktionen rekursivt
      if (task.subtasks && task.subtasks.length > 0) {
        markdown += tasksToMarkdown(task.subtasks, level + 1);
      }
    });
    return markdown;
  }

  function markdownToTasks(mdText) {
    // Split teksten op i linjer og filtrer tomme linjer fra
    let lines = mdText.split("\n").filter(line => line.trim() !== "");
    let tasks = []; // Array til rodniveau opgaver
    let stack = []; // Stack til at holde de seneste opgaver på hvert niveau
  
    lines.forEach(line => {
      // Tjek om linjen starter med en bindestreg (efter trim)
      if (!line.trim().startsWith("-")) {
        // Tilføj en bindestreg, hvis den mangler
        line = "-" + line;
      }
      // Ændret regex: \s* for at tillade ingen eller flere mellemrum
      let match = line.match(/^(-+)\s*(.*)/);
      if (match) {
        let level = match[1].length;  // Niveau baseret på antal bindestreger
        let description = match[2].trim();
  
        let task = { description: description, completed: false, subtasks: [] };
  
        if (level === 1) {
          // Hvis niveau 1, tilføj til roden og sæt stack[0] til denne opgave
          tasks.push(task);
          stack[0] = task;
        } else {
          // For niveau >1 skal vi finde den overordnede opgave fra niveau-1
          if (stack[level - 2]) {
            stack[level - 2].subtasks.push(task);
            // Gem denne opgave på den aktuelle niveau i stacken
            stack[level - 1] = task;
          } else {
            // Hvis der ikke findes en forælder for det aktuelle niveau, tilføj opgaven til roden
            tasks.push(task);
            stack[level - 1] = task;
          }
        }
      }
    });
  
    return tasks;
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
  
  async function getWeek() {
    const docPath = `/kompas/user_1/weeks/week_${currentWeekNumber}`;
    try {
      const docRef = firebase.firestore().doc(docPath);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        currentWeekData = docSnap.data();
        //console.log(`Ugedata for uge ${currentWeekNumber} hentet:`, currentWeekData);
        // Opdater UI'en med den hentede data
        populateUIFromModel();
      } else {
        console.log(`Ingen data for uge ${currentWeekNumber} findes. Initialiserer et tomt objekt.`);
        currentWeekData = {};
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
      //console.log(`Ugedata for uge ${currentWeekNumber} opdateret:`, currentWeekData);

    } catch (error) {
      console.error("Fejl ved opdatering af ugedata:", error);
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
    let labelTitle = createElement('label', 'Fokusområde:');
    labelTitle.attribute('for', 'focus-title-' + newIndex);
    c.child(labelTitle);
    
    let titleInput = createInput('');
    titleInput.attribute('id', 'focus-title-' + newIndex);
    titleInput.attribute('name', `focus[${newIndex}].title`);
    titleInput.attribute('placeholder', 'Nyt fokusområde');
    c.child(titleInput)
    newFocusDiv.child(c);
    
    // Motivation label og input
    let d = createDiv().addClass('focusTitle')

    let labelMotivation = createElement('label', 'Motivation:');
    labelMotivation.attribute('for', 'focus-motivation-' + newIndex);
    d.child(labelMotivation);
    
    let motivationInput = createInput('');
    motivationInput.attribute('id', 'focus-motivation-' + newIndex);
    motivationInput.attribute('name', `focus[${newIndex}].motivation`);
    motivationInput.attribute('placeholder', 'Hvorfor er dette vigtigt for dig?');
    motivationInput.attribute('required', '');
    d.child(motivationInput);
    newFocusDiv.child(d);
    
    // Checkbox-container med label og checkbox
    let checkboxDiv = createDiv();
    checkboxDiv.addClass('checkbox');
    
    let labelCheckbox = createElement('label', 'Hovedfokus:');
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
      setWeek();
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
      setWeek();
    });
    
    newFocusDiv.child(deleteSpan);
    
    // Sæt event listeners på de nye inputfelter, så modellen opdateres ved ændringer
    let inputs = newFocusDiv.elt.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        updateFocusItemModel(newFocusDiv);
      });
    });
    
    container.child(newFocusDiv);
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
      autoResizeTextarea(stolthedTextArea.elt);

    }
    container.child(stolthedTextArea);
  
    // Auto-resizing
    stolthedTextArea.elt.style.overflow = "hidden";
    stolthedTextArea.elt.style.resize = "none";
    stolthedTextArea.elt.addEventListener("input", function() {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";
      // Opdater den lokale model ved input
      currentWeekData.stolthed = stolthedTextArea.value();
      hasChanged = true;
    });
    
    // Alternativt kan du også opdatere modellen på blur
    stolthedTextArea.elt.addEventListener("blur", function() {
      currentWeekData.stolthed = stolthedTextArea.value();
      setWeek();
      showInfo("Stolthed gemt");
    });
  }

  // Global auto-resize funktion
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
        placeholder: "Skriv ned alt fra forrige periode, du kan lære af – både succeser og fejl..."
      },
      {
        title: "Kilder til inspiration",
        key: "inspiration",
        placeholder: "Skriv ned kilder til inspiration, f.eks. mennesker, bøger, film, situationer..."
      },
      {
        title: "Mennesker du gerne vil møde",
        key: "mennesker",
        placeholder: "Skriv ned navne og hvorfor du vil møde dem..."
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
      // Ved blur opdateres firebase, hvis der er ændringer
      secTextArea.elt.addEventListener("blur", function() {
        currentWeekData[sec.key] = secTextArea.value();
        if (hasChanged) {
          setWeek();
          hasChanged = false;
          showInfo("Ændringer gemt");
        }
      });
      // Initial auto-resize med det samme
      autoResize(secTextArea.elt);
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
    forberedTextArea.elt.addEventListener("blur", function() {
      currentWeekData.forbered = forberedTextArea.value();
      if (hasChanged) {
        setWeek();
        hasChanged = false;
        showInfo("Ændringer gemt");
      }
    });
    // Opdater højden med det samme, så feltet matcher tekstens omfang
    autoResize(forberedTextArea.elt);
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

// Opbygger TRIN 6 – Topmål UI med knapper og en udvidelsescontainer
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
        // Tilføj knappeklasser – knappen skal have en fast bredde på 200px (styres via CSS)
        btn.addClass("top-goal-btn");
        // Sæt en data-attribut med indekset
        btn.attribute("data-goal-index", index);
        // Når knappen trykkes, kaldes toggleGoalDetails for at vise/skjule detaljerne
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

    populateCalendarUI();
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

    // Firebase-kompatibel initialisering
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

        // Sikret tilgang til opgaverne
        const existingTasks = (currentWeekData.calendar[dayIndex] && currentWeekData.calendar[dayIndex].tasks)
            ? currentWeekData.calendar[dayIndex].tasks
            : [];

        dayTextArea.html(existingTasks.map(task => task.title).join('\n'));

        dayTextArea.elt.style.overflow = "hidden";
        dayTextArea.elt.style.resize = "none";

        dayTextArea.elt.addEventListener("input", function() {
            autoResize(this);
            hasChanged = true;
        });

        dayTextArea.elt.addEventListener("blur", function() {
            const taskTitles = dayTextArea.value().split('\n').map(title => title.trim()).filter(title => title !== '');
            const parsedTasks = taskTitles.map(title => ({ title, completed: false, subtasks: [] }));
            currentWeekData.calendar[dayIndex] = { tasks: parsedTasks }; // Objekt med tasks-egenskab
            if (hasChanged) {
                setWeek();
                hasChanged = false;
                showInfo("Ændringer gemt");
                console.log("Current day tasks data:", currentWeekData.calendar[dayIndex]);
            }
        });

        autoResize(dayTextArea.elt);
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
    
    // Opret en instruktions-tekst
    let instruction = createElement("p", "Noter hvad du allerede nu ved er vigtigt at fokusere på i næste periode:");
    container.child(instruction);
    
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
    planTextArea.elt.addEventListener("input", function() {
      autoResize(this);
      currentWeekData.planForud = planTextArea.value();
      hasChanged = true;
    });
    planTextArea.elt.addEventListener("focus", function() {
      autoResize(this);
    });
    planTextArea.elt.addEventListener("blur", function() {
      currentWeekData.planForud = planTextArea.value();
      if (hasChanged) {
        setWeek();
        hasChanged = false;
        showInfo("Ændringer gemt");
      }
    });
    // Opdater højden ved initialisering
    autoResize(planTextArea.elt);
  }

// Funktion til at tilføje fold-ud funktionalitet til instruktioner
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

// Kald initializeInstructions når DOM'en er indlæst
document.addEventListener('DOMContentLoaded', initializeInstructions);

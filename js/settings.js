const classList = JSON.parse(localStorage.getItem("classes")) || [];
const categoryWeights = JSON.parse(localStorage.getItem("categoryWeights")) || {};
const schedule = JSON.parse(localStorage.getItem("schedule")) || [];
const gradingScheme = JSON.parse(localStorage.getItem("gradingScheme")) || [];

const classSelect = document.getElementById("weight-class-select");
const weightsForm = document.getElementById("category-weights-form");
const scheduleContainer = document.getElementById("schedule-container");
const classListContainer = document.getElementById("class-list-container");
const gradingSchemeContainer = document.getElementById("grading-scheme-container");

// ========================
// GRADING SCHEME FUNCTIONS
// ========================

/**
 * Renders the grading scheme form
 */
function renderGradingScheme() {
  gradingSchemeContainer.innerHTML = "";
  
  if (gradingScheme.length === 0) {
    gradingSchemeContainer.innerHTML = "<p>No grading scheme defined. Add grade levels below.</p>";
    return;
  }
  
  // Sort grading scheme by min percentage (descending)
  const sortedScheme = [...gradingScheme].sort((a, b) => b.min - a.min);
  
  sortedScheme.forEach((grade, index) => {
    const gradeDiv = document.createElement("div");
    gradeDiv.className = "grade-level";
    
    gradeDiv.innerHTML = `
      <div class="grade-input-group">
        <label>Letter Grade:</label>
        <input type="text" class="grade-letter" value="${grade.letter}" placeholder="A+" />
      </div>
      <div class="grade-input-group">
        <label>Min Percentage:</label>
        <input type="number" class="grade-min" value="${grade.min}" min="0" max="100" step="0.1" />
      </div>
      <div class="grade-input-group">
        <label>Max Percentage:</label>
        <input type="number" class="grade-max" value="${grade.max}" min="0" max="100" step="0.1" />
      </div>
      <div class="grade-input-group">
        <label>GPA Value:</label>
        <input type="number" class="grade-gpa" value="${grade.gpa || ''}" min="0" max="4" step="0.1" placeholder="4.0" />
      </div>
      <button class="remove-grade-btn" data-index="${index}">🗑️ Remove</button>
    `;
    
    gradingSchemeContainer.appendChild(gradeDiv);
  });
  
  // Add event listeners to remove buttons
  gradingSchemeContainer.querySelectorAll(".remove-grade-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(btn.dataset.index);
      removeGradeLevel(index);
    });
  });
}

/**
 * Adds a new grade level to the grading scheme
 */
function addGradeLevel() {
  gradingScheme.push({
    letter: "",
    min: 0,
    max: 0,
    gpa: 0
  });
  renderGradingScheme();
}

/**
 * Removes a grade level from the grading scheme
 * @param {number} index - The index of the grade level to remove
 */
function removeGradeLevel(index) {
  if (index >= 0 && index < gradingScheme.length) {
    gradingScheme.splice(index, 1);
    renderGradingScheme();
  }
}

/**
 * Saves the grading scheme to localStorage
 */
function saveGradingScheme() {
  // Validate the grading scheme
  const gradeLevels = gradingSchemeContainer.querySelectorAll(".grade-level");
  const newGradingScheme = [];
  let isValid = true;
  let errorMessage = "";
  
  gradeLevels.forEach((level, index) => {
    const letter = level.querySelector(".grade-letter").value.trim();
    const min = parseFloat(level.querySelector(".grade-min").value);
    const max = parseFloat(level.querySelector(".grade-max").value);
    const gpa = parseFloat(level.querySelector(".grade-gpa").value) || 0;
    
    if (!letter) {
      isValid = false;
      errorMessage = "Letter grade cannot be empty";
      return;
    }
    
    if (isNaN(min) || isNaN(max)) {
      isValid = false;
      errorMessage = "Min and max percentages must be numbers";
      return;
    }
    
    if (min < 0 || min > 100 || max < 0 || max > 100) {
      isValid = false;
      errorMessage = "Percentages must be between 0 and 100";
      return;
    }
    
    if (min > max) {
      isValid = false;
      errorMessage = "Min percentage cannot be greater than max percentage";
      return;
    }
    
    if (isNaN(gpa) || gpa < 0 || gpa > 4) {
      isValid = false;
      errorMessage = "GPA must be a number between 0 and 4";
      return;
    }
    
    newGradingScheme.push({ letter, min, max, gpa });
  });
  
  if (!isValid) {
    alert(`Error: ${errorMessage}`);
    return;
  }
  
  // Check for overlapping ranges
  for (let i = 0; i < newGradingScheme.length; i++) {
    for (let j = i + 1; j < newGradingScheme.length; j++) {
      const a = newGradingScheme[i];
      const b = newGradingScheme[j];
      
      // Check if ranges overlap (excluding exact boundaries)
      if ((a.min < b.max && a.max > b.min) || (b.min < a.max && b.max > a.min)) {
        alert("Error: Grade ranges cannot overlap");
        return;
      }
    }
  }
  
  // Check for coverage of the 0-100 range with proper continuity
  const sortedScheme = [...newGradingScheme].sort((a, b) => b.min - b.min); // Sort by min descending
  
  // Check if the highest grade goes to 100
  const highestGrade = sortedScheme[0];
  if (highestGrade.max !== 100) {
    alert("Error: The highest grade must have a max value of 100");
    return;
  }
  
  // Check if the lowest grade goes to 0
  const lowestGrade = sortedScheme[sortedScheme.length - 1];
  if (lowestGrade.min !== 0) {
    alert("Error: The lowest grade must have a min value of 0");
    return;
  }
  
  // Check for continuity between grades (no gaps)
  for (let i = 0; i < sortedScheme.length - 1; i++) {
    const currentGrade = sortedScheme[i];
    const nextGrade = sortedScheme[i + 1];
    
    // Current grade's min should be next grade's max + 1 (no gaps)
    if (currentGrade.min !== nextGrade.max + 1) {
      alert(`Error: There's a gap between ${currentGrade.letter} (min: ${currentGrade.min}) and ${nextGrade.letter} (max: ${nextGrade.max}). The min of a higher grade should be exactly 1 point above the max of the next lower grade.`);
      return;
    }
  }
  
  // Save the grading scheme
  localStorage.setItem("gradingScheme", JSON.stringify(newGradingScheme));
  gradingScheme.length = 0;
  gradingScheme.push(...newGradingScheme);
  alert("Grading scheme saved successfully!");
}

// ========================
// DATA IMPORT/EXPORT FUNCTIONS
// ========================

/**
 * Exports all application data to a JSON file
 */
function exportData() {
  const allData = {
    classes: JSON.parse(localStorage.getItem("classes") || "[]"),
    assignments: JSON.parse(localStorage.getItem("assignments") || "{}"),
    categoryWeights: JSON.parse(localStorage.getItem("categoryWeights") || "{}"),
    schedule: JSON.parse(localStorage.getItem("schedule") || "[]"),
    gradingScheme: JSON.parse(localStorage.getItem("gradingScheme") || "[]"),
    quickLinks: JSON.parse(localStorage.getItem("quickLinks") || "[]")
  };

  const dataStr = JSON.stringify(allData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `class_manager_data_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports data from a JSON file
 * @param {File} file - The JSON file to import
 */
function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      if (!confirm("This will overwrite all current data. Continue?")) {
        return;
      }

      // Validate the imported data structure
      if (!data.classes || !data.assignments || !data.categoryWeights || !data.schedule) {
        throw new Error("Invalid data format. Missing required fields.");
      }

      // Store the imported data
      localStorage.setItem("classes", JSON.stringify(data.classes));
      localStorage.setItem("assignments", JSON.stringify(data.assignments));
      localStorage.setItem("categoryWeights", JSON.stringify(data.categoryWeights));
      localStorage.setItem("schedule", JSON.stringify(data.schedule));
      localStorage.setItem("gradingScheme", JSON.stringify(data.gradingScheme || []));
      localStorage.setItem("quickLinks", JSON.stringify(data.quickLinks || []));
      
      alert("Data imported successfully! Page will now reload.");
      setTimeout(() => location.reload(), 1000);
    } catch (error) {
      alert("Error importing data: " + error.message);
      console.error("Import error:", error);
    }
  };
  reader.onerror = () => {
    alert("Error reading file");
  };
  reader.readAsText(file);
}

// ========================
// CLASS WEIGHT FUNCTIONS
// ========================

/**
 * Populates the class dropdown with available classes
 */
function populateClassDropdown() {
  classSelect.innerHTML = "";
  const classes = JSON.parse(localStorage.getItem("classes")) || [];
  
  classes.forEach(cls => {
    const option = document.createElement("option");
    option.value = cls.name;
    option.textContent = cls.name;
    classSelect.appendChild(option);
  });

  if (classSelect.value) {
    loadWeightsForm(classSelect.value);
  }

  classSelect.addEventListener("change", () => {
    loadWeightsForm(classSelect.value);
  });
}

/**
 * Loads the weight inputs for the selected class
 * @param {string} className - The name of the class to load weights for
 */
function loadWeightsForm(className) {
  weightsForm.innerHTML = "";
  const weights = categoryWeights[className] || {};

  for (const category in weights) {
    createWeightInput(category, weights[category]);
  }

  const addCategoryBtn = document.createElement("button");
  addCategoryBtn.textContent = "+ Add Category";
  addCategoryBtn.type = "button";
  addCategoryBtn.className = "add-category-btn";
  addCategoryBtn.addEventListener("click", () => {
    const newCategory = prompt("Enter new category name:");
    if (newCategory && newCategory.trim() && !weights[newCategory.trim()]) {
      const trimmedCategory = newCategory.trim();
      weights[trimmedCategory] = 0;
      createWeightInput(trimmedCategory, 0);
    } else if (newCategory && weights[newCategory.trim()]) {
      alert("Category already exists!");
    }
  });

  weightsForm.appendChild(addCategoryBtn);
}

/**
 * Creates a weight input field for a category
 * @param {string} category - The category name
 * @param {number} value - The weight value
 */
function createWeightInput(category, value) {
  const div = document.createElement("div");
  div.className = "weight-input-group";

  const label = document.createElement("label");
  label.textContent = `${category} Weight (%)`;

  const input = document.createElement("input");
  input.type = "number";
  input.name = category;
  input.value = value;
  input.min = 0;
  input.max = 100;
  input.className = "weight-input";

  div.appendChild(label);
  div.appendChild(input);
  weightsForm.insertBefore(div, weightsForm.lastChild);
}

/**
 * Saves the weights for the selected class
 * @param {string} className - The name of the class to save weights for
 */
function saveWeights(className) {
  const inputs = weightsForm.querySelectorAll(".weight-input");
  categoryWeights[className] = {};
  
  let totalWeight = 0;
  inputs.forEach((input) => {
    if (input.name) {
      const weight = parseInt(input.value, 10) || 0;
      categoryWeights[className][input.name] = weight;
      totalWeight += weight;
    }
  });

  if (totalWeight !== 100) {
    if (!confirm(`Weights add up to ${totalWeight}% (not 100%). Save anyway?`)) {
      return;
    }
  }

  localStorage.setItem("categoryWeights", JSON.stringify(categoryWeights));
  alert(`Weights saved for ${className}`);
}

// ========================
// CLASS MANAGEMENT FUNCTIONS
// ========================

/**
 * Renders the class list with delete buttons
 */
function renderClassList() {
  classListContainer.innerHTML = "";
  const classes = JSON.parse(localStorage.getItem("classes")) || [];
  
  if (classes.length === 0) {
    classListContainer.innerHTML = "<p>No classes found. Add classes from the Class Setup page.</p>";
    return;
  }
  
  const table = document.createElement("table");
  table.className = "class-management-table";
  
  // Create table header
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `
    <th>Class Name</th>
    <th>Teacher</th>
    <th>Room</th>
    <th>Period</th>
    <th>Actions</th>
  `;
  table.appendChild(headerRow);
  
  // Create table rows for each class
  classes.forEach((cls, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${cls.name}</td>
      <td>${cls.teacher || "-"}</td>
      <td>${cls.room || "-"}</td>
      <td>${cls.period || "-"}</td>
      <td>
        <button class="delete-class-btn" data-index="${index}">🗑️ Delete</button>
      </td>
    `;
    table.appendChild(row);
  });
  
  classListContainer.appendChild(table);
  
  // Add event listeners to delete buttons
  classListContainer.querySelectorAll(".delete-class-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(btn.dataset.index);
      deleteClass(index);
    });
  });
}

/**
 * Deletes a class and all related data
 * @param {number} index - The index of the class to delete
 */
function deleteClass(index) {
  const classes = JSON.parse(localStorage.getItem("classes")) || [];
  
  if (index < 0 || index >= classes.length) {
    alert("Invalid class index");
    return;
  }
  
  const className = classes[index].name;
  
  if (!confirm(`Are you sure you want to delete "${className}" and all its associated data? This action cannot be undone.`)) {
    return;
  }
  
  // Remove class from classes array
  classes.splice(index, 1);
  localStorage.setItem("classes", JSON.stringify(classes));
  
  // Remove class assignments
  const assignments = JSON.parse(localStorage.getItem("assignments")) || {};
  delete assignments[className];
  localStorage.setItem("assignments", JSON.stringify(assignments));
  
  // Remove class category weights
  const categoryWeights = JSON.parse(localStorage.getItem("categoryWeights")) || {};
  delete categoryWeights[className];
  localStorage.setItem("categoryWeights", JSON.stringify(categoryWeights));
  
  alert(`Class "${className}" and all related data have been deleted.`);
  
  // Refresh UI
  populateClassDropdown();
  renderClassList();
}

// ========================
// SCHEDULE FUNCTIONS (UPDATED WITH WEEKDAYS)
// ========================

/**
 * Renders all schedule periods in the schedule container
 */
function renderSchedule() {
  scheduleContainer.innerHTML = "";
  const schedule = JSON.parse(localStorage.getItem("schedule")) || [];

  if (schedule.length === 0) {
    scheduleContainer.innerHTML = "<p>No schedule periods defined. Add periods below.</p>";
    return;
  }

  schedule.forEach((period, index) => {
    const periodDiv = document.createElement("div");
    periodDiv.className = "period-card";

    // Create weekday checkboxes
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let weekdaysHTML = '';
    weekdays.forEach(day => {
      const isChecked = period.weekdays && period.weekdays.includes(day);
      weekdaysHTML += `
        <label>
          <input type="checkbox" value="${day}" ${isChecked ? 'checked' : ''} class="weekday-checkbox">
          ${day}
        </label>
      `;
    });

    periodDiv.innerHTML = `
      <div class="period-field">
        <label>Period Name:</label>
        <input type="text" class="period-name" value="${period.name}" placeholder="e.g., Period 1" />
      </div>
      <div class="period-field">
        <label>Start Time:</label>
        <input type="time" class="period-start" value="${period.start}" />
      </div>
      <div class="period-field">
        <label>End Time:</label>
        <input type="time" class="period-end" value="${period.end}" />
      </div>
      <div class="period-field">
        <label>Active Days:</label>
        <div class="weekday-checkboxes">
          ${weekdaysHTML}
        </div>
      </div>
      <button class="remove-period-btn" data-index="${index}">🗑️ Remove</button>
    `;

    scheduleContainer.appendChild(periodDiv);
  });

  // Add event listeners to remove buttons
  scheduleContainer.querySelectorAll(".remove-period-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(btn.dataset.index);
      removePeriod(index);
    });
  });
}

/**
 * Adds a new period to the schedule
 */
function addNewPeriod() {
  const schedule = JSON.parse(localStorage.getItem("schedule")) || [];
  schedule.push({
    name: `Period ${schedule.length + 1}`,
    start: "08:00",
    end: "09:00",
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri"] // Default to weekdays
  });
  localStorage.setItem("schedule", JSON.stringify(schedule));
  renderSchedule();
}

/**
 * Removes a period from the schedule
 * @param {number} index - The index of the period to remove
 */
function removePeriod(index) {
  const schedule = JSON.parse(localStorage.getItem("schedule")) || [];
  
  if (index >= 0 && index < schedule.length) {
    schedule.splice(index, 1);
    localStorage.setItem("schedule", JSON.stringify(schedule));
    renderSchedule();
  }
}

/**
 * Saves the schedule to localStorage
 */
function saveSchedule() {
  const periodCards = scheduleContainer.querySelectorAll(".period-card");
  const newSchedule = [];
  let isValid = true;
  let errorMessage = "";
  
  periodCards.forEach((card, index) => {
    const name = card.querySelector(".period-name").value.trim();
    const start = card.querySelector(".period-start").value;
    const end = card.querySelector(".period-end").value;
    
    // Get selected weekdays
    const weekdayCheckboxes = card.querySelectorAll(".weekday-checkbox:checked");
    const weekdays = Array.from(weekdayCheckboxes).map(cb => cb.value);
    
    if (!name) {
      isValid = false;
      errorMessage = "Period name cannot be empty";
      return;
    }
    
    if (!start || !end) {
      isValid = false;
      errorMessage = "Start and end times are required";
      return;
    }
    
    if (start >= end) {
      isValid = false;
      errorMessage = "Start time must be before end time";
      return;
    }
    
    if (weekdays.length === 0) {
      isValid = false;
      errorMessage = "At least one weekday must be selected";
      return;
    }
    
    newSchedule.push({ name, start, end, weekdays });
  });
  
  if (!isValid) {
    alert(`Error: ${errorMessage}`);
    return;
  }
  
  // Check for overlapping periods on the same days
  for (let i = 0; i < newSchedule.length; i++) {
    for (let j = i + 1; j < newSchedule.length; j++) {
      const a = newSchedule[i];
      const b = newSchedule[j];
      
      // Check if periods share any common days
      const commonDays = a.weekdays.filter(day => b.weekdays.includes(day));
      
      // Check if time ranges overlap on common days
      if (commonDays.length > 0 && (a.start < b.end && a.end > b.start)) {
        alert(`Error: Time ranges overlap between ${a.name} and ${b.name} on ${commonDays.join(', ')}`);
        return;
      }
    }
  }
  
  // Save the schedule
  localStorage.setItem("schedule", JSON.stringify(newSchedule));
  alert("Schedule saved successfully!");
}

// ========================
// INITIALIZATION (UPDATED)
// ========================

/**
 * Sets up all event listeners for the settings page
 */
function setupSettingsPage() {
  // Initialize grading scheme section
  renderGradingScheme();
  
  // Initialize class weights section
  populateClassDropdown();
  
  // Initialize class management section
  renderClassList();
  
  // Initialize schedule section
  renderSchedule();

  // Set up button event listeners
  document.getElementById("save-weights-btn").addEventListener("click", () => {
    const className = classSelect.value;
    if (className) {
      saveWeights(className);
    } else {
      alert("Please select a class first");
    }
  });

  // Schedule buttons
  document.getElementById("add-schedule-btn").addEventListener("click", addNewPeriod);
  
  // Grading scheme buttons
  document.getElementById("add-grade-btn").addEventListener("click", addGradeLevel);
  document.getElementById("save-grading-scheme-btn").addEventListener("click", saveGradingScheme);

  // Set up import/export buttons
  document.getElementById("export-data-btn").addEventListener("click", exportData);
  document.getElementById("import-data-btn").addEventListener("click", () => {
    document.getElementById("import-data-input").click();
  });
  document.getElementById("import-data-input").addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      importData(e.target.files[0]);
    }
  });
  
  // Add a save button for the schedule
  const saveScheduleBtn = document.createElement("button");
  saveScheduleBtn.textContent = "💾 Save Schedule";
  saveScheduleBtn.id = "save-schedule-btn";
  saveScheduleBtn.addEventListener("click", saveSchedule);
  scheduleContainer.parentNode.insertBefore(saveScheduleBtn, document.getElementById("add-schedule-btn"));
}

// Initialize the page when DOM is loaded
document.addEventListener("DOMContentLoaded", setupSettingsPage);

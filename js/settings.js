const classList = JSON.parse(localStorage.getItem("classes")) || [];
const categoryWeights = JSON.parse(localStorage.getItem("categoryWeights")) || {};
const schedule = JSON.parse(localStorage.getItem("schedule")) || [];

const classSelect = document.getElementById("weight-class-select");
const weightsForm = document.getElementById("category-weights-form");
const scheduleContainer = document.getElementById("schedule-container");
const classListContainer = document.getElementById("class-list-container");

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
    schedule: JSON.parse(localStorage.getItem("schedule") || "[]")
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
// SCHEDULE FUNCTIONS
// ========================

/**
 * Renders all schedules in the schedule container
 */
function renderSchedules() {
  scheduleContainer.innerHTML = "";
  const schedules = JSON.parse(localStorage.getItem("schedules")) || [];

  schedules.forEach((schedule, index) => {
    const card = document.createElement("div");
    card.className = "schedule-card";

    const nameDiv = document.createElement("div");
    nameDiv.className = "schedule-field";
    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Schedule Name:";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = schedule.name;
    nameInput.placeholder = "Schedule Name";
    nameInput.addEventListener("change", () => {
      schedule.name = nameInput.value.trim();
      saveSchedules();
    });
    nameDiv.appendChild(nameLabel);
    nameDiv.appendChild(nameInput);

    const daysDiv = document.createElement("div");
    daysDiv.className = "schedule-field";
    const daysLabel = document.createElement("label");
    daysLabel.textContent = "Days (comma separated):";
    const daysInput = document.createElement("input");
    daysInput.type = "text";
    daysInput.placeholder = "Mon,Tue,Wed,Thu,Fri";
    daysInput.value = schedule.days.join(",");
    daysInput.addEventListener("change", () => {
      schedule.days = daysInput.value.split(",").map(d => d.trim()).filter(d => d);
      saveSchedules();
    });
    daysDiv.appendChild(daysLabel);
    daysDiv.appendChild(daysInput);

    const periodsDiv = document.createElement("div");
    periodsDiv.className = "schedule-field";
    const periodsLabel = document.createElement("label");
    periodsLabel.textContent = "Periods (comma separated):";
    const periodsInput = document.createElement("input");
    periodsInput.type = "text";
    periodsInput.placeholder = "8:00-9:00,9:10-10:00";
    periodsInput.value = schedule.periods.join(",");
    periodsInput.addEventListener("change", () => {
      schedule.periods = periodsInput.value.split(",").map(p => p.trim()).filter(p => p);
      saveSchedules();
    });
    periodsDiv.appendChild(periodsLabel);
    periodsDiv.appendChild(periodsInput);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete Schedule";
    deleteBtn.className = "delete-schedule-btn";
    deleteBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete this schedule?")) {
        schedules.splice(index, 1);
        saveSchedules();
        renderSchedules();
      }
    });

    card.appendChild(nameDiv);
    card.appendChild(daysDiv);
    card.appendChild(periodsDiv);
    card.appendChild(deleteBtn);
    scheduleContainer.appendChild(card);
  });
}

/**
 * Saves all schedules to localStorage
 */
function saveSchedules() {
  localStorage.setItem("schedules", JSON.stringify(schedules));
}

/**
 * Adds a new schedule template
 */
function addNewSchedule() {
  const newSchedule = {
    name: `Schedule ${schedules.length + 1}`,
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    periods: ["8:00-9:00", "9:10-10:00", "10:10-11:00", "11:10-12:00", "13:00-14:00", "14:10-15:00"]
  };
  schedules.push(newSchedule);
  saveSchedules();
  renderSchedules();
}

// ========================
// INITIALIZATION
// ========================

/**
 * Sets up all event listeners for the settings page
 */
function setupSettingsPage() {
  // Initialize class weights section
  populateClassDropdown();
  
  // Initialize class management section
  renderClassList();
  
  // Initialize schedules section
  renderSchedules();

  // Set up button event listeners
  document.getElementById("save-weights-btn").addEventListener("click", () => {
    const className = classSelect.value;
    if (className) {
      saveWeights(className);
    } else {
      alert("Please select a class first");
    }
  });

  document.getElementById("add-schedule-btn").addEventListener("click", addNewSchedule);

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
}

// Initialize the page when DOM is loaded
document.addEventListener("DOMContentLoaded", setupSettingsPage);

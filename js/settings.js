const classList = JSON.parse(localStorage.getItem("classes")) || [];
const categoryWeights = JSON.parse(localStorage.getItem("categoryWeights")) || {};
const schedules = JSON.parse(localStorage.getItem("schedules")) || [];

const classSelect = document.getElementById("weight-class-select");
const weightsForm = document.getElementById("category-weights-form");
const scheduleContainer = document.getElementById("schedule-container");

// Populate dropdown with class names
function populateClassDropdown() {
  classSelect.innerHTML = "";
  classList.forEach(cls => {
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

// Load weight inputs for selected class
function loadWeightsForm(className) {
  weightsForm.innerHTML = "";

  const weights = categoryWeights[className] || {};

  for (const category in weights) {
    createWeightInput(category, weights[category]);
  }

  const addCategoryBtn = document.createElement("button");
  addCategoryBtn.textContent = "+ Add Category";
  addCategoryBtn.type = "button";
  addCategoryBtn.addEventListener("click", () => {
    const newCategory = prompt("Enter new category name:");
    if (newCategory && !weights[newCategory]) {
      weights[newCategory] = 0;
      createWeightInput(newCategory, 0);
    }
  });

  weightsForm.appendChild(addCategoryBtn);
}

function createWeightInput(category, value) {
  const label = document.createElement("label");
  label.textContent = `${category} Weight (%)`;

  const input = document.createElement("input");
  input.type = "number";
  input.name = category;
  input.value = value;
  input.min = 0;
  input.max = 100;

  weightsForm.appendChild(label);
  weightsForm.appendChild(input);
}

// Save weights for selected class
function saveWeights(className) {
  const inputs = weightsForm.querySelectorAll("input");
  categoryWeights[className] = {};
  inputs.forEach((input) => {
    if (input.name) {
      categoryWeights[className][input.name] = parseInt(input.value, 10);
    }
  });
  localStorage.setItem("categoryWeights", JSON.stringify(categoryWeights));
  alert(`Weights saved for ${className}`);
}

// Render editable schedule cards
function renderSchedules() {
  scheduleContainer.innerHTML = "";

  schedules.forEach((schedule, index) => {
    const card = document.createElement("div");
    card.className = "schedule-card";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = schedule.name;
    nameInput.placeholder = "Schedule Name";
    nameInput.addEventListener("change", () => {
      schedule.name = nameInput.value;
      saveSchedules();
    });

    const daysInput = document.createElement("input");
    daysInput.type = "text";
    daysInput.placeholder = "Days (e.g. Mon,Tue)";
    daysInput.value = schedule.days.join(",");
    daysInput.addEventListener("change", () => {
      schedule.days = daysInput.value.split(",").map(d => d.trim());
      saveSchedules();
    });

    const periodsInput = document.createElement("input");
    periodsInput.type = "text";
    periodsInput.placeholder = "Periods (e.g. 8:00-9:00,9:10-10:00)";
    periodsInput.value = schedule.periods.join(",");
    periodsInput.addEventListener("change", () => {
      schedule.periods = periodsInput.value.split(",").map(p => p.trim());
      saveSchedules();
    });

    card.appendChild(nameInput);
    card.appendChild(daysInput);
    card.appendChild(periodsInput);

    scheduleContainer.appendChild(card);
  });
}

function saveSchedules() {
  localStorage.setItem("schedules", JSON.stringify(schedules));
}

// Add a new schedule
function addNewSchedule() {
  const newSchedule = {
    name: `Schedule ${schedules.length + 1}`,
    days: [],
    periods: [],
  };
  schedules.push(newSchedule);
  saveSchedules();
  renderSchedules();
}

// Initialize page
function setupSettingsPage() {
  populateClassDropdown();
  renderSchedules();

  document.getElementById("save-weights-btn").addEventListener("click", () => {
    const className = classSelect.value;
    saveWeights(className);
  });

  document.getElementById("add-schedule-btn").addEventListener("click", () => {
    addNewSchedule();
  });
}

document.addEventListener("DOMContentLoaded", setupSettingsPage);

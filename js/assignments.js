// DOM Elements
const form = document.getElementById('add-assignment-form');
const list = document.getElementById('assignment-list');
const classSelect = document.getElementById('class-select');
const categorySelect = document.getElementById('category');
const gpaDisplay = document.getElementById("gpa-display");
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearSearchBtn = document.getElementById('clear-search-btn');
const sortBySelect = document.getElementById('sort-by');

// State variables
let currentSearchTerm = '';
let currentSortMethod = 'due-asc';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  loadClasses();
  setupEventListeners();
  checkPastDueAssignments();
});

function setupEventListeners() {
  // Form submission
  form.addEventListener('submit', handleFormSubmit);
  
  // Class selection change
  classSelect.addEventListener('change', handleClassChange);
  
  // Search functionality
  searchBtn.addEventListener('click', handleSearch);
  clearSearchBtn.addEventListener('click', clearSearch);
  searchInput.addEventListener('keyup', (e) => e.key === 'Enter' && handleSearch());
  
  // Sorting
  sortBySelect.addEventListener('change', handleSortChange);
}

// Check for past due assignments and prompt user
function checkPastDueAssignments() {
  const allAssignments = JSON.parse(localStorage.getItem("assignments") || "{}");
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
  
  for (const className in allAssignments) {
    allAssignments[className].forEach((assignment, index) => {
      const dueDate = new Date(assignment.due);
      dueDate.setHours(0, 0, 0, 0);
      
      // Check if assignment is past due, not completed, and doesn't have a status note
      if (!assignment.completed && dueDate < today && !assignment.statusNote) {
        const response = confirm(`Assignment "${assignment.title}" in ${className} is past due. Is it missing or not graded yet?\n\nClick OK if it's missing, Cancel if it's not graded yet.`);
        
        // Update the assignment with status note
        if (response) {
          assignment.statusNote = "m"; // Missing
        } else {
          assignment.statusNote = "nm"; // Not graded yet
        }
        
        // Save the updated assignments
        localStorage.setItem("assignments", JSON.stringify(allAssignments));
      }
      
      // If assignment was marked as missing but now has a grade, change status to "nm"
      if (assignment.completed && assignment.grade !== null && assignment.statusNote === "m") {
        assignment.statusNote = "nm";
        localStorage.setItem("assignments", JSON.stringify(allAssignments));
      }
    });
  }
}

// Main functions
function getSelectedClass() {
  const params = new URLSearchParams(window.location.search);
  return params.get('class');
}

function loadClasses() {
  const classes = JSON.parse(localStorage.getItem('classes') || '[]');
  classSelect.innerHTML = classes.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  
  const selected = getSelectedClass();
  if (selected) classSelect.value = selected;
  
  loadCategories(classSelect.value);
  loadAssignments(classSelect.value);
  updateClassGrade(classSelect.value);
}

function loadCategories(className) {
  const weights = JSON.parse(localStorage.getItem("categoryWeights") || "{}");
  const categories = weights[className] ? Object.keys(weights[className]) : [];
  categorySelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  
  // If no categories exist for this class, disable the form
  if (categories.length === 0) {
    form.querySelector('button[type="submit"]').disabled = true;
    form.querySelector('button[type="submit"]').title = "No categories defined for this class. Please set up categories in Settings first.";
  } else {
    form.querySelector('button[type="submit"]').disabled = false;
    form.querySelector('button[type="submit"]').title = "";
  }
}

// Assignment CRUD operations
function handleFormSubmit(e) {
  e.preventDefault();
  
  const assignment = {
    class: classSelect.value,
    title: form['assignment-title'].value.trim(),
    link: form['assignment-link'].value.trim(),
    due: form['due-date'].value,
    category: categorySelect.value,
    points: parseInt(form['points'].value, 10),
    completed: false,
    grade: null,
    statusNote: null
  };

  if (!assignment.title || !assignment.due || isNaN(assignment.points)) {
    alert('Please fill in all required fields');
    return;
  }

  const allAssignments = JSON.parse(localStorage.getItem("assignments") || "{}");
  if (!allAssignments[assignment.class]) allAssignments[assignment.class] = [];
  allAssignments[assignment.class].push(assignment);
  localStorage.setItem("assignments", JSON.stringify(allAssignments));

  loadAssignments(assignment.class);
  updateClassGrade(assignment.class);
  form.reset();
}

// Search functionality
function handleSearch() {
  currentSearchTerm = searchInput.value.trim();
  loadAssignments(classSelect.value);
}

function clearSearch() {
  searchInput.value = '';
  currentSearchTerm = '';
  loadAssignments(classSelect.value);
}

function filterAssignments(assignments, searchTerm) {
  if (!searchTerm) return assignments;
  
  return assignments.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.category && a.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    a.due.includes(searchTerm) ||
    a.points.toString().includes(searchTerm)
  );
}

// Sorting functionality
function handleSortChange() {
  currentSortMethod = sortBySelect.value;
  loadAssignments(classSelect.value);
}

function sortAssignments(assignments, sortMethod) {
  const sorted = [...assignments];
  
  switch(sortMethod) {
    case 'title-asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case 'due-asc':
      return sorted.sort((a, b) => new Date(a.due) - new Date(b.due));
    case 'due-desc':
      return sorted.sort((a, b) => new Date(b.due) - new Date(a.due));
    case 'points-asc':
      return sorted.sort((a, b) => a.points - b.points);
    case 'points-desc':
      return sorted.sort((a, b) => b.points - a.points);
    case 'status':
      return sorted.sort((a, b) => {
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
        return new Date(a.due) - new Date(b.due); // Secondary sort by due date
      });
    default:
      return sorted;
  }
}

// Assignment display
function loadAssignments(className) {
  const allAssignments = JSON.parse(localStorage.getItem("assignments") || "{}");
  let assignments = allAssignments[className] || [];
  
  // Apply filters and sorting
  assignments = filterAssignments(assignments, currentSearchTerm);
  assignments = sortAssignments(assignments, currentSortMethod);
  
  renderAssignmentList(assignments);
}

function renderAssignmentList(assignments) {
  list.innerHTML = "";

  if (assignments.length === 0) {
    list.innerHTML = currentSearchTerm 
      ? `<div class="no-results">No assignments found matching "${currentSearchTerm}"</div>`
      : `<div class="no-results">No assignments found</div>`;
    return;
  }

  assignments.forEach((a, i) => {
    const statusIcon = a.statusNote === "m" ? "⚠️ Missing" : (a.statusNote === "nm" ? "⏳ Not Graded" : "");
    const item = document.createElement("div");
    item.className = `assignment-item ${a.completed ? 'completed' : ''}`;
    item.innerHTML = `
      <div class="assignment-header">
        <h3 class="assignment-title">${a.title}</h3>
        <span class="assignment-points">${a.points} pts</span>
      </div>
      <div class="assignment-details">
        <span class="assignment-category">${a.category}</span>
        <span class="assignment-due">📅 ${formatDate(a.due)}</span>
        ${statusIcon ? `<span class="assignment-status">${statusIcon}</span>` : ''}
      </div>
      <div class="assignment-actions">
        ${a.link ? `<a href="${a.link}" target="_blank" class="assignment-link">🔗 Link</a>` : ''}
        ${a.completed 
          ? `<span class="assignment-grade">✅ Grade: ${a.grade}%</span>`
          : ''}
        <div class="action-buttons">
          ${a.completed 
            ? `<button data-index="${i}" class="edit-grade-btn">✏️ Edit Grade</button>` 
            : `<button data-index="${i}" class="complete-btn">✔️ Mark Complete</button>`}
          <button data-index="${i}" class="delete-btn">🗑️ Delete</button>
        </div>
      </div>
    `;
    list.appendChild(item);
  });

  setupAssignmentEventListeners();
}

function formatDate(dateString) {
  // Parse the date string (assuming YYYY-MM-DD format)
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed in JavaScript
  
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

function setupAssignmentEventListeners() {
  // Mark complete
  list.querySelectorAll(".complete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const index = btn.dataset.index;
      const className = classSelect.value;
      const allAssignments = JSON.parse(localStorage.getItem("assignments") || "{}");
      const assignments = allAssignments[className] || [];
      
      const grade = prompt("Enter grade received (out of 100):");
      if (grade !== null && !isNaN(grade)) {
        assignments[index].completed = true;
        assignments[index].grade = parseFloat(grade);
        
        // If assignment was marked as missing but now has a grade, change status to "nm"
        if (assignments[index].statusNote === "m") {
          assignments[index].statusNote = "nm";
        }
        
        localStorage.setItem("assignments", JSON.stringify(allAssignments));
        updateClassGrade(className);
        loadAssignments(className);
      }
    });
  });

  // Edit grade
  list.querySelectorAll(".edit-grade-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const index = btn.dataset.index;
      const className = classSelect.value;
      const allAssignments = JSON.parse(localStorage.getItem("assignments") || "{}");
      const assignments = allAssignments[className] || [];
      const currentGrade = assignments[index].grade;
      
      const newGrade = prompt(`Edit grade (current: ${currentGrade}):`, currentGrade);
      if (newGrade !== null && !isNaN(newGrade)) {
        assignments[index].grade = parseFloat(newGrade);
        localStorage.setItem("assignments", JSON.stringify(allAssignments));
        updateClassGrade(className);
        loadAssignments(className);
      }
    });
  });

  // Delete assignment - FIXED VERSION
  list.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(btn.dataset.index);
      const className = classSelect.value;
      const allAssignments = JSON.parse(localStorage.getItem("assignments") || "{}");
      const assignments = allAssignments[className] || [];
      
      // Get the actual assignment to find its true index in the original array
      const filteredAssignments = filterAssignments(assignments, currentSearchTerm);
      const sortedAssignments = sortAssignments(filteredAssignments, currentSortMethod);
      const assignmentToDelete = sortedAssignments[index];
      
      // Find the actual index in the original array
      const actualIndex = assignments.findIndex(a => 
        a.title === assignmentToDelete.title && 
        a.due === assignmentToDelete.due && 
        a.category === assignmentToDelete.category
      );
      
      if (actualIndex === -1) {
        alert("Error: Could not find assignment to delete");
        return;
      }
      
      if (confirm("Are you sure you want to delete this assignment?")) {
        assignments.splice(actualIndex, 1);
        localStorage.setItem("assignments", JSON.stringify(allAssignments));
        loadAssignments(className);
        updateClassGrade(className);
      }
    });
  });
}

// Grade calculation
function updateClassGrade(className) {
  const weights = JSON.parse(localStorage.getItem("categoryWeights") || "{}")[className] || {};
  const assignments = JSON.parse(localStorage.getItem("assignments") || "{}")[className] || [];

  const categoryTotals = {};
  const categoryEarned = {};

  assignments.forEach(a => {
    if (!a.completed || a.grade == null) return;
    const cat = a.category;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + a.points;
    categoryEarned[cat] = (categoryEarned[cat] || 0) + (a.grade / 100) * a.points;
  });

  let weightedSum = 0;
  let totalWeight = 0;

  for (const cat in categoryEarned) {
    const weight = weights[cat] || 0;
    const earned = categoryEarned[cat];
    const total = categoryTotals[cat];
    const avg = total > 0 ? earned / total : 0;
    
    if (total > 0) {
      weightedSum += avg * weight;
      totalWeight += weight;
    }
  }

  const finalGrade = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
  const letterGrade = getLetterGrade(finalGrade);
  
  if (gpaDisplay) {
    gpaDisplay.textContent = `📊 Grade for ${className}: ${finalGrade.toFixed(2)}% - ${letterGrade}`;
  }
}

// Helper functions
function handleClassChange() {
  const selectedClass = classSelect.value;
  loadCategories(selectedClass);
  loadAssignments(selectedClass);
  updateClassGrade(selectedClass);
}

/**
 * Gets the letter grade for a given percentage based on the grading scheme
 * @param {number} percentage - The percentage grade
 * @returns {string} The letter grade
 */
function getLetterGrade(percentage) {
  const gradingScheme = JSON.parse(localStorage.getItem("gradingScheme")) || [];
  
  if (gradingScheme.length === 0) {
    return "N/A"; // No grading scheme defined
  }
  
  // Find the grade level that matches the percentage
  for (const grade of gradingScheme) {
    if (percentage >= grade.min && percentage <= grade.max) {
      return grade.letter;
    }
  }
  
  return "N/A"; // Percentage doesn't match any grade level
}

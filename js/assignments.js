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

// Status Dialog Elements
const statusDialog = document.getElementById('status-dialog');
const dialogMessage = document.getElementById('dialog-message');
const missingBtn = document.getElementById('missing-btn');
const notGradedBtn = document.getElementById('not-graded-btn');
const cancelBtn = document.getElementById('cancel-status-btn');

// State variables
let currentSearchTerm = '';
let currentSortMethod = 'due-asc';
let pastDueAssignments = [];
let currentPastDueIndex = 0;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  loadClasses();
  setupEventListeners();
  checkPastDueAssignments();
});

function setupEventListeners() {
  // Form submission
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
  
  // Class selection change
  if (classSelect) {
    classSelect.addEventListener('change', handleClassChange);
  }
  
  // Search functionality
  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }
  
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', clearSearch);
  }
  
  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => e.key === 'Enter' && handleSearch());
  }
  
  // Sorting
  if (sortBySelect) {
    sortBySelect.addEventListener('change', handleSortChange);
  }
  
  // Status dialog buttons (only if they exist)
  if (missingBtn && notGradedBtn && cancelBtn) {
    missingBtn.addEventListener('click', () => handleStatusResponse('m'));
    notGradedBtn.addEventListener('click', () => handleStatusResponse('nm'));
    cancelBtn.addEventListener('click', () => handleStatusResponse(null));
  }
}

// Check for past due assignments and prompt user
function checkPastDueAssignments() {
  // Only run on dashboard page where the dialog exists
  if (!statusDialog) return;
  
  const allAssignments = JSON.parse(localStorage.getItem("assignments") || "{}");
  const now = new Date(); // Current date and time
  
  // Reset the past due assignments array
  pastDueAssignments = [];
  
  // Find all past due assignments
  for (const className in allAssignments) {
    allAssignments[className].forEach((assignment, index) => {
      let dueDate;
      try {
        // Try to parse as ISO string (with time)
        dueDate = new Date(assignment.due);
      } catch (e) {
        // Fallback for old format (date only)
        const [year, month, day] = assignment.due.split('-').map(Number);
        dueDate = new Date(year, month - 1, day, 23, 59, 0); // Default to 11:59 PM
      }
      
      // Check if assignment is past due, not completed, and doesn't have a status note
      if (!assignment.completed && dueDate < now && !assignment.statusNote) {
        pastDueAssignments.push({
          className,
          assignmentIndex: index,
          assignment
        });
      }
      
      // If assignment was marked as missing but now has a grade, remove status note
      if (assignment.completed && assignment.grade !== null && assignment.statusNote === "m") {
        assignment.statusNote = null;
        localStorage.setItem("assignments", JSON.stringify(allAssignments));
      }
      
      // If assignment was marked as not graded yet but now has a grade, remove status note
      if (assignment.completed && assignment.grade !== null && assignment.statusNote === "nm") {
        assignment.statusNote = null;
        localStorage.setItem("assignments", JSON.stringify(allAssignments));
      }
    });
  }
  
  // If there are past due assignments, show the first one
  if (pastDueAssignments.length > 0) {
    currentPastDueIndex = 0;
    showStatusDialog();
  }
}

// Show the status dialog for the current past due assignment
function showStatusDialog() {
  if (!statusDialog || !dialogMessage) return;
  if (currentPastDueIndex >= pastDueAssignments.length) return;
  
  const { className, assignment } = pastDueAssignments[currentPastDueIndex];
  dialogMessage.textContent = `Assignment "${assignment.title}" in ${className} is past due. Is it missing or not graded yet?`;
  statusDialog.showModal();
}

// Handle the response from the status dialog
function handleStatusResponse(response) {
  if (!statusDialog) return;
  if (currentPastDueIndex >= pastDueAssignments.length) return;
  
  const { className, assignmentIndex } = pastDueAssignments[currentPastDueIndex];
  const allAssignments = JSON.parse(localStorage.getItem("assignments") || "{}");
  
  if (response) {
    allAssignments[className][assignmentIndex].statusNote = response;
    localStorage.setItem("assignments", JSON.stringify(allAssignments));
  }
  
  statusDialog.close();
  
  // Move to the next past due assignment
  currentPastDueIndex++;
  
  // If there are more past due assignments, show the next one
  if (currentPastDueIndex < pastDueAssignments.length) {
    setTimeout(showStatusDialog, 300);
  }
}

// Main functions
function getSelectedClass() {
  const params = new URLSearchParams(window.location.search);
  return params.get('class');
}

function loadClasses() {
  if (!classSelect) return;
  
  const classes = JSON.parse(localStorage.getItem('classes') || '[]');
  classSelect.innerHTML = classes.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  
  const selected = getSelectedClass();
  if (selected) classSelect.value = selected;
  
  loadCategories(classSelect.value);
  loadAssignments(classSelect.value);
  updateClassGrade(classSelect.value);
}

function loadCategories(className) {
  if (!categorySelect) return;
  
  const weights = JSON.parse(localStorage.getItem("categoryWeights") || "{}");
  const categories = weights[className] ? Object.keys(weights[className]) : [];
  categorySelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  
  // If no categories exist for this class, disable the form
  if (form) {
    const submitButton = form.querySelector('button[type="submit"]');
    if (categories.length === 0) {
      submitButton.disabled = true;
      submitButton.title = "No categories defined for this class. Please set up categories in Settings first.";
    } else {
      submitButton.disabled = false;
      submitButton.title = "";
    }
  }
}

// Assignment CRUD operations
function handleFormSubmit(e) {
  e.preventDefault();
  
  // Get time value or default to 23:59 (11:59 PM)
  let dueTime = document.getElementById('due-time')?.value.trim();
  if (!dueTime) {
    dueTime = "23:59"; // Default to 11:59 PM if no time specified
  }
  
  // Combine date and time
  const dueDateTime = `${form['due-date'].value}T${dueTime}`;
  
  const assignment = {
    class: classSelect.value,
    title: form['assignment-title'].value.trim(),
    link: form['assignment-link'].value.trim(),
    due: dueDateTime, // Now storing both date and time
    category: categorySelect.value,
    points: parseInt(form['points'].value, 10),
    completed: false,
    grade: null,
    statusNote: null // Always set to null for new assignments
  };

  if (!assignment.title || !form['due-date'].value || isNaN(assignment.points)) {
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
  if (!searchInput) return;
  
  currentSearchTerm = searchInput.value.trim();
  loadAssignments(classSelect.value);
}

function clearSearch() {
  if (!searchInput) return;
  
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
  if (!list) return;
  
  const allAssignments = JSON.parse(localStorage.getItem("assignments") || "{}");
  let assignments = allAssignments[className] || [];
  
  // Apply filters and sorting
  assignments = filterAssignments(assignments, currentSearchTerm);
  assignments = sortAssignments(assignments, currentSortMethod);
  
  renderAssignmentList(assignments);
}

function renderAssignmentList(assignments) {
  if (!list) return;
  
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

function formatDate(dateTimeString) {
  try {
    const date = new Date(dateTimeString);
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString(undefined, options);
  } catch (e) {
    // Fallback for old date format (without time)
    const [year, month, day] = dateTimeString.split('-').map(Number);
    if (year && month && day) {
      const date = new Date(year, month - 1, day);
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    }
    return dateTimeString; // Return as-is if format is unrecognized
  }
}

function setupAssignmentEventListeners() {
  if (!list) return;
  
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
        
        // Remove any status note when assignment is completed and graded
        assignments[index].statusNote = null;
        
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
        
        // Remove any status note when assignment is graded
        assignments[index].statusNote = null;
        
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
  if (!gpaDisplay) return;
  
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
  
  gpaDisplay.textContent = `📊 Grade for ${className}: ${finalGrade.toFixed(2)}% - ${letterGrade}`;
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

function calculateClassGrade(className) {
  // Check if class still exists
  const classes = JSON.parse(localStorage.getItem("classes") || "[]");
  const classExists = classes.some(c => c.name === className);
  
  if (!classExists) {
    return 0; // Return 0 if class has been deleted
  }
  
  const weights = JSON.parse(localStorage.getItem("categoryWeights") || "{}")[className] || {};
  const assignments = JSON.parse(localStorage.getItem("assignments") || "{}")[className] || [];

  const categoryTotals = {};
  const categoryEarned = {};

  // Calculate total points and earned points for each category
  assignments.forEach(a => {
    if (!a.completed || a.grade == null) return;
    const cat = a.category;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + a.points;
    categoryEarned[cat] = (categoryEarned[cat] || 0) + (a.grade / 100) * a.points;
  });

  let weightedSum = 0;
  let totalWeight = 0;

  // Only consider categories that have graded assignments
  for (const cat in categoryEarned) {
    const weight = weights[cat] || 0;
    const earned = categoryEarned[cat];
    const total = categoryTotals[cat];
    
    // Calculate category average (0 if no assignments in category)
    const avg = total > 0 ? earned / total : 0;
    
    // Add to weighted sum only if there are graded assignments
    if (total > 0) {
      weightedSum += avg * weight;
      totalWeight += weight;
    }
  }

  // Return 0 if no graded assignments exist
  return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
}

function updateGradeDisplay(className) {
  const grade = calculateClassGrade(className);
  const letterGrade = getLetterGrade(grade);
  const display = document.getElementById('gpa-display');
  if (display) {
    const roundedGrade = Math.round(grade);
    const exactGrade = grade.toFixed(2);
    display.textContent = `📊 Grade for ${className}: ${roundedGrade}% (Exact: ${exactGrade}%) - ${letterGrade}`;
  }
}

// Initialize grade display when class selection changes
document.addEventListener("DOMContentLoaded", () => {
  const classSelect = document.getElementById("class-select");
  if (classSelect) {
    // Filter out any classes that might have been deleted
    const classes = JSON.parse(localStorage.getItem("classes") || "[]");
    const currentClasses = classes.map(c => c.name);
    
    // Remove options for classes that no longer exist
    Array.from(classSelect.options).forEach(option => {
      if (option.value && !currentClasses.includes(option.value)) {
        classSelect.removeChild(option);
      }
    });
    
    classSelect.addEventListener("change", () => {
      updateGradeDisplay(classSelect.value);
    });

    // Update display for initially selected class if it still exists
    if (classSelect.value && currentClasses.includes(classSelect.value)) {
      updateGradeDisplay(classSelect.value);
    } else if (classSelect.options.length > 0) {
      // Select the first available class if the current selection is invalid
      classSelect.value = classSelect.options[0].value;
      updateGradeDisplay(classSelect.value);
    } else {
      // No classes available
      const display = document.getElementById("gpa-display");
      if (display) {
        display.textContent = "📊 No classes available";
      }
    }
  }
});

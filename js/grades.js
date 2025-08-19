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

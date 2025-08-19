function calculateClassGrade(className) {
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
  const display = document.getElementById("gpa-display");
  if (display) {
    display.textContent = `📊 Grade for ${className}: ${grade.toFixed(2)}%`;
  }
}

// Initialize grade display when class selection changes
document.addEventListener("DOMContentLoaded", () => {
  const classSelect = document.getElementById("class-select");
  if (classSelect) {
    classSelect.addEventListener("change", () => {
      updateGradeDisplay(classSelect.value);
    });

    // Update display for initially selected class
    if (classSelect.value) {
      updateGradeDisplay(classSelect.value);
    }
  }
});

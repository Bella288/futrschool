const form = document.getElementById('add-assignment-form');
const list = document.getElementById('assignment-list');
const classSelect = document.getElementById('class-select');
const categorySelect = document.getElementById('category');
const gpaDisplay = document.getElementById('gpa-display');

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
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const assignment = {
    class: classSelect.value,
    title: form['assignment-title'].value,
    link: form['assignment-link'].value,
    due: form['due-date'].value,
    category: categorySelect.value,
    points: parseInt(form['points'].value, 10),
    completed: false,
    grade: null
  };

  const allAssignments = JSON.parse(localStorage.getItem("assignments") || "{}");
  if (!allAssignments[assignment.class]) allAssignments[assignment.class] = [];
  allAssignments[assignment.class].push(assignment);
  localStorage.setItem("assignments", JSON.stringify(allAssignments));

  loadAssignments(assignment.class);
  updateClassGrade(assignment.class);
  form.reset();
});

function loadAssignments(className) {
  const allAssignments = JSON.parse(localStorage.getItem("assignments") || "{}");
  const assignments = allAssignments[className] || [];
  list.innerHTML = "";

  assignments.forEach((a, i) => {
    const item = document.createElement("div");
    item.className = "assignment-item";
    item.innerHTML = `
      <strong>${a.title}</strong> (${a.category}) - Due: ${a.due}
      ${a.link ? `<a href="${a.link}" target="_blank">🔗</a>` : ""}
      ${a.completed ? `<span>✅ Grade: ${a.grade}</span>` 
                    : `<button data-index="${i}" class="complete-btn">Mark Complete</button>`}
      <button data-index="${i}" class="delete-btn">🗑️ Delete</button>
    `;
    list.appendChild(item);
  });

  list.querySelectorAll(".complete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = btn.dataset.index;
      const grade = prompt("Enter grade received (out of 100):");
      if (grade !== null) {
        assignments[index].completed = true;
        assignments[index].grade = parseFloat(grade);
        allAssignments[className] = assignments;
        localStorage.setItem("assignments", JSON.stringify(allAssignments));
        updateClassGrade(className);
        loadAssignments(className);
      }
    });
  });

  list.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = btn.dataset.index;
      if (confirm("Are you sure you want to delete this assignment?")) {
        assignments.splice(index, 1);
        allAssignments[className] = assignments;
        localStorage.setItem("assignments", JSON.stringify(allAssignments));
        loadAssignments(className);
        updateClassGrade(className);
      }
    });
  });
}

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

  for (const cat in weights) {
    const weight = weights[cat];
    const earned = categoryEarned[cat] || 0;
    const total = categoryTotals[cat] || 0;
    const avg = total > 0 ? earned / total : 0;
    weightedSum += avg * weight;
    totalWeight += weight;
  }

  const finalGrade = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
  gpaDisplay.textContent = `📊 Grade for ${className}: ${finalGrade.toFixed(2)}%`;
}

classSelect.addEventListener("change", () => {
  const selectedClass = classSelect.value;
  loadCategories(selectedClass);
  loadAssignments(selectedClass);
  updateClassGrade(selectedClass);
});

document.addEventListener("DOMContentLoaded", loadClasses);

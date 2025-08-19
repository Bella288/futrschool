const form = document.getElementById('add-class-form');
const list = document.getElementById('class-list');

form.addEventListener('submit', e => {
  e.preventDefault();
  const classData = {
    name: form['class-name'].value,
    room: form['room-number'].value,
    teacher: form['teacher-name'].value,
    period: form['period'].value
  };
  saveClass(classData);
  renderClasses();
  form.reset();
});

function saveClass(data) {
  const classes = JSON.parse(localStorage.getItem('classes') || '[]');
  classes.push(data);
  localStorage.setItem('classes', JSON.stringify(classes));
}

function renderClasses() {
  const classes = JSON.parse(localStorage.getItem('classes') || '[]');
  list.innerHTML = classes.map(c => `
    <div class="class-item">
      <a href="dashboard.html?class=${encodeURIComponent(c.name)}">
        ${c.name} - ${c.teacher} (${c.period})
      </a>
      <button class="delete-class-btn" data-class="${encodeURIComponent(c.name)}">🗑️ Delete</button>
    </div>
  `).join('');
  
  // Add event listeners to delete buttons
  list.querySelectorAll('.delete-class-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const className = btn.dataset.class;
      deleteClass(className);
    });
  });
}

function deleteClass(className) {
  if (!confirm(`Are you sure you want to delete "${className}" and all its associated data? This action cannot be undone.`)) {
    return;
  }
  
  // Remove class from classes array
  const classes = JSON.parse(localStorage.getItem('classes') || []);
  const filteredClasses = classes.filter(c => c.name !== className);
  localStorage.setItem('classes', JSON.stringify(filteredClasses));
  
  // Remove class assignments
  const assignments = JSON.parse(localStorage.getItem('assignments') || {});
  delete assignments[className];
  localStorage.setItem('assignments', JSON.stringify(assignments));
  
  // Remove class category weights
  const categoryWeights = JSON.parse(localStorage.getItem('categoryWeights') || {});
  delete categoryWeights[className];
  localStorage.setItem('categoryWeights', JSON.stringify(categoryWeights));
  
  alert(`Class "${className}" and all related data have been deleted.`);
  
  // Refresh UI
  renderClasses();
}

renderClasses();

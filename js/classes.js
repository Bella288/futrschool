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
    <div>
      <a href="dashboard.html?class=${encodeURIComponent(c.name)}">
        ${c.name} - ${c.teacher} (${c.period})
      </a>
    </div>
  `).join('');
}

renderClasses();

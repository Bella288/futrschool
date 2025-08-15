function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function checkSchedule() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  document.querySelectorAll('.period').forEach(period => {
    const start = parseTime(period.dataset.start);
    const end = parseTime(period.dataset.end);
    if (currentTime >= start && currentTime <= end) {
      period.classList.add('active');
      const remaining = end - currentTime;
      period.innerHTML = `${period.textContent.split(' - ')[0]} - ⏳ ${remaining} min left`;
    } else {
      period.classList.remove('active');
    }
  });
}

function renderSchedule() {
  const schedule = JSON.parse(localStorage.getItem('schedule') || '[]');
  const container = document.getElementById('schedule');
  container.innerHTML = schedule.map(p => `
    <div class="period" data-start="${p.start}" data-end="${p.end}">${p.name}</div>
  `).join('');
  checkSchedule();
}

renderSchedule();
setInterval(checkSchedule, 60000);

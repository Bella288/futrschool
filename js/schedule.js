function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Get current weekday abbreviation (Mon, Tue, etc.)
function getCurrentWeekday() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()];
}

function formatTimeRemaining(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
}

function updateDateTime() {
  const now = new Date();
  const options = { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  const dateStr = now.toLocaleDateString('en-US', options);
  const timeStr = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  
  document.getElementById('currentDateTime').textContent = 
    `${dateStr} • ${timeStr}`;
}

function checkSchedule() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const currentWeekday = getCurrentWeekday();
  
  document.querySelectorAll('.period').forEach(period => {
    const start = parseTime(period.dataset.start);
    const end = parseTime(period.dataset.end);
    const weekdays = period.dataset.weekdays ? period.dataset.weekdays.split(',') : [];
    
    // Only highlight if it's the right weekday and time
    if (weekdays.includes(currentWeekday) && currentTime >= start && currentTime <= end) {
      period.classList.add('active');
      const remaining = end - currentTime;
      period.innerHTML = `${period.dataset.name} - ⌛ ${formatTimeRemaining(remaining)} left`;
    } else {
      period.classList.remove('active');
      // Reset text if not active
      if (!period.classList.contains('active')) {
        period.innerHTML = period.dataset.name;
      }
    }
  });
}

function renderSchedule() {
  const schedule = JSON.parse(localStorage.getItem('schedule') || '[]');
  const container = document.getElementById('schedule');
  
  // Filter to only show periods for today
  const currentWeekday = getCurrentWeekday();
  const todaySchedule = schedule.filter(p => 
    p.weekdays && p.weekdays.includes(currentWeekday)
  );
  
  if (todaySchedule.length === 0) {
    container.innerHTML = `<div class="no-classes">No classes scheduled for ${currentWeekday}</div>`;
    return;
  }
  
  container.innerHTML = todaySchedule.map(p => `
    <div class="period" data-name="${p.name}" data-start="${p.start}" data-end="${p.end}" data-weekdays="${p.weekdays ? p.weekdays.join(',') : ''}">
      ${p.name}
    </div>
  `).join('');
  
  checkSchedule();
}

// Initialize the page
updateDateTime();
renderSchedule();

// Set up intervals for updating time and checking schedule
setInterval(updateDateTime, 60000);
setInterval(checkSchedule, 60000);

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
  if (minutes < 1) {
    return "less than 1 min";
  } else if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
}

// Format the current date and time
function formatDateTime() {
  const now = new Date();
  
  // Format weekday
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekday = weekdays[now.getDay()];
  
  // Format date
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[now.getMonth()];
  const date = now.getDate();
  const year = now.getFullYear();
  
  // Format time
  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  
  return `${weekday}, ${month} ${date}, ${year} • ${hours}:${minutes}:${seconds} ${ampm}`;
}

// Update the date and time display
function updateDateTime() {
  const dateTimeElement = document.getElementById('currentDateTime');
  if (dateTimeElement) {
    dateTimeElement.textContent = formatDateTime();
  }
}

function checkSchedule() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();
  const currentWeekday = getCurrentWeekday();
  
  document.querySelectorAll('.period').forEach(period => {
    const start = parseTime(period.dataset.start);
    const end = parseTime(period.dataset.end);
    const weekdays = period.dataset.weekdays ? period.dataset.weekdays.split(',') : [];
    
    // Only highlight if it's the right weekday and time
    if (weekdays.includes(currentWeekday) && currentTime >= start && currentTime <= end) {
      period.classList.add('active');
      const remaining = end - currentTime - (currentSeconds > 0 ? 1 : 0);
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

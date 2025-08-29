function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Get current weekday abbreviation (Mon, Tue, etc.)
function getCurrentWeekday() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()];
}

function formatTimeRemaining(totalSeconds) {
  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  } else if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
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
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12
  minutes = minutes < 10 ? '0' + minutes : minutes;
  
  return `${weekday}, ${month} ${date}, ${year} • ${hours}:${minutes} ${ampm}`;
}

// Update the date and time display
function updateDateTime() {
  const dateTimeElement = document.getElementById('currentDateTime');
  if (dateTimeElement) {
    dateTimeElement.textContent = formatDateTime();
  }
}

// Track active countdown intervals
let countdownIntervals = {};

function clearAllCountdowns() {
  // Clear all existing countdown intervals
  for (const key in countdownIntervals) {
    clearInterval(countdownIntervals[key]);
    delete countdownIntervals[key];
  }
}

function startCountdown(periodElement, endTime, isActivePeriod = true) {
  const periodKey = periodElement.dataset.name;
  
  // Clear any existing countdown for this period
  if (countdownIntervals[periodKey]) {
    clearInterval(countdownIntervals[periodKey]);
  }
  
  // Start new countdown
  countdownIntervals[periodKey] = setInterval(() => {
    const now = new Date();
    const remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
    
    if (remainingSeconds <= 0) {
      clearInterval(countdownIntervals[periodKey]);
      delete countdownIntervals[periodKey];
      checkSchedule(); // Re-check schedule when countdown completes
      return;
    }
    
    if (isActivePeriod) {
      periodElement.innerHTML = `${periodElement.dataset.name} - ⌛ ${formatTimeRemaining(remainingSeconds)} left`;
      
      // Update class for styling when less than 1 minute
      if (remainingSeconds < 60) {
        periodElement.classList.add('soon');
      } else {
        periodElement.classList.remove('soon');
      }
    } else {
      periodElement.innerHTML = `${periodElement.dataset.name} - Starts in ${formatTimeRemaining(remainingSeconds)}`;
      
      // Update class for styling when less than 1 minute
      if (remainingSeconds < 60) {
        periodElement.classList.add('soon');
      } else {
        periodElement.classList.remove('soon');
      }
    }
  }, 1000);
}

function checkSchedule() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const currentWeekday = getCurrentWeekday();
  
  // Clear all countdowns before resetting
  clearAllCountdowns();
  
  // Reset all periods first
  document.querySelectorAll('.period').forEach(period => {
    period.classList.remove('active', 'upcoming', 'soon');
    period.innerHTML = period.dataset.name;
  });
  
  // Get today's schedule
  const schedule = JSON.parse(localStorage.getItem('schedule') || '[]');
  const todaySchedule = schedule.filter(p => 
    p.weekdays && p.weekdays.includes(currentWeekday)
  );
  
  // If no classes today, show notification
  if (todaySchedule.length === 0) {
    showNextSchoolDayNotification();
    return;
  }
  
  let hasActivePeriod = false;
  let hasUpcomingPeriod = false;
  
  // Check each period
  todaySchedule.forEach(periodData => {
    const periodElement = document.querySelector(`.period[data-name="${periodData.name}"][data-start="${periodData.start}"][data-end="${periodData.end}"]`);
    if (!periodElement) return;
    
    const start = parseTime(periodData.start);
    const end = parseTime(periodData.end);
    
    // Current period
    if (currentTime >= start && currentTime <= end) {
      hasActivePeriod = true;
      periodElement.classList.add('active');
      
      // Calculate end time for countdown
      const endTime = new Date();
      endTime.setHours(Math.floor(end / 60), end % 60, 0, 0);
      
      // Start countdown for active period
      startCountdown(periodElement, endTime, true);
    } 
    // Upcoming period (within the next 30 minutes)
    else if (currentTime < start && (start - currentTime) <= 30) {
      hasUpcomingPeriod = true;
      periodElement.classList.add('upcoming');
      
      // Calculate start time for countdown
      const startTime = new Date();
      startTime.setHours(Math.floor(start / 60), start % 60, 0, 0);
      
      // Start countdown for upcoming period
      startCountdown(periodElement, startTime, false);
    }
  });
  
  // If no active or upcoming periods, check if we're after the last period
  if (!hasActivePeriod && !hasUpcomingPeriod) {
    const lastPeriod = todaySchedule[todaySchedule.length - 1];
    const lastPeriodEnd = parseTime(lastPeriod.end);
    
    if (currentTime > lastPeriodEnd) {
      showNextSchoolDayNotification();
    } else {
      // Find the next period of the day
      const nextPeriod = todaySchedule.find(p => parseTime(p.start) > currentTime);
      if (nextPeriod) {
        const nextPeriodElement = document.querySelector(`.period[data-name="${nextPeriod.name}"][data-start="${nextPeriod.start}"][data-end="${nextPeriod.end}"]`);
        if (nextPeriodElement) {
          const untilStart = parseTime(nextPeriod.start) - currentTime;
          nextPeriodElement.classList.add('upcoming');
          
          // Calculate start time for countdown
          const startTime = new Date();
          startTime.setHours(Math.floor(parseTime(nextPeriod.start) / 60), parseTime(nextPeriod.start) % 60, 0, 0);
          
          // Start countdown for next period
          startCountdown(nextPeriodElement, startTime, false);
        }
      }
    }
  }
}

function showNextSchoolDayNotification() {
  const notification = document.getElementById('nextDayNotification');
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const currentWeekday = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  const schedule = JSON.parse(localStorage.getItem('schedule') || '[]');
  
  // Find the next school day with classes
  let daysToAdd = 1;
  let nextSchoolDay = null;
  
  while (daysToAdd <= 7 && !nextSchoolDay) {
    const nextDayIndex = (currentWeekday + daysToAdd) % 7;
    const nextDayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][nextDayIndex];
    
    const nextDaySchedule = schedule.filter(p => 
      p.weekdays && p.weekdays.includes(nextDayAbbr)
    );
    
    if (nextDaySchedule.length > 0) {
      nextSchoolDay = {
        dayIndex: nextDayIndex,
        dayAbbr: nextDayAbbr,
        schedule: nextDaySchedule
      };
    } else {
      daysToAdd++;
    }
  }
  
  if (nextSchoolDay) {
    // Calculate time until next school day starts
    const firstPeriodStart = parseTime(nextSchoolDay.schedule[0].start);
    
    // Time until midnight tonight (in minutes)
    const minutesUntilMidnight = (24 * 60) - currentTime;
    
    // Time from midnight to first period start
    const minutesFromMidnightToFirstPeriod = firstPeriodStart;
    
    // Total minutes until next school day starts
    const totalMinutes = (daysToAdd - 1) * 24 * 60 + minutesUntilMidnight + minutesFromMidnightToFirstPeriod;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    notification.innerHTML = `Next school day (${nextSchoolDay.dayAbbr}) starts in ${hours} hours and ${minutes} minutes`;
    notification.style.display = 'block';
  } else {
    notification.innerHTML = 'No upcoming school days found';
    notification.style.display = 'block';
  }
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
    showNextSchoolDayNotification();
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
setInterval(updateDateTime, 60000); // Update time every minute
setInterval(checkSchedule, 30000); // Check schedule every 30 seconds for better responsiveness

// Clear all intervals when page is unloaded to prevent memory leaks
window.addEventListener('beforeunload', () => {
  clearAllCountdowns();
});

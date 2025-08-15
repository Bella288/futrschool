document.addEventListener('DOMContentLoaded', () => {
  console.log("📦 App initialized");

  if (typeof renderClasses === 'function') renderClasses();
  if (typeof renderAssignments === 'function') renderAssignments();
  if (typeof showGPA === 'function') showGPA();
  if (typeof renderSchedule === 'function') renderSchedule();
});

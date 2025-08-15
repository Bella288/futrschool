function calculateGPA() {
  const allAssignments = JSON.parse(localStorage.getItem('assignments') || '{}');
  let graded = [];

  Object.values(allAssignments).forEach(classAssignments => {
    classAssignments.forEach(a => {
      if (a.grade !== undefined && a.grade !== null && a.points) {
        graded.push(a);
      }
    });
  });

  if (graded.length === 0) return 'N/A';

  let totalPoints = 0;
  let totalEarned = 0;

  graded.forEach(a => {
    const earned = parseFloat(a.grade);
    const possible = parseFloat(a.points);
    if (!isNaN(earned) && !isNaN(possible)) {
      totalEarned += earned;
      totalPoints += possible;
    }
  });

  const percentage = (totalEarned / totalPoints) * 100;
  return convertToGPA(percentage).toFixed(2);
}

function convertToGPA(percent) {
  if (percent >= 90) return 4.0;
  if (percent >= 80) return 3.0;
  if (percent >= 70) return 2.0;
  if (percent >= 60) return 1.0;
  return 0.0;
}

function showGPA() {
  const gpa = calculateGPA();
  const display = document.getElementById('gpa-display');
  if (display) display.textContent = `🎓 GPA: ${gpa}`;
}

document.addEventListener('DOMContentLoaded', showGPA);

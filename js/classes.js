// classes.js - Enhanced with accessibility features

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeClassesPage();
});

function initializeClassesPage() {
    const form = document.getElementById('add-class-form');
    const list = document.getElementById('class-list');
    
    if (!form || !list) {
        console.error("Required elements not found");
        return;
    }
    
    // Create a live region if it doesn't exist
    const liveRegion = document.querySelector('[aria-live]') || createLiveRegion();
    
    function createLiveRegion() {
        const region = document.createElement('div');
        region.setAttribute('aria-live', 'polite');
        region.setAttribute('aria-atomic', 'true');
        region.className = 'visually-hidden';
        document.body.appendChild(region);
        return region;
    }
    
    // Add styles for the enhanced class list
    addStyles();
    
    // Announce changes to screen readers
    function announce(message) {
        if (liveRegion) {
            liveRegion.textContent = message;
            // Clear after a delay to allow repeated announcements
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }
    
    // Validate form inputs
    function validateForm() {
        const className = document.getElementById('class-name').value.trim();
        
        if (!className) {
            announce('Class name is required');
            document.getElementById('class-name').focus();
            return false;
        }
        
        return true;
    }
    
    // Handle form submission
    form.addEventListener('submit', e => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        const classData = {
            name: form['class-name'].value.trim(),
            room: form['room-number'].value.trim(),
            teacher: form['teacher-name'].value.trim(),
            period: form['period'].value.trim(),
            id: Date.now() // Unique ID for each class
        };
        
        saveClass(classData);
        renderClasses();
        announce(`Class ${classData.name} added successfully`);
        form.reset();
        document.getElementById('class-name').focus();
    });
    
    // Save class to localStorage
    function saveClass(data) {
        const classes = JSON.parse(localStorage.getItem('classes') || '[]');
        classes.push(data);
        localStorage.setItem('classes', JSON.stringify(classes));
    }
    
    // Render classes list
    function renderClasses() {
        const classes = JSON.parse(localStorage.getItem('classes') || '[]');
        
        if (classes.length === 0) {
            list.innerHTML = '<p>No classes added yet. Add your first class above.</p>';
            return;
        }
        
        list.innerHTML = classes.map((c, index) => `
            <div class="class-item" role="listitem">
                <a href="dashboard.html?class=${encodeURIComponent(c.name)}" 
                   class="class-link" 
                   aria-label="View ${c.name} with ${c.teacher} during period ${c.period}">
                    <span class="class-name">${c.name}</span>
                    <span class="class-details">${c.teacher} - Period ${c.period}</span>
                    <span class="class-room">Room: ${c.room || 'Not specified'}</span>
                </a>
                <button class="delete-class" 
                        aria-label="Delete ${c.name}" 
                        data-id="${c.id}"
                        title="Delete this class">
                    🗑️
                </button>
            </div>
        `).join('');
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-class').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                deleteClass(id);
            });
        });
        
        // Make class items keyboard accessible
        document.querySelectorAll('.class-link').forEach(link => {
            link.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    }
    
    // Delete a class
    function deleteClass(id) {
        if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
            return;
        }
        
        const classes = JSON.parse(localStorage.getItem('classes') || '[]');
        const updatedClasses = classes.filter(c => c.id != id);
        localStorage.setItem('classes', JSON.stringify(updatedClasses));
        
        announce('Class deleted');
        renderClasses();
        
        // Set focus to a logical place after deletion
        if (updatedClasses.length === 0) {
            document.getElementById('class-name').focus();
        } else {
            document.querySelector('.class-link').focus();
        }
    }
    
    // Add keyboard navigation to class items
    document.addEventListener('keydown', function(e) {
        const classItems = document.querySelectorAll('.class-item');
        if (classItems.length === 0) return;
        
        const currentFocus = document.activeElement;
        let currentIndex = -1;
        
        // Find current focused item
        classItems.forEach((item, index) => {
            if (item.contains(currentFocus)) {
                currentIndex = index;
            }
        });
        
        // Navigate with arrow keys
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % classItems.length;
            classItems[nextIndex].querySelector('.class-link').focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = (currentIndex - 1 + classItems.length) % classItems.length;
            classItems[prevIndex].querySelector('.class-link').focus();
        }
    });
    
    // Initialize the page
    renderClasses();
}

function addStyles() {
    // Check if styles already added
    if (document.getElementById('classes-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'classes-styles';
    style.textContent = `
        .visually-hidden {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
        
        .class-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            margin: 10px 0;
            border: 1px solid #ddd;
            border-radius: 6px;
            background-color: #f9f9f9;
        }
        
        .class-link {
            flex: 1;
            text-decoration: none;
            color: #333;
            display: block;
            padding: 8px;
            border-radius: 4px;
        }
        
        .class-link:hover, 
        .class-link:focus {
            background-color: #eee;
            outline: 2px solid #0066cc;
        }
        
        .class-name {
            display: block;
            font-weight: bold;
            font-size: 1.1em;
        }
        
        .class-details, 
        .class-room {
            display: block;
            font-size: 0.9em;
            color: #666;
            margin-top: 4px;
        }
        
        .delete-class {
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 4px;
            font-size: 1.2em;
        }
        
        .delete-class:hover,
        .delete-class:focus {
            background-color: #ffebee;
            outline: 2px solid #d32f2f;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        @media (prefers-contrast: high) {
            .class-item {
                border: 2px solid #000;
            }
            
            .class-link:focus {
                outline: 3px solid #000;
                background-color: #ffff00;
                color: #000;
            }
        }
        
        /* Dyslexia mode styles */
        .dyslexia-mode .class-item {
            font-family: "OpenDyslexic", OpenDyslexic, sans-serif;
            letter-spacing: 0.05em;
            line-height: 1.6;
        }
    `;
    document.head.appendChild(style);
}

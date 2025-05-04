// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.querySelector('.theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');
    const themeText = document.querySelector('.theme-text');
    const body = document.body;
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');
    const searchInput = document.querySelector('.search-input');
    const roadmapCards = document.querySelectorAll('.roadmap-card');

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.className = savedTheme;
        updateThemeIcon(savedTheme);
    }

    // Theme switching
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-theme');
            body.classList.toggle('light-theme');
            const currentTheme = body.className;
            localStorage.setItem('theme', currentTheme);
            updateThemeIcon(currentTheme);
        });
    }

    function updateThemeIcon(theme) {
        if (themeIcon) {
            if (theme === 'dark-theme') {
                themeIcon.textContent = '🌙';
                if (themeText) themeText.textContent = 'Dark Mode';
            } else {
                themeIcon.textContent = '☀️';
                if (themeText) themeText.textContent = 'Light Mode';
            }
        }
    }

    // Sidebar toggle
    if (sidebarToggle && sidebar && overlay) {
        sidebarToggle.addEventListener('click', () => {
            toggleSidebar();
        });

        // Close sidebar when clicking overlay
        overlay.addEventListener('click', () => {
            closeSidebar();
        });

        // Swipe gesture handling
        let touchStartX = 0;
        let touchEndX = 0;
        const swipeThreshold = 50; // Minimum distance for a swipe

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });

        function handleSwipe() {
            const swipeDistance = touchEndX - touchStartX;
            // Only handle horizontal swipes
            if (Math.abs(swipeDistance) > swipeThreshold) {
                if (swipeDistance > 0) {
                    // Swipe right - open sidebar
                    openSidebar();
                } else {
                    // Swipe left - close sidebar
                    closeSidebar();
                }
            }
        }

        function toggleSidebar() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        }

        function openSidebar() {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        }

        function closeSidebar() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    }

    // Search functionality
    if (searchInput && roadmapCards.length > 0) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            roadmapCards.forEach(card => {
                const title = card.querySelector('.roadmap-title').textContent.toLowerCase();
                const description = card.querySelector('.roadmap-description').textContent.toLowerCase();
                if (title.includes(searchTerm) || description.includes(searchTerm)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // Add animation to cards when they appear
    if (roadmapCards.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1
        });
        roadmapCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            observer.observe(card);
        });
    }

    // Show fullscreen box on day button click with that day's content
    const dayButtons = document.querySelectorAll('.day-btn');
    const fullscreenBox = document.getElementById('unique-fullscreen-box');
    const fullscreenBoxContent = fullscreenBox ? fullscreenBox.querySelector('.fullscreen-box-content') : null;

    if (dayButtons.length > 0 && fullscreenBox && fullscreenBoxContent) {
        dayButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                let dayTitle = btn.textContent.split(':')[0];
                let dayContent = btn.textContent.split(':').slice(1).join(':').trim();
                // Custom content for Day 1
                if (dayTitle.trim() === 'Day 1') {
                    dayTitle = 'Day 1: Record a 1-minute self-introduction';
                    dayContent = `<strong>Goal:</strong> Build self-awareness and baseline confidence.<br><br>
                    <strong>Instructions:</strong><ul style='text-align:left; margin: 1em 0 0 1em;'>
                        <li>Find a quiet place and use your phone or computer to record a 1-minute self-introduction. Say your name, what you do, and something interesting about yourself.</li>
                        <li>Play back the recording and listen for clarity, pace, and tone. Don't worry about perfection—just observe how you sound.</li>
                        <li>Jot down 2-3 things you like and 2-3 things you'd like to improve.</li>
                    </ul>
                    <strong>Tip:</strong> Smile while you speak—it helps your voice sound warmer and more confident!`;
                }
                fullscreenBoxContent.innerHTML = `
                    <button class="fullscreen-box-close" aria-label="Close">&times;</button>
                    <h2>${dayTitle}</h2>
                    <p>${dayContent}</p>
                `;
                fullscreenBox.style.display = 'flex';
                // Re-attach close event
                fullscreenBoxContent.querySelector('.fullscreen-box-close').onclick = () => {
                    fullscreenBox.style.display = 'none';
                };
            });
        });
    }

    // Close modal if close button exists (for initial content)
    const fullscreenBoxClose = document.querySelector('.fullscreen-box-close');
    if (fullscreenBoxClose && fullscreenBox) {
        fullscreenBoxClose.addEventListener('click', () => {
            fullscreenBox.style.display = 'none';
        });
    }
});

// Function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

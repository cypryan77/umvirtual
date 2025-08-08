let currentTimerValue = 3000; // default 3 seconds

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const intervalInput = document.getElementById('intervalInput');
    const startButton = document.getElementById('startButton');
    const slideshowContainer = document.getElementById('slideshowContainer');
    const slideshowImage = document.getElementById('slideshowImage');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const pauseButton = document.getElementById('pauseButton');

    // Load saved interval if available
    const savedInterval = localStorage.getItem('slideshowIntervalSeconds');
    if (savedInterval) {
        intervalInput.value = savedInterval;
        currentTimerValue = parseFloat(savedInterval) * 1000;
    }

    let imageData = []; // [{file: File}]
    let cyclePool = []; // Images not yet shown this cycle
    let history = [];   // Displayed image objects
    let slideshowIntervalId = null;
    let currentImageURL = null;
    let isPaused = false;
    const shownThisCycle = new Set();
    const displayCounts = new Map(); // Map<File, count>

    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
        imageData = files.map(file => ({ file }));
        cyclePool = [];
        history = [];
        shownThisCycle.clear();
        displayCounts.clear();
    });

    startButton.addEventListener('click', () => {
        if (imageData.length === 0) {
            alert('Please select some images.');
            return;
        }

        const seconds = parseFloat(intervalInput.value);
        if (isNaN(seconds) || seconds <= 0) {
            alert('Enter a valid interval in seconds.');
            return;
        }

        currentTimerValue = seconds * 1000;
        localStorage.setItem('slideshowIntervalSeconds', seconds.toString());

        requestFullscreen(slideshowContainer).then(() => {
            slideshowContainer.style.display = 'flex';
            startSlideshow();
        });
    });

    function requestFullscreen(elem) {
        if (elem.requestFullscreen) return elem.requestFullscreen();
        if (elem.webkitRequestFullscreen) return elem.webkitRequestFullscreen();
        if (elem.msRequestFullscreen) return elem.msRequestFullscreen();
        return Promise.resolve();
    }

    function exitFullscreen() {
        if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
            if (document.exitFullscreen) return document.exitFullscreen();
            if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
            if (document.msExitFullscreen) return document.msExitFullscreen();
        }
        return Promise.resolve();
    }

    function startSlideshow() {
        isPaused = false;
        pauseButton.textContent = 'Pause';
        displayNext();
        restartInterval();
    }

    function restartInterval() {
        if (slideshowIntervalId) clearInterval(slideshowIntervalId);
        if (!isPaused && imageData.length > 1) {
            slideshowIntervalId = setInterval(displayNext, currentTimerValue);
        }
    }

    function stopSlideshow() {
        if (slideshowIntervalId) {
            clearInterval(slideshowIntervalId);
            slideshowIntervalId = null;
        }
        if (currentImageURL) {
            URL.revokeObjectURL(currentImageURL);
            currentImageURL = null;
        }
        slideshowImage.src = '#';
        slideshowContainer.style.display = 'none';
        isPaused = false;
        history = [];
        cyclePool = [];
        shownThisCycle.clear();
        exitFullscreen();
    }

    function weightedPick() {
        if (cyclePool.length === 0) {
            cyclePool = [...imageData];
            shownThisCycle.clear();
        }

        const weights = cyclePool.map(obj => 1 / ((displayCounts.get(obj.file) || 0) + 1));
        const total = weights.reduce((sum, w) => sum + w, 0);
        let r = Math.random() * total;
        for (let i = 0; i < cyclePool.length; i++) {
            r -= weights[i];
            if (r <= 0) {
                return cyclePool.splice(i, 1)[0];
            }
        }
        return cyclePool.pop(); // fallback
    }

    function showImage(obj, record = true) {
        if (currentImageURL) {
            URL.revokeObjectURL(currentImageURL);
        }
        currentImageURL = URL.createObjectURL(obj.file);
        slideshowImage.src = currentImageURL;
        slideshowImage.onerror = () => {
            console.warn('Failed to load image: ' + obj.file.name);
            displayNext();
        };

        if (record) {
            history.push(obj);
            shownThisCycle.add(obj.file);
            displayCounts.set(obj.file, (displayCounts.get(obj.file) || 0) + 1);
        }
    }

    function displayNext() {
        const obj = weightedPick();
        showImage(obj, true);
    }

    function displayPrevious() {
        if (history.length >= 2) {
            const current = history.pop();
            cyclePool.unshift(current);
            shownThisCycle.delete(current.file);
            const previous = history[history.length - 1];
            showImage(previous, false);
        }
    }

    function togglePause() {
        isPaused = !isPaused;
        pauseButton.textContent = isPaused ? 'Play' : 'Pause';
        restartInterval();
    }

    nextButton.addEventListener('click', () => {
        displayNext();
        restartInterval();
    });

    prevButton.addEventListener('click', () => {
        displayPrevious();
        restartInterval();
    });

    pauseButton.addEventListener('click', togglePause);

    document.addEventListener('keydown', (event) => {
        const isActive = slideshowContainer.style.display === 'flex';
        if (!isActive) return;

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            nextButton.click();
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            prevButton.click();
        } else if (event.key === ' ') {
            event.preventDefault();
            pauseButton.click();
        } else if (event.key === 'Escape') {
            stopSlideshow();
        }
    });

    document.addEventListener('fullscreenchange', () => {
        const isFs = document.fullscreenElement === slideshowContainer ||
                     document.webkitFullscreenElement === slideshowContainer ||
                     document.msFullscreenElement === slideshowContainer;
        if (!isFs) {
            stopSlideshow();
        }
    });
});


let currentTimerValue = 3000; // Default interval in milliseconds

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const intervalInput = document.getElementById('intervalInput');
    const startButton = document.getElementById('startButton');
    const slideshowContainer = document.getElementById('slideshowContainer');
    const slideshowImage = document.getElementById('slideshowImage');

    // Load saved interval from localStorage
    const savedIntervalSeconds = localStorage.getItem('slideshowIntervalSeconds');
    if (savedIntervalSeconds) {
        const parsedInterval = parseInt(savedIntervalSeconds, 10);
        // Ensure the parsed value is a valid number and meets minimum criteria (e.g., >= 0.5 seconds)
        // Using intervalInput.min directly might be more robust if min value changes.
        const minInterval = parseFloat(intervalInput.min) || 0.5; // Fallback if input.min is not set or invalid
        if (!isNaN(parsedInterval) && parsedInterval >= minInterval) {
            intervalInput.value = parsedInterval.toString();
            console.log(`Loaded interval time from localStorage: ${parsedInterval}s`);
        } else {
            console.log('Saved interval from localStorage is invalid, using default.');
        }
    } else {
        console.log('No saved interval found in localStorage, using default.');
    }

    let imageFiles = [];
    let remainingImages = [];
    let shownImages = [];
    let slideshowIntervalId = null;
    let currentImageObjectURL = null;

    fileInput.addEventListener('change', (event) => {
        imageFiles = Array.from(event.target.files).filter(file => file.type.startsWith('image/'));
        remainingImages = [];
        shownImages = [];
        if (imageFiles.length > 0) {
            console.log(`Selected ${imageFiles.length} image(s).`);
            // Optionally, display a count or list of selected files
        } else {
            console.log("No image files selected.");
        }
        // Reset UI if needed when files change
        if (document.fullscreenElement || document.webkitFullscreenElement) {
             if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE11 */
                document.msExitFullscreen();
            }
        }
        slideshowContainer.style.display = 'none';
        if (slideshowIntervalId) {
            clearInterval(slideshowIntervalId);
            slideshowIntervalId = null;
        }
    });

    startButton.addEventListener('click', () => {
        if (imageFiles.length === 0) {
            alert('Please select some images first.');
            return;
        }

        const timerValue = parseInt(intervalInput.value, 10) * 1000;
        if (isNaN(timerValue) || timerValue < 500) { // Minimum 0.5 seconds
            alert('Please set a valid interval of at least 0.5 seconds.');
            return;
        }
        currentTimerValue = timerValue; // Update global timer value
        localStorage.setItem('slideshowIntervalSeconds', (timerValue / 1000).toString());

        // Initialize image lists for the slideshow session
        remainingImages = [...imageFiles];
        shownImages = [];

        // Request fullscreen
        if (slideshowContainer.requestFullscreen) {
            slideshowContainer.requestFullscreen();
        } else if (slideshowContainer.webkitRequestFullscreen) { /* Safari */
            slideshowContainer.webkitRequestFullscreen();
        } else if (slideshowContainer.msRequestFullscreen) { /* IE11 */
            slideshowContainer.msRequestFullscreen();
        }
        // The 'fullscreenchange' event listener will handle starting the slideshow
    });

    function displayNextImage() {
        if (currentImageObjectURL) {
            URL.revokeObjectURL(currentImageObjectURL); // Clean up previous object URL
        }

        if (remainingImages.length === 0) {
            if (shownImages.length === 0) {
                console.error("No images available to display.");
                stopSlideshow(true); // Pass true to force exit fullscreen
                alert("No images loaded or all images were invalid.");
                return;
            }
            console.log("All images shown once. Reshuffling...");
            remainingImages = [...shownImages]; // Or use [...imageFiles] to restart from the original full set.
                                               // Using shownImages ensures any files that failed to load aren't retried until next cycle.
            shownImages = [];
        }

        const randomIndex = Math.floor(Math.random() * remainingImages.length);
        const nextImageFile = remainingImages.splice(randomIndex, 1)[0];
        
        currentImageObjectURL = URL.createObjectURL(nextImageFile);
        slideshowImage.src = currentImageObjectURL;
        slideshowImage.onerror = () => {
            console.warn(`Failed to load image: ${nextImageFile.name}. Skipping.`);
            URL.revokeObjectURL(currentImageObjectURL); // Revoke broken URL
            // Remove this image from shownImages so it doesn't get added back to remainingImages
            // if it was the last one in remainingImages.
            // Or, add it to a separate "failed" list if we want to track.
            // For now, just try to display the next one.
            displayNextImage(); 
        };
        
        shownImages.push(nextImageFile); // Add to shownImages only if successfully loaded (or about to be attempted)
        slideshowContainer.style.display = 'flex'; // Show the container
        console.log(`Displaying image: ${nextImageFile.name}`);
    }

    function startSlideshowLogic() {
        // const timerValue = parseInt(intervalInput.value, 10) * 1000; // No longer needed here, use global currentTimerValue
        
        // Clear any existing interval
        if (slideshowIntervalId) {
            clearInterval(slideshowIntervalId);
        }

        // Display the first image immediately
        displayNextImage(); 

        // Start interval for subsequent images, if there's more than one image
        // Use currentTimerValue and ensure it's at least 500ms
        if (imageFiles.length > 1 || (remainingImages.length > 0 || shownImages.length > 1) ) {
             slideshowIntervalId = setInterval(displayNextImage, Math.max(currentTimerValue, 500));
        } else if (imageFiles.length === 1 && remainingImages.length === 0 && shownImages.length === 1) {
            // Only one image, no need for an interval. It's already displayed.
            console.log("Only one image. Slideshow will not loop.");
        }
    }

    function stopSlideshow(forceExitFullscreen = false) {
        console.log("Stopping slideshow...");
        if (slideshowIntervalId) {
            clearInterval(slideshowIntervalId);
            slideshowIntervalId = null;
        }
        if (currentImageObjectURL) {
            URL.revokeObjectURL(currentImageObjectURL);
            currentImageObjectURL = null;
        }
        slideshowContainer.style.display = 'none';
        slideshowImage.src = '#'; // Clear image

        // Exit fullscreen if document is in fullscreen mode and the slideshow container was the element
        if (forceExitFullscreen && (document.fullscreenElement === slideshowContainer || document.webkitFullscreenElement === slideshowContainer || document.msFullscreenElement === slideshowContainer)) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE11 */
                document.msExitFullscreen();
            }
        }
    }

    function handleFullscreenChange() {
        const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
        const isSlideshowElementFullscreen = document.fullscreenElement === slideshowContainer || 
                                           document.webkitFullscreenElement === slideshowContainer || 
                                           document.msFullscreenElement === slideshowContainer;

        if (isFullscreen && isSlideshowElementFullscreen) {
            console.log("Entered fullscreen for slideshow. Starting slideshow logic.");
            slideshowContainer.style.display = 'flex'; // Ensure container is visible
            startSlideshowLogic();
        } else {
            console.log("Exited fullscreen or fullscreen element is not slideshow.");
            stopSlideshow();
        }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // For Safari
    document.addEventListener('msfullscreenchange', handleFullscreenChange); // For IE11/Edge

    // Enhanced keydown listener for navigation and Escape
    document.addEventListener('keydown', (event) => {
        // Check if slideshow is active (i.e., container is visible and in fullscreen)
        const isSlideshowActive = slideshowContainer.style.display === 'flex' &&
                                 (document.fullscreenElement === slideshowContainer ||
                                  document.webkitFullscreenElement === slideshowContainer ||
                                  document.msFullscreenElement === slideshowContainer);

        if (event.key === 'Escape' && isSlideshowActive) {
            // fullscreenchange event will handle stopping the slideshow
            console.log("Escape key pressed during active slideshow, expecting fullscreenchange event.");
            // No explicit stop needed here, handled by fullscreenchange
            return; // Prevent further processing in this listener for Escape
        }

        if (!isSlideshowActive) {
            return; // Ignore arrow keys if slideshow is not active
        }

        if (event.key === 'ArrowRight') {
            console.log("ArrowRight pressed");
            if (slideshowIntervalId) {
                clearInterval(slideshowIntervalId);
            }
            displayNextImage(); // Show next image immediately
            // Restart interval only if there are more images to cycle through
            if (imageFiles.length > 1 || remainingImages.length > 0 || shownImages.length > 1) {
                 slideshowIntervalId = setInterval(displayNextImage, Math.max(currentTimerValue, 500));
            }
        } else if (event.key === 'ArrowLeft') {
            console.log("ArrowLeft pressed");
            if (slideshowIntervalId) {
                clearInterval(slideshowIntervalId);
            }
            if (shownImages.length >= 2) { // Need at least two images in shownImages to go to a "previous" one
                if (currentImageObjectURL) {
                    URL.revokeObjectURL(currentImageObjectURL);
                }

                // The current image is the last one in shownImages. Pop it.
                const currentImageFile = shownImages.pop();
                // Add it to the beginning of remainingImages (or end, depending on desired behavior)
                remainingImages.unshift(currentImageFile);

                // The "new" current image is now the last one in shownImages
                const previousImageFile = shownImages[shownImages.length - 1];
                
                currentImageObjectURL = URL.createObjectURL(previousImageFile);
                slideshowImage.src = currentImageObjectURL;
                slideshowImage.onerror = () => {
                    console.warn(`Failed to load previous image: ${previousImageFile.name}. Skipping.`);
                    URL.revokeObjectURL(currentImageObjectURL);
                    slideshowImage.src = '#'; // Clear broken image
                    // Attempt to recover by trying to display the next available image
                    // This could involve removing the failed 'previousImageFile' from 'shownImages'
                    // and then calling displayNextImage.
                    // For simplicity, we'll just log and the user might need to navigate again or slideshow continues.
                    // A more robust recovery could be:
                    // shownImages.pop(); // Remove the failed previousImageFile from history as well
                    // displayNextImage(); // Try to load the next one
                    alert(`Error loading image: ${previousImageFile.name}. The slideshow might skip it next time.`);
                };
                console.log(`Navigated to previous image: ${previousImageFile.name}`);
            } else {
                console.log("Not enough images shown to go to a previous one. Displaying current or next if applicable.");
                // Optionally, re-display current or trigger next if at the very beginning
                // For now, do nothing if no "previous" is available. The interval will continue or can be manually advanced.
            }
            // Restart interval only if there are more images to cycle through
            if (imageFiles.length > 1 || remainingImages.length > 0 || shownImages.length > 1) {
                slideshowIntervalId = setInterval(displayNextImage, Math.max(currentTimerValue, 500));
            }
        }
    });

    console.log("Slideshow script loaded. Select images and start.");
});

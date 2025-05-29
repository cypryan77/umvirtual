document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const intervalInput = document.getElementById('intervalInput');
    const startButton = document.getElementById('startButton');
    const slideshowContainer = document.getElementById('slideshowContainer');
    const slideshowImage = document.getElementById('slideshowImage');

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
        const timerValue = parseInt(intervalInput.value, 10) * 1000;
        
        // Clear any existing interval
        if (slideshowIntervalId) {
            clearInterval(slideshowIntervalId);
        }

        // Display the first image immediately
        displayNextImage(); 

        // Start interval for subsequent images, if there's more than one image
        if (imageFiles.length > 1 || remainingImages.length > 0 ) { // Check if more images are available
             slideshowIntervalId = setInterval(displayNextImage, Math.max(timerValue, 500)); // Ensure minimum interval
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

    // Optional: Handle Escape key specifically if needed, though fullscreenchange should cover it.
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement)) {
            // The fullscreenchange event should handle stopping the slideshow.
            // No explicit stopSlideshow() call here to avoid potential conflicts.
            console.log("Escape key pressed, expecting fullscreenchange event to handle slideshow stop.");
        }
    });

    console.log("Slideshow script loaded. Select images and start.");
});

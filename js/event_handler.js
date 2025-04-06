/**
 * event_handler.js - Handles user interactions using ProphecyApp namespace.
 * Corrected to use ProphecyApp.dataFetcher.
 * for Prophecy Viewer MVP V3 (Dynamic Fetch)
 */

// Initialize the namespace object if it doesn't exist
var ProphecyApp = ProphecyApp || {};

ProphecyApp.eventHandler = (function() {
    // --- DOM Element References (Needed for attaching listeners) ---
    // Get references here, assuming they exist when attachListeners is called
    const categoryNavContainerEH = document.getElementById('category-nav-container');
    const prophecyListElementEH = document.getElementById('prophecy-list');

    /**
     * Attaches event listeners to the category list container using event delegation.
     */
    function attachCategoryListeners() {
        if (!categoryNavContainerEH) {
            console.error("EVENT_HANDLER: Category nav container not found, cannot attach listeners.");
            return;
        }
        // Remove existing listeners first to prevent duplicates if called multiple times
        categoryNavContainerEH.removeEventListener('click', handleCategorySelection);
        categoryNavContainerEH.removeEventListener('keydown', handleCategorySelection);
        // Attach new listeners
        categoryNavContainerEH.addEventListener('click', handleCategorySelection);
        categoryNavContainerEH.addEventListener('keydown', handleCategorySelection); // For keyboard accessibility
        console.log("Event Handlers: Category listeners attached.");
    }

    /**
     * Attaches event listeners to the prophecy reference list container using event delegation.
     */
    function attachReferenceListeners() {
        if (!prophecyListElementEH) {
             console.error("EVENT_HANDLER: Prophecy list element not found, cannot attach listeners.");
            return;
        }
         // Remove existing listeners first
        prophecyListElementEH.removeEventListener('click', handleReferenceSelection);
        prophecyListElementEH.removeEventListener('keydown', handleReferenceSelection);
         // Attach new listeners
        prophecyListElementEH.addEventListener('click', handleReferenceSelection);
        prophecyListElementEH.addEventListener('keydown', handleReferenceSelection); // For keyboard accessibility
        console.log("Event Handlers: Reference listeners attached.");
    }


    /**
     * Handles clicks or keydowns on items in the category navigation UI.
     * Delegates the actual logic to the main app controller.
     */
    function handleCategorySelection(event) {
        // Ensure the actual item (LI) was clicked or keypressed, not container padding
        const targetLi = event.target.closest('li'); // Adjust if using elements other than LI
        if (!targetLi || !categoryNavContainerEH.contains(targetLi)) return;


        // *** CORRECTED NAMESPACE HERE ***
        // Check if BSB data is ready via dataFetcher module
        const selectedCategoryName = targetLi.dataset.categoryName;
        if (!ProphecyApp.dataFetcher.isBsbDataReady() && selectedCategoryName !== "All Categories") {
            console.warn("EVENT_HANDLER: BSB data not ready, ignoring category selection.");
            // Trigger UI feedback via uiManager
            ProphecyApp.uiManager.updateStatusUI(false, "Please wait for BSB data to finish loading.", "");
            // Use setTimeout to clear the message after a delay
            setTimeout(() => {
                 const errorElement = document.getElementById('error-message'); // Get element again
                 // Check if the message is still the BSB loading warning before clearing
                 if (errorElement && errorElement.textContent.startsWith("Please wait")) {
                     ProphecyApp.uiManager.updateStatusUI(false, null, ""); // Clear error if it's still the same warning
                 }
            }, 3000);
            return;
        }

        // Process selection via keyboard or click
        if (event.type === 'click' || event.key === 'Enter' || event.key === ' ') {
             if (event.key === ' ') event.preventDefault(); // Prevent spacebar scroll

             if (selectedCategoryName !== undefined) {
                console.log(`EVENT_HANDLER: Category selected: ${selectedCategoryName}. Calling app controller.`);
                // Call the main app function using the namespace
                ProphecyApp.app.filterAndRenderAppReferences(selectedCategoryName);
             }
        }
    }

    /**
     * Handles clicks or keydowns on items in the prophecy reference list.
     * Delegates the actual logic to the main app controller.
     */
    function handleReferenceSelection(event) {
         // *** CORRECTED NAMESPACE HERE ***
         // Ensure BSB data is loaded before processing selection
         if (!ProphecyApp.dataFetcher.isBsbDataReady()) {
            console.warn("EVENT_HANDLER: BSB data not ready, ignoring reference selection.");
            return;
        }

        // Ensure the event target is within the container and is a list item
        const targetLi = event.target.closest('li'); // Adjust selector if needed
        if (!targetLi || !prophecyListElementEH.contains(targetLi)) return;


        if (event.type === 'click' || event.key === 'Enter' || event.key === ' ') {
             if (event.key === ' ') event.preventDefault();

             const selectedIndex = parseInt(targetLi.dataset.index);
             // Check index validity (using ProphecyApp.app state getter)
             // Use ProphecyApp namespace to access app getter
             if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < ProphecyApp.app.getFilteredReferencesCount()) {
                  console.log(`EVENT_HANDLER: Reference selected: Index ${selectedIndex}. Calling app controller.`);
                  // Call the main app function using the namespace
                  ProphecyApp.app.displayAppDetailedPair(selectedIndex);
             } else {
                  console.warn("EVENT_HANDLER: Invalid index clicked or filteredReferences not ready.");
             }
        }
    }

    // Expose a single function to attach all necessary listeners
    // This will be called by app.js after the relevant UI elements are populated
    return {
        attachListeners: function() {
            attachCategoryListeners();
            attachReferenceListeners();
        }
    };
})();
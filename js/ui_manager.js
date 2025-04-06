/**
 * ui_manager.js - Handles updating the User Interface using ProphecyApp namespace.
 * Includes function to display translation name.
 * for Prophecy Viewer MVP V3 (Dynamic Fetch)
 */

// Initialize the namespace object if it doesn't exist
var ProphecyApp = ProphecyApp || {};

ProphecyApp.uiManager = (function() {
    // --- DOM Element References (Assuming they exist in HTML) ---
    const categoryNavContainerUI = document.getElementById('category-nav-container');
    const categoryListElementUI = document.getElementById('category-list'); // Assuming UL for categories
    const prophecyListElementUI = document.getElementById('prophecy-list');
    const otRefElementUI = document.getElementById('ot-ref');
    const otTextElementUI = document.getElementById('ot-prophecy-text');
    const ntRefElementUI = document.getElementById('nt-ref');
    const ntTextElementUI = document.getElementById('nt-fulfillment-text');
    const categoryElementUI = document.getElementById('prophecy-category');
    const descriptionElementUI = document.getElementById('prophecy-description');
    const loadingIndicatorUI = document.getElementById('loading-indicator');
    const errorMessageElementUI = document.getElementById('error-message');
    const prophecyContentElementUI = document.getElementById('prophecy-content');
    const translationNameElementUI = document.getElementById('translation-name'); // Added for translation

    // --- Public Functions ---
    /**
     * Updates the visibility and content of status UI elements.
     * @param {boolean} isLoading - Is data loading/parsing?
     * @param {string|null} error - An error message string, or null if no error.
     * @param {string} loadingText - Text for loading indicator.
     */
    function updateStatusUI(isLoading, error = null, loadingText = "Loading...") {
        console.log(`UI_MGR: Updating Status UI: isLoading=${isLoading}, error=${error}`);
        if (!loadingIndicatorUI || !errorMessageElementUI || !prophecyContentElementUI) {
            console.error("UI_MGR: Status UI elements not found! Cannot update status."); return;
        }

        loadingIndicatorUI.textContent = loadingText;
        loadingIndicatorUI.style.display = isLoading ? 'block' : 'none';

        errorMessageElementUI.textContent = error || '';
        errorMessageElementUI.style.display = error ? 'block' : 'none';

        prophecyContentElementUI.style.display = (isLoading || error) ? 'none' : 'block';

        const opacity = isLoading ? '0.5' : '1';
        if (categoryNavContainerUI) categoryNavContainerUI.style.opacity = opacity;
        if (prophecyListElementUI) prophecyListElementUI.style.opacity = opacity;

        if (error && prophecyListElementUI) { prophecyListElementUI.innerHTML = '<li>Error state.</li>'; }
        // Also update translation name element on error/loading
        if (translationNameElementUI) {
             // Display placeholder during loading or error states
             translationNameElementUI.textContent = isLoading ? "[Loading...]" : (error ? "[N/A]" : translationNameElementUI.textContent);
        }
    }

    /**
     * Populates the category navigation UI (assumes UL inside container).
     * @param {Array} categoriesData - Array of category objects from manifest.
     */
    function processCategoriesUI(categoriesData) { // Removed categoryClickHandler - listeners attached elsewhere
         if (!categoryNavContainerUI) { console.error("UI_MGR: Category nav container not found."); return; }
        // Find or create the UL element for categories
        let catList = document.getElementById('category-list');
        if (!catList) {
            catList = document.createElement('ul'); catList.id = 'category-list';
            categoryNavContainerUI.innerHTML = ''; // Clear placeholder
            categoryNavContainerUI.appendChild(catList);
        } else { catList.innerHTML = ''; } // Clear existing items if any

        if (!categoriesData || categoriesData.length === 0) { catList.innerHTML = '<li>No categories loaded.</li>'; return; }

        // Create list items for each category
        categoriesData.forEach(category => {
            const listItem = document.createElement('li');
            listItem.textContent = category.name;
            listItem.dataset.categoryName = category.name; // Needed by event handler
            listItem.setAttribute('role', 'button'); listItem.setAttribute('tabindex', '0');
            // Event listeners attached by event_handler.js
            catList.appendChild(listItem);
        });
        console.log("UI_MGR: Category UI elements created.");
    }

    /**
     * Renders the list of prophecy references.
     * @param {Array} refPairs - Array of {ot_ref, nt_ref, description} objects.
     * @param {string} currentFilter - The name of the currently selected category.
     */
    function renderReferenceListUI(refPairs, currentFilter) { // Removed referenceClickHandler
        if (!prophecyListElementUI) {
             console.error("UI_MGR: Prophecy list element not found.");
             return;
        }
        prophecyListElementUI.innerHTML = ''; // Clear previous list

        if (!refPairs || refPairs.length === 0) {
            let prompt = currentFilter === "All Categories" ?
                         'Select a specific category.' :
                         `No references found for ${currentFilter}.`;
            prophecyListElementUI.innerHTML = `<li>${prompt}</li>`;
            return; // Don't proceed further if list is empty
        }

        // Populate list with reference pairs
        refPairs.forEach((pair, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${pair.ot_ref || '?'} / ${pair.nt_ref || '?'}`;
            listItem.dataset.index = index; // Index within the *filtered* list
            listItem.setAttribute('role', 'button'); listItem.setAttribute('tabindex', '0');
             // Event listeners attached by event_handler.js
            prophecyListElementUI.appendChild(listItem);
        });
        console.log(`UI_MGR: Rendered ${refPairs.length} references for ${currentFilter}`);
    }

    /**
     * Displays the details (Refs, Text, Description, Category).
     * It receives the looked-up text as arguments from app.js.
     * @param {object | null} refPairObject - The {ot_ref, nt_ref, description} object, or null.
     * @param {string | null} categoryName - The name of the current category filter.
     * @param {string} otText - The fetched OT text (or status message).
     * @param {string} ntText - The fetched NT text (or status message).
     * @param {string} defaultText - Text for detail view if refPairObject is null.
     */
    function displayDetailedPairUI(refPairObject, categoryName, otText, ntText, defaultText = 'Select reference.') {
         // Ensure all required elements exist before proceeding
         if (!prophecyContentElementUI || !otRefElementUI || !ntRefElementUI || !categoryElementUI || !descriptionElementUI || !otTextElementUI || !ntTextElementUI) {
              console.error("UI_MGR: Detail view elements not found! Cannot display details.");
              return;
         }

        const isError = errorMessageElementUI.style.display === 'block';
        const isLoading = loadingIndicatorUI.style.display === 'block';
        // Only show content area if not loading AND not in error state
        prophecyContentElementUI.style.display = (!isLoading && !isError) ? 'block' : 'none';

        if (refPairObject && !isError && !isLoading) {
            // Populate elements if we have a valid refPairObject and no errors/loading
            otRefElementUI.textContent = refPairObject.ot_ref || 'N/A';
            ntRefElementUI.textContent = refPairObject.nt_ref || 'N/A';
            categoryElementUI.textContent = categoryName === "All Categories" ? "N/A" : (categoryName || 'N/A');
            descriptionElementUI.textContent = refPairObject.description || '';
            otTextElementUI.textContent = otText; // Display looked-up text passed in
            ntTextElementUI.textContent = ntText; // Display looked-up text passed in
            console.log(`UI_MGR: Displayed details for: ${refPairObject.ot_ref} / ${refPairObject.nt_ref}`);
        } else if (!isError && !isLoading) {
            // Clear the detail view or show prompt text if refPairObject is null
            otRefElementUI.textContent = '';
            otTextElementUI.textContent = defaultText;
            ntRefElementUI.textContent = '';
            ntTextElementUI.textContent = '';
            categoryElementUI.textContent = '';
            descriptionElementUI.textContent = '';
            console.log("UI_MGR: Cleared detail view or showing prompt.");
        }
        // If loading or error, content area remains hidden by the check at the top
    }

    /**
     * Displays the Bible translation name in the UI.
     * @param {string} name - The translation name string.
     */
    function displayTranslationNameUI(name) {
        if (translationNameElementUI) {
            translationNameElementUI.textContent = name || "[Unknown]";
            console.log("UI_MGR: Displayed translation name:", name);
        } else {
            // Log warning if the specific element isn't found
            console.warn("UI_MGR: Translation name element (#translation-name) not found in HTML.");
        }
    }

    /**
     * Updates visual styling of category list items.
     * @param {string} selectedCategoryName - The name of the currently selected category.
     */
    function updateCategorySelectionVisualsUI(selectedCategoryName) {
         if (!categoryNavContainerUI) return;
         // Assumes category items are LIs within #category-list
         const categoryList = document.getElementById('category-list');
         if (!categoryList) return;
         const categoryItems = categoryList.querySelectorAll('li');
         categoryItems.forEach(item => {
             if (item.dataset.categoryName !== undefined) {
                if (item.dataset.categoryName === selectedCategoryName) { item.classList.add('selected'); }
                else { item.classList.remove('selected'); }
             }
         });
    }

    /**
     * Updates visual styling of reference list items.
     * @param {number | null} selectedIndex - The index of the currently selected item, or null.
     */
    function updateListSelectionVisualsUI(selectedIndex) {
        if (!prophecyListElementUI) return;
        const listItems = prophecyListElementUI.querySelectorAll('li');
        listItems.forEach((item) => {
             // Check if the item represents a prophecy (has a data-index)
             if (item.dataset.index !== undefined) {
                const itemIndex = parseInt(item.dataset.index);
                 // Apply 'selected' class if index matches, remove otherwise
                if (selectedIndex !== null && itemIndex === selectedIndex) {
                     item.classList.add('selected');
                 } else {
                     item.classList.remove('selected');
                 }
             }
        });
    }

    // Expose public functions to the ProphecyApp namespace
    return {
        updateStatusUI: updateStatusUI,
        processCategoriesUI: processCategoriesUI,
        renderReferenceListUI: renderReferenceListUI,
        displayDetailedPairUI: displayDetailedPairUI,
        displayTranslationNameUI: displayTranslationNameUI, // Expose translation display function
        updateCategorySelectionVisualsUI: updateCategorySelectionVisualsUI,
        updateListSelectionVisualsUI: updateListSelectionVisualsUI
    };
})();
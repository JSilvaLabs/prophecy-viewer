/**
 * app.js - Main application logic and coordination using ProphecyApp namespace.
 * for Prophecy Viewer MVP V3 (Dynamic Fetch)
 * Includes fix for dataFetcher namespace and logic to display translation name.
 */

// Initialize the namespace object if it doesn't exist
var ProphecyApp = ProphecyApp || {};

ProphecyApp.app = (function() {
    // --- App State --- (Kept within this module's scope)
    let _currentCategoryFilter = "All Categories";
    let _filteredReferences = []; // Holds the refs for the currently selected category
    let _currentSelectionIndex = 0; // Index within the _filteredReferences array
    let _currentSelectionRefPair = null; // The {ot_ref, nt_ref, description} object currently selected

    // --- Alias functions from other modules for convenience ---
    // Defensive check: ensure modules exist before aliasing
    const _uiManager = ProphecyApp.uiManager || {};
    const _dataFetcher = ProphecyApp.dataFetcher || {}; // Use dataFetcher namespace
    const _eventHandler = ProphecyApp.eventHandler || {};

    // UI Manager Aliases
    const _updateStatusUI = _uiManager.updateStatusUI || function(...args) { console.error("UI Manager updateStatusUI not loaded", args); };
    const _processCategoriesUI = _uiManager.processCategoriesUI || function(...args) { console.error("UI Manager processCategoriesUI not loaded", args); };
    const _renderReferenceListUI = _uiManager.renderReferenceListUI || function(...args) { console.error("UI Manager renderReferenceListUI not loaded", args); };
    const _displayDetailedPairUI = _uiManager.displayDetailedPairUI || function(...args) { console.error("UI Manager displayDetailedPairUI not loaded", args); };
    const _displayTranslationNameUI = _uiManager.displayTranslationNameUI || function(...args) { console.error("UI Manager displayTranslationNameUI not loaded", args); };
    const _updateCategorySelectionVisualsUI = _uiManager.updateCategorySelectionVisualsUI || function(...args) { console.error("UI Manager updateCategorySelectionVisualsUI not loaded", args); };
    const _updateListSelectionVisualsUI = _uiManager.updateListSelectionVisualsUI || function(...args) { console.error("UI Manager updateListSelectionVisualsUI not loaded", args); };

    // Data Fetcher Aliases (Corrected to use _dataFetcher and correct function names)
    const _fetchManifest = _dataFetcher.fetchManifest || async function(...args) { console.error("Data Fetcher fetchManifest not loaded", args); throw new Error("Data Fetcher not loaded"); };
    const _fetchBsbData = _dataFetcher.fetchAndParseBsbData || async function(...args) { console.error("Data Fetcher fetchAndParseBsbData not loaded", args); throw new Error("Data Fetcher not loaded"); }; // Use combined function
    const _getVerseText = _dataFetcher.getVerseText || function(...args) { console.error("Data Fetcher getVerseText not loaded", args); return "[Data Fetcher Error]"; };
    const _getAvailableCategories = _dataFetcher.getAvailableCategories || function(...args) { console.error("Data Fetcher getAvailableCategories not loaded", args); return []; };
    const _isBsbDataReady = _dataFetcher.isBsbDataReady || function(...args) { console.error("Data Fetcher isBsbDataReady not loaded", args); return false; };
    const _getTranslationName = _dataFetcher.getTranslationName || function(...args) { console.error("Data Fetcher getTranslationName not loaded", args); return "[N/A]"; };

    // Event Handler Alias
    const _attachListeners = _eventHandler.attachListeners || function(...args) { console.error("Event Handler attachListeners not loaded", args); };

    /**
     * Initializes the application: fetches data and sets up initial UI.
     */
    async function initializeApp() {
        console.log("APP: Initializing App...");
        // Initial state: Loading manifest
        _updateStatusUI(true, null, "Loading categories/references..."); // From ui_manager.js

        try {
            // Load manifest first using the (corrected) _fetchManifest alias
            const categories = await _fetchManifest();

            // Then load BSB data using the (corrected) _fetchBsbData alias
            await _fetchBsbData(); // This calls fetchAndParseBsbData from data_fetcher.js

            // Check if BSB data is actually ready after attempting load/parse
            if (!_isBsbDataReady()) {
                throw new Error("BSB data initialization failed after fetch attempt.");
            }

            // Data is ready if no error was thrown
            console.log("APP: Initialization complete. App ready.");
            _updateStatusUI(false); // Hide final loading indicator

            // --- Display Translation Name ---
            const translationName = _getTranslationName(); // Get name via alias
            _displayTranslationNameUI(translationName); // Display name via alias
            // --- End Display Translation Name ---

            // Populate category UI using data now available via getter alias
            _processCategoriesUI(_getAvailableCategories()); // Pass loaded categories

            // Attach event listeners AFTER UI elements are created/populated using alias
             _attachListeners();

            // Set initial view state
            filterAndRenderAppReferences("All Categories"); // Start with 'All Categories' selected

        } catch (error) {
            console.error("APP: Initialization Error:", error);
            // Update UI to show the final error state caught during init
             _updateStatusUI(false, `Initialization failed: ${error.message}`);
             // Display default/error translation name
             _displayTranslationNameUI("[Translation N/A]");
        }
    }

    /**
     * Filters references based on selected category and updates UI.
     * Called by event handler.
     * @param {string} categoryName - The name of the category selected by the user.
     */
    function filterAndRenderAppReferences(categoryName) {
        console.log(`APP: Filtering for category: ${categoryName}`);
        _currentCategoryFilter = categoryName; // Update app state

        if (categoryName === "All Categories") {
            _filteredReferences = [];
        } else {
            const categoryData = _getAvailableCategories().find(cat => cat.name === categoryName);
            _filteredReferences = (categoryData && Array.isArray(categoryData.pairs)) ? categoryData.pairs : [];
        }

        _currentSelectionIndex = 0;
        _currentSelectionRefPair = null;

        _renderReferenceListUI(_filteredReferences, _currentCategoryFilter); // Use alias
        _updateCategorySelectionVisualsUI(_currentCategoryFilter); // Use alias

         if (_filteredReferences.length > 0) {
             displayAppDetailedPair(0); // Use internal function
         } else {
              displayAppDetailedPair(null, `Select a ${categoryName === 'All Categories' ? 'category' : 'reference'}.`); // Use internal function
         }
    }

    /**
     * Displays the details for the prophecy reference at the given index in the filtered list.
     * Called by event handler or after list render.
     * @param {number | null} index - Index in the _filteredReferences array, or null to clear/prompt.
     * @param {string} defaultText - Optional prompt text.
     */
    function displayAppDetailedPair(index, defaultText = 'Select a reference.') {
         if (index !== null && index >= 0 && index < _filteredReferences.length) {
             _currentSelectionIndex = index;
             _currentSelectionRefPair = _filteredReferences[_currentSelectionIndex];
             console.log(`APP: Displaying details for index ${index}`);

             const bsbReady = _isBsbDataReady(); // Use alias
             const otVerseText = bsbReady ? _getVerseText(_currentSelectionRefPair.ot_ref) : "[BSB Data Not Ready]"; // Use alias
             const ntVerseText = bsbReady ? _getVerseText(_currentSelectionRefPair.nt_ref) : "[BSB Data Not Ready]"; // Use alias

             _displayDetailedPairUI( // Use alias
                 _currentSelectionRefPair, _currentCategoryFilter,
                 otVerseText, ntVerseText, defaultText
             );
             _updateListSelectionVisualsUI(_currentSelectionIndex); // Use alias

         } else {
              _currentSelectionIndex = null;
              _currentSelectionRefPair = null;
              _displayDetailedPairUI(null, _currentCategoryFilter, null, null, defaultText); // Use alias
              _updateListSelectionVisualsUI(null); // Use alias
         }
    }

    // --- Public Methods / Getters ---
    return {
        initializeApp: initializeApp,
        filterAndRenderAppReferences: filterAndRenderAppReferences,
        displayAppDetailedPair: displayAppDetailedPair,
        getFilteredReferencesCount: function() { return _filteredReferences.length; }
    };
})();

// --- Initial Execution ---
document.addEventListener('DOMContentLoaded', ProphecyApp.app.initializeApp);
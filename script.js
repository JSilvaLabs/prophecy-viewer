/**
 * Prophecy Viewer Prototype V2 - Script
 * Focuses on robust data fetching, error handling, and state-based UI updates.
 */

// --- DOM Element References ---
const prophecyListElement = document.getElementById('prophecy-list');
const otRefElement = document.getElementById('ot-ref');
const otTextElement = document.getElementById('ot-prophecy-text');
const ntRefElement = document.getElementById('nt-ref');
const ntTextElement = document.getElementById('nt-fulfillment-text');
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessageElement = document.getElementById('error-message');
const prophecyContentElement = document.getElementById('prophecy-content');

// --- Global Variables ---
let loadedProphecies = []; // Stores the fetched data
let currentSelectionIndex = 0; // Tracks the selected list item

// --- State Management Helper ---
/**
 * Updates the visibility of UI elements based on the current state.
 * @param {boolean} isLoading - Is the application currently loading data?
 * @param {string|null} error - An error message string, or null if no error.
 */
function updateUIState(isLoading, error = null) {
    if (isLoading) {
        loadingIndicator.style.display = 'block';
        errorMessageElement.style.display = 'none';
        prophecyContentElement.style.display = 'none';
    } else if (error) {
        loadingIndicator.style.display = 'none';
        errorMessageElement.textContent = error; // Display the error message
        errorMessageElement.style.display = 'block';
        prophecyContentElement.style.display = 'none';
    } else { // Data loaded successfully
        loadingIndicator.style.display = 'none';
        errorMessageElement.style.display = 'none';
        prophecyContentElement.style.display = 'block';
    }
}

// --- Data Fetching Function ---
/**
 * Fetches prophecy data from the prophecies.json file asynchronously.
 * Handles network and parsing errors, updating the UI accordingly.
 */
async function fetchProphecyData() {
    updateUIState(true); // Show loading indicator

    try {
        const response = await fetch('prophecies.json');
        // Check if the network response is ok (status 200-299)
        if (!response.ok) {
            // Throw an error with the status text (e.g., "Not Found", "Forbidden")
            throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
        }
        // Try to parse the JSON data
        const data = await response.json();

        // Basic validation: Check if it's an array and not empty
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Invalid or empty data format received from prophecies.json.');
        }

        // SUCCESS! Store data and initialize the rest of the UI
        loadedProphecies = data;
        initializeUI(); // Call function to build list and display first item
        updateUIState(false); // Hide loading, show content

    } catch (error) {
        // FAILURE! Log the error and display a user-friendly message
        console.error('Error fetching or processing prophecy data:', error);
        // Display the error message in the designated HTML element
        updateUIState(false, `Failed to load prophecy data. ${error.message}. Please ensure 'prophecies.json' exists, is accessible, and contains valid JSON.`);
    }
}

// --- UI Initialization and Rendering ---
/**
 * Initializes the UI components after data has been successfully fetched.
 * Focus: Get the first item displayed reliably. List rendering is incremental.
 */
function initializeUI() {
    // V2 Focus: Ensure the first item displays correctly first.
    if (loadedProphecies.length > 0) {
        currentSelectionIndex = 0; // Reset to first item
        displayDetailedPair(loadedProphecies[currentSelectionIndex]);
        // Incremental Step: Render the list after confirming basic display works.
        renderProphecyList(loadedProphecies);
        // Update list visuals after rendering
        updateListSelection();
    } else {
         // This case should ideally be caught by validation in fetch, but as a fallback:
         updateUIState(false, "No prophecy data available to display.");
    }
}

/**
 * Populates the prophecy list in the HTML. (Incremental Feature)
 * @param {Array} data - The array of prophecy objects.
 */
function renderProphecyList(data) {
    // Clear any previous items
    prophecyListElement.innerHTML = '';

    if (!data || data.length === 0) {
        prophecyListElement.innerHTML = '<li>No prophecies loaded.</li>';
        return;
    }

    data.forEach((pair, index) => {
        const listItem = document.createElement('li');
        // Use OT reference for list text, provide fallback
        listItem.textContent = pair.ot_ref || `Prophecy ${index + 1}`;
        listItem.dataset.index = index; // Store index for click handling
        listItem.addEventListener('click', handleListSelection);
        prophecyListElement.appendChild(listItem);
    });
}

/**
 * Displays the selected prophecy/fulfillment pair in the detail view.
 * @param {object} pairObject - The object containing the prophecy data.
 */
function displayDetailedPair(pairObject) {
    if (pairObject) {
        otRefElement.textContent = pairObject.ot_ref || 'N/A';
        otTextElement.textContent = pairObject.ot_prophecy || 'N/A';
        ntRefElement.textContent = pairObject.nt_ref || 'N/A';
        ntTextElement.textContent = pairObject.nt_fulfillment || 'N/A';
    } else {
        console.error("Attempted to display an invalid pair object.");
        // Optionally update UI to show an internal error specific to display
        otRefElement.textContent = 'Error';
        otTextElement.textContent = 'Could not display selected item data.';
        ntRefElement.textContent = 'Error';
        ntTextElement.textContent = '';
    }
}

// --- Event Handling ---
/**
 * Handles clicks on items in the prophecy list. (Incremental Feature)
 * @param {Event} event - The click event object.
 */
function handleListSelection(event) {
    const selectedIndex = parseInt(event.target.dataset.index);

    if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < loadedProphecies.length) {
        currentSelectionIndex = selectedIndex;
        displayDetailedPair(loadedProphecies[currentSelectionIndex]);
        updateListSelection(); // Update visual selection
    } else {
        console.error("Invalid index clicked:", event.target.dataset.index);
    }
}

/**
 * Updates the visual styling of the list to show the currently selected item. (Incremental Feature)
 */
function updateListSelection() {
    const listItems = prophecyListElement.querySelectorAll('li');
    listItems.forEach((item, index) => {
        if (index === currentSelectionIndex) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

// --- Initial Execution ---
// Start the process by fetching the data when the script loads.
fetchProphecyData();
/**
 * Prophecy Viewer Prototype - Script
 * Handles fetching data, populating list, and displaying selected prophecy pair.
 */

// --- DOM Element References ---
const prophecyListElement = document.getElementById('prophecy-list');
const otRefElement = document.getElementById('ot-ref');
const otTextElement = document.getElementById('ot-prophecy-text');
const ntRefElement = document.getElementById('nt-ref');
const ntTextElement = document.getElementById('nt-fulfillment-text');
const loadingIndicator = document.getElementById('loading-indicator');
const prophecyContentElement = document.getElementById('prophecy-content');

// --- Global Variables ---
let loadedProphecies = []; // To store the fetched data
let currentSelectionIndex = 0; // To track the selected list item

// --- Data Fetching Function ---
/**
 * Fetches prophecy data from the prophecies.json file.
 */
async function fetchProphecyData() {
    // Show loading indicator initially
    loadingIndicator.style.display = 'block';
    prophecyContentElement.style.display = 'none';

    try {
        const response = await fetch('prophecies.json');
        // Check if the network response is ok
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Parse the JSON data
        loadedProphecies = await response.json();

        // Check if data was loaded successfully and is an array
        if (!Array.isArray(loadedProphecies) || loadedProphecies.length === 0) {
            throw new Error('No prophecy data found or data is not in expected format.');
        }

        // Data loaded successfully, initialize the UI
        initializeUI();

    } catch (error) {
        // Log the error and display a message to the user
        console.error('Error fetching or parsing prophecy data:', error);
        loadingIndicator.textContent = `Error loading data: ${error.message}. Please check prophecies.json.`;
        loadingIndicator.style.color = 'red'; // Make error more visible
    } finally {
        // We hide the loading indicator only if data loads successfully (in initializeUI)
        // or display an error message within it if fetch fails.
    }
}

// --- UI Initialization and Rendering ---
/**
 * Initializes the UI after data has been fetched.
 */
function initializeUI() {
    renderProphecyList(loadedProphecies);
    // Display the first prophecy by default
    displayDetailedPair(loadedProphecies[currentSelectionIndex]);
    // Mark the first item as selected in the list
    updateListSelection();
    // Hide loading indicator and show content
    loadingIndicator.style.display = 'none';
    prophecyContentElement.style.display = 'block';
}

/**
 * Populates the prophecy list in the HTML.
 * @param {Array} data - The array of prophecy objects.
 */
function renderProphecyList(data) {
    // Clear any existing list items (like "Loading list...")
    prophecyListElement.innerHTML = '';

    data.forEach((pair, index) => {
        const listItem = document.createElement('li');
        // Display the OT reference as the list item text
        listItem.textContent = pair.ot_ref || `Prophecy ${index + 1}`; // Fallback text
        // Store the index on the element using a data attribute
        listItem.dataset.index = index;
        // Add event listener for selection
        listItem.addEventListener('click', handleListSelection);
        prophecyListElement.appendChild(listItem);
    });
}

/**
 * Displays the selected prophecy/fulfillment pair in the detail view.
 * @param {object} pairObject - The object containing ot_ref, ot_prophecy, etc.
 */
function displayDetailedPair(pairObject) {
    if (pairObject) {
        otRefElement.textContent = pairObject.ot_ref || 'N/A';
        otTextElement.textContent = pairObject.ot_prophecy || 'N/A';
        ntRefElement.textContent = pairObject.nt_ref || 'N/A';
        ntTextElement.textContent = pairObject.nt_fulfillment || 'N/A';
    } else {
        // Handle case where the object is invalid
        console.error("Invalid pair object provided to displayDetailedPair");
        otRefElement.textContent = 'Error';
        otTextElement.textContent = 'Could not load data for this item.';
        ntRefElement.textContent = 'Error';
        ntTextElement.textContent = '';
    }
}

// --- Event Handling ---
/**
 * Handles clicks on items in the prophecy list.
 * @param {Event} event - The click event object.
 */
function handleListSelection(event) {
    // Get the index stored in the data attribute
    const selectedIndex = parseInt(event.target.dataset.index);

    // Check if the index is valid
    if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < loadedProphecies.length) {
        // Update the current selection index
        currentSelectionIndex = selectedIndex;
        // Display the corresponding pair
        displayDetailedPair(loadedProphecies[currentSelectionIndex]);
        // Update the visual selection in the list
        updateListSelection();
    } else {
        console.error("Invalid index selected from list:", event.target.dataset.index);
    }
}

/**
 * Updates the visual styling of the list to show the currently selected item.
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
// Start the process by fetching the data when the script loads
fetchProphecyData();
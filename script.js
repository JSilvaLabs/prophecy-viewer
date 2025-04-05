/**
 * Prophecy Viewer MVP - Script
 * Handles fetching data, category filtering, list population,
 * and displaying selected prophecy pair with robust error handling.
 */

// --- DOM Element References ---
const prophecyListElement = document.getElementById('prophecy-list');
const otRefElement = document.getElementById('ot-ref');
const otTextElement = document.getElementById('ot-prophecy-text');
const ntRefElement = document.getElementById('nt-ref');
const ntTextElement = document.getElementById('nt-fulfillment-text');
const categoryElement = document.getElementById('prophecy-category'); // Added for MVP
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessageElement = document.getElementById('error-message');
const prophecyContentElement = document.getElementById('prophecy-content');
// Assumes a <select> element with this ID exists in index.html for filtering
const categoryFilterElement = document.getElementById('category-filter');

// --- Global Variables ---
let allLoadedProphecies = []; // Stores the full fetched dataset
let filteredProphecies = []; // Stores the currently filtered subset for display
let currentSelectionIndex = 0; // Tracks the selected index *within the filtered list*
let categories = []; // To store unique categories found

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
        if (categoryFilterElement) categoryFilterElement.style.display = 'none'; // Hide filter while loading/error
        prophecyListElement.innerHTML = ''; // Clear list
    } else if (error) {
        loadingIndicator.style.display = 'none';
        errorMessageElement.textContent = error;
        errorMessageElement.style.display = 'block';
        prophecyContentElement.style.display = 'none';
        if (categoryFilterElement) categoryFilterElement.style.display = 'none';
        prophecyListElement.innerHTML = '<li>Error loading data</li>'; // Show error in list area too
    } else { // Data loaded successfully
        loadingIndicator.style.display = 'none';
        errorMessageElement.style.display = 'none';
        prophecyContentElement.style.display = 'block'; // Show content area (details populated separately)
         if (categoryFilterElement) categoryFilterElement.style.display = 'block'; // Show filter
    }
}

// --- Data Fetching Function ---
/**
 * Fetches prophecy data from the prophecies.json file asynchronously.
 * Handles network and parsing errors, updating the UI accordingly.
 */
async function fetchProphecyData() {
    updateUIState(true); // Show loading

    try {
        const response = await fetch('prophecies.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Invalid or empty data format received from prophecies.json.');
        }

        // SUCCESS! Store data
        allLoadedProphecies = data;
        // Initial filter shows all prophecies
        filteredProphecies = [...allLoadedProphecies];

        // Process categories and initialize the UI
        processCategories();
        initializeUI();
        updateUIState(false); // Hide loading, show content elements

    } catch (error) {
        console.error('Error fetching or processing prophecy data:', error);
        updateUIState(false, `Failed to load prophecy data. ${error.message}. Ensure 'prophecies.json' exists, is accessible, contains valid JSON, and includes a 'category' field for each entry.`);
    }
}

// --- Category Processing ---
/**
 * Extracts unique categories from the loaded data and populates the filter.
 */
function processCategories() {
    const categorySet = new Set();
    allLoadedProphecies.forEach(pair => {
        if (pair.category) {
            categorySet.add(pair.category.trim());
        } else {
            console.warn("Warning: Prophecy pair missing 'category' field:", pair);
            categorySet.add("Uncategorized"); // Add a default category
        }
    });
    // Sort categories alphabetically, add "All" option
    categories = ["All Categories", ...Array.from(categorySet).sort()];

    // Populate the category filter dropdown (assuming it exists)
    if (categoryFilterElement) {
        categoryFilterElement.innerHTML = ''; // Clear existing options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilterElement.appendChild(option);
        });
        // Add event listener to the filter
        categoryFilterElement.addEventListener('change', handleCategoryFilterChange);
    } else {
         console.warn("Category filter element with ID 'category-filter' not found. Filtering UI disabled.");
    }
}

// --- UI Initialization and Rendering ---
/**
 * Initializes the UI components after data has been successfully fetched.
 * Renders the initial list and displays the first item.
 */
function initializeUI() {
    if (filteredProphecies.length > 0) {
        currentSelectionIndex = 0; // Select first item in the (initially unfiltered) list
        renderProphecyList(filteredProphecies); // Render the full list initially
        displayDetailedPair(filteredProphecies[currentSelectionIndex]); // Display the first item
        updateListSelection(); // Highlight first item in the list
    } else {
         // Handle case where data might be valid but empty after filtering (though unlikely initially)
         prophecyListElement.innerHTML = '<li>No prophecies found matching the criteria.</li>';
         // Clear detail view or show message
         displayDetailedPair(null); // Display error/empty state
    }
}

/**
 * Populates/Repopulates the prophecy list in the HTML based on filtered data.
 * @param {Array} data - The array of prophecy objects to display in the list.
 */
function renderProphecyList(data) {
    prophecyListElement.innerHTML = ''; // Clear previous list

    if (!data || data.length === 0) {
        prophecyListElement.innerHTML = '<li>No prophecies match the selected category.</li>';
         displayDetailedPair(null); // Clear details if list is empty
        return;
    }

    data.forEach((pair, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = pair.ot_ref || `Prophecy ${index + 1}`; // Use OT ref for label
        // IMPORTANT: Store the index *within the currently filtered list*
        listItem.dataset.index = index;
        listItem.addEventListener('click', handleListSelection);
        prophecyListElement.appendChild(listItem);
    });

     // After re-rendering the list, ensure the selection is valid and updated
     if(currentSelectionIndex >= data.length) {
         currentSelectionIndex = 0; // Reset selection if previous selection is out of bounds
     }
     if(data.length > 0) {
         displayDetailedPair(data[currentSelectionIndex]);
         updateListSelection();
     } else {
         displayDetailedPair(null); // No items to display details for
     }

}

/**
 * Displays the selected prophecy/fulfillment pair in the detail view.
 * @param {object | null} pairObject - The object containing the prophecy data, or null to clear.
 */
function displayDetailedPair(pairObject) {
    if (pairObject) {
        otRefElement.textContent = pairObject.ot_ref || 'N/A';
        otTextElement.textContent = pairObject.ot_prophecy || 'N/A';
        ntRefElement.textContent = pairObject.nt_ref || 'N/A';
        ntTextElement.textContent = pairObject.nt_fulfillment || 'N/A';
        categoryElement.textContent = pairObject.category || 'Uncategorized'; // Display category
        prophecyContentElement.style.display = 'block'; // Ensure content is visible
    } else {
        // Clear the detail view if no object is provided (e.g., empty filter)
        otRefElement.textContent = '';
        otTextElement.textContent = 'Select a prophecy from the list.';
        ntRefElement.textContent = '';
        ntTextElement.textContent = '';
        categoryElement.textContent = '';
        // Keep the content area visible to show the 'Select...' message
         prophecyContentElement.style.display = 'block';
    }
}

// --- Event Handling ---
/**
 * Handles changes in the category filter dropdown.
 */
function handleCategoryFilterChange(event) {
    const selectedCategory = event.target.value;

    if (selectedCategory === "All Categories") {
        filteredProphecies = [...allLoadedProphecies];
    } else {
        filteredProphecies = allLoadedProphecies.filter(pair => (pair.category || "Uncategorized") === selectedCategory);
    }

    // Reset selection and re-render the list with the filtered data
    currentSelectionIndex = 0;
    renderProphecyList(filteredProphecies);
}


/**
 * Handles clicks on items in the prophecy list.
 * @param {Event} event - The click event object.
 */
function handleListSelection(event) {
    // Get the index *relative to the currently displayed filtered list*
    const selectedIndex = parseInt(event.target.dataset.index);

    if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < filteredProphecies.length) {
        currentSelectionIndex = selectedIndex;
        // Display the pair from the *filtered* list
        displayDetailedPair(filteredProphecies[currentSelectionIndex]);
        updateListSelection(); // Update visual selection in the list
    } else {
        console.error("Invalid index clicked:", event.target.dataset.index);
    }
}

/**
 * Updates the visual styling of the list to show the currently selected item.
 */
function updateListSelection() {
    const listItems = prophecyListElement.querySelectorAll('li');
    listItems.forEach((item, index) => {
        // Compare item's index (which matches filteredProphecies index) to currentSelectionIndex
        if (index === currentSelectionIndex) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}


// --- Initial Execution ---
// Start the process by fetching the data when the script loads.
document.addEventListener('DOMContentLoaded', fetchProphecyData);
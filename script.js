/**
 * Prophecy Viewer MVP V2 (Multi-File) - Script
 * Handles fetching category manifest, then category-specific data,
 * filtering, list population, and display with robust error handling.
 */

// --- DOM Element References ---
const categoryNavContainer = document.getElementById('category-nav-container'); // Container for category UI
const prophecyListElement = document.getElementById('prophecy-list');
const otRefElement = document.getElementById('ot-ref');
const otTextElement = document.getElementById('ot-prophecy-text');
const ntRefElement = document.getElementById('nt-ref');
const ntTextElement = document.getElementById('nt-fulfillment-text');
const categoryElement = document.getElementById('prophecy-category');
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessageElement = document.getElementById('error-message');
const prophecyContentElement = document.getElementById('prophecy-content');

// --- Global Variables ---
let availableCategories = []; // Stores category info { name: "...", file: "..." } from manifest
let currentCategoryData = []; // Stores prophecy data for the currently loaded category
let currentSelectionIndex = 0; // Index within the currentCategoryData array
let currentCategoryFilter = "All Categories"; // Track the selected category name

// --- State Management Helper ---
/**
 * Updates the visibility and content of status UI elements.
 * @param {boolean} isLoading - Is data (manifest or category) currently loading?
 * @param {string|null} error - An error message string, or null if no error.
 * @param {string} loadingText - Text to show while loading.
 */
function updateStatusUI(isLoading, error = null, loadingText = "Loading...") {
    if (isLoading) {
        loadingIndicator.textContent = loadingText;
        loadingIndicator.style.display = 'block';
        errorMessageElement.style.display = 'none';
        prophecyContentElement.style.display = 'none'; // Hide content while loading/error
    } else if (error) {
        loadingIndicator.style.display = 'none';
        errorMessageElement.textContent = error;
        errorMessageElement.style.display = 'block';
        prophecyContentElement.style.display = 'none';
    } else { // Data loaded successfully (manifest or category)
        loadingIndicator.style.display = 'none';
        errorMessageElement.style.display = 'none';
        // Content display is handled separately after data is processed
    }
}

// --- Data Fetching Functions ---
/**
 * Fetches the category manifest file (categories.json).
 */
async function fetchManifest() {
    updateStatusUI(true, null, "Loading categories...");

    try {
        const response = await fetch('categories.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
        }
        const manifest = await response.json();

        // Basic validation
        if (!manifest || !Array.isArray(manifest.categories) || manifest.categories.length === 0) {
            throw new Error('Invalid or empty format in categories.json.');
        }

        // SUCCESS! Store categories and process them
        availableCategories = manifest.categories;
        processCategories();
        // Optionally load a default category or wait for user selection
        // For now, let's wait for user selection or default to showing nothing/prompt
        updateStatusUI(false); // Hide main loading, show category UI
        renderProphecyList([]); // Render empty list initially
        displayDetailedPair(null, "Select a category."); // Prompt user

    } catch (error) {
        console.error('Error fetching or parsing manifest:', error);
        updateStatusUI(false, `Failed to load category list. ${error.message}`);
    }
}

/**
 * Fetches the JSON data file for a specific category.
 * @param {string} categoryName - The name of the category being loaded.
 * @param {string|null} filePath - The path to the category's JSON file (or null for 'All').
 */
async function fetchCategoryData(categoryName, filePath) {
    // Special handling for "All Categories" - for now, just clear the list/details
    if (filePath === null) {
        currentCategoryFilter = "All Categories";
        currentCategoryData = []; // Clear data
        renderProphecyList([]); // Render empty list
        displayDetailedPair(null, "Select a specific category to view prophecies.");
        updateCategorySelectionVisuals(); // Update visuals
        return; // Stop here for "All Categories"
    }

    updateStatusUI(true, null, `Loading ${categoryName}...`); // Show loading specifically for category
    prophecyListElement.innerHTML = '<li>Loading...</li>'; // Clear list while fetching

    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} ${response.statusText} for ${filePath}`);
        }
        const data = await response.json();

        if (!Array.isArray(data)) { // Allow empty array for categories with 0 pairs
            throw new Error(`Invalid data format in ${filePath}. Expected an array.`);
        }

        // SUCCESS! Store data, update state, render UI
        currentCategoryData = data;
        currentCategoryFilter = categoryName;
        currentSelectionIndex = 0; // Reset selection to the first item
        renderProphecyList(currentCategoryData);
        updateStatusUI(false); // Hide loading indicator
        updateCategorySelectionVisuals();

    } catch (error) {
        console.error(`Error fetching data for category ${categoryName}:`, error);
        updateStatusUI(false, `Failed to load data for ${categoryName}. ${error.message}`);
        currentCategoryData = []; // Clear data on error
        renderProphecyList([]); // Render empty list on error
    }
}


// --- UI Processing and Rendering ---
/**
 * Populates the category navigation UI from the manifest data.
 */
function processCategories() {
    if (!categoryNavContainer) {
        console.error("Category navigation container not found.");
        return;
    }
    // Example: Using a UL for categories
    const categoryList = document.createElement('ul');
    categoryList.id = 'category-list'; // Ensure ID matches CSS if needed

    availableCategories.forEach(category => {
        const listItem = document.createElement('li');
        listItem.textContent = category.name;
        listItem.dataset.categoryName = category.name; // Store name
        listItem.dataset.filePath = category.file || ''; // Store file path (or empty string for null)
        listItem.addEventListener('click', handleCategorySelection);
        categoryList.appendChild(listItem);
    });

    categoryNavContainer.innerHTML = ''; // Clear placeholder
    categoryNavContainer.appendChild(categoryList);
    updateCategorySelectionVisuals(); // Set initial visual state
}


/**
 * Populates/Repopulates the prophecy list based on currently loaded category data.
 * @param {Array} data - The array of prophecy objects for the current category.
 */
function renderProphecyList(data) {
    prophecyListElement.innerHTML = ''; // Clear previous list

    if (!data || data.length === 0) {
        prophecyListElement.innerHTML = `<li>No prophecies found for ${currentCategoryFilter}.</li>`;
        displayDetailedPair(null, `No prophecies found for ${currentCategoryFilter}.`); // Also clear detail
        return;
    }

    data.forEach((pair, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = pair.ot_ref || `Prophecy ${index + 1}`;
        listItem.dataset.index = index; // Index within the *current category data*
        listItem.addEventListener('click', handleListSelection);
        prophecyListElement.appendChild(listItem);
    });

    // After rendering, display the first item of the newly loaded category
    if (data.length > 0) {
        currentSelectionIndex = 0;
        displayDetailedPair(data[currentSelectionIndex]);
        updateListSelectionVisuals();
    }
}

/**
 * Displays the selected prophecy/fulfillment pair in the detail view.
 * @param {object | null} pairObject - The object containing the prophecy data, or null.
 * @param {string} defaultText - Text to display if pairObject is null.
 */
function displayDetailedPair(pairObject, defaultText = 'Select a prophecy.') {
    if (pairObject) {
        otRefElement.textContent = pairObject.ot_ref || 'N/A';
        otTextElement.textContent = pairObject.ot_prophecy || 'N/A';
        ntRefElement.textContent = pairObject.nt_ref || 'N/A';
        ntTextElement.textContent = pairObject.nt_fulfillment || 'N/A';
        // Use currentCategoryFilter since 'category' field in object is now optional
        categoryElement.textContent = currentCategoryFilter || 'N/A';
        prophecyContentElement.style.display = 'block';
    } else {
        // Clear the detail view or show prompt
        otRefElement.textContent = '';
        otTextElement.textContent = defaultText;
        ntRefElement.textContent = '';
        ntTextElement.textContent = '';
        categoryElement.textContent = '';
        prophecyContentElement.style.display = 'block'; // Keep area visible for prompt
    }
}

// --- Event Handling ---
/**
 * Handles clicks on items in the category navigation UI.
 */
function handleCategorySelection(event) {
    const selectedCategoryName = event.target.dataset.categoryName;
    const selectedFilePath = event.target.dataset.filePath === '' ? null : event.target.dataset.filePath;

    if (selectedCategoryName !== undefined) {
        // Fetch data for the selected category
        fetchCategoryData(selectedCategoryName, selectedFilePath);
    } else {
        console.error("Category selection failed: data attributes not found.");
    }
}

/**
 * Handles clicks on items in the prophecy list.
 */
function handleListSelection(event) {
    const selectedIndex = parseInt(event.target.dataset.index);

    if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < currentCategoryData.length) {
        currentSelectionIndex = selectedIndex;
        displayDetailedPair(currentCategoryData[currentSelectionIndex]);
        updateListSelectionVisuals();
    } else {
        console.error("Invalid index clicked in prophecy list:", event.target.dataset.index);
    }
}

// --- Visual Update Helpers ---
/**
 * Updates the visual styling of the category list.
 */
function updateCategorySelectionVisuals() {
     if (!categoryNavContainer) return;
     const categoryItems = categoryNavContainer.querySelectorAll('li'); // Assuming UL structure
     categoryItems.forEach(item => {
         if (item.dataset.categoryName === currentCategoryFilter) {
             item.classList.add('selected');
         } else {
             item.classList.remove('selected');
         }
     });
}

/**
 * Updates the visual styling of the prophecy list.
 */
function updateListSelectionVisuals() {
    const listItems = prophecyListElement.querySelectorAll('li');
    listItems.forEach((item, index) => {
        // Check if the item's stored index matches the current selection index
        if (item.dataset.index && parseInt(item.dataset.index) === currentSelectionIndex) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}


// --- Initial Execution ---
// Start the process by fetching the category manifest when the DOM is ready.
document.addEventListener('DOMContentLoaded', fetchManifest);
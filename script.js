/**
 * Prophecy Viewer POC - Script
 * Handles displaying OT prophecy/NT fulfillment pairs.
 */

// --- 1. Data Array ---
// IMPORTANT: Replace the example data below with the actual
// prophecy/fulfillment pairs you compile from the BSB.
// Each object needs an 'ot_prophecy' and 'nt_fulfillment' property.
const prophecyPairs = [
    {
        ot_prophecy: "Example OT: The virgin will conceive and give birth to a son, and will call him Immanuel. (Isaiah 7:14 - Placeholder)",
        nt_fulfillment: "Example NT: \"The virgin will conceive and give birth to a son, and they will call him Immanuel\" (which means \"God with us\"). (Matthew 1:23 - Placeholder)"
    },
    {
        ot_prophecy: "Example OT: But you, Bethlehem Ephrathah, though you are small among the clans of Judah, out of you will come for me one who will be ruler over Israel, whose origins are from of old, from ancient times. (Micah 5:2 - Placeholder)",
        nt_fulfillment: "Example NT: After Jesus was born in Bethlehem in Judea, during the time of King Herod, Magi from the east came to Jerusalem... (Matthew 2:1 - Placeholder)"
    },
    {
        ot_prophecy: "Example OT: Rejoice greatly, Daughter Zion! Shout, Daughter Jerusalem! See, your king comes to you, righteous and victorious, lowly and riding on a donkey, on a colt, the foal of a donkey. (Zechariah 9:9 - Placeholder)",
        nt_fulfillment: "Example NT: They took palm branches and went out to meet him, shouting, \"Hosanna!\" \"Blessed is he who comes in the name of the Lord!\" \"Blessed is the king of Israel!\" Jesus found a young donkey and sat on it, as it is written... (John 12:13-14 - Placeholder)"
    }
    // --- ADD MORE PAIRS HERE ---
];

// --- 2. DOM Element References ---
// Get references to the HTML elements where we will display text
const otTextElement = document.getElementById('ot-prophecy-text');
const ntTextElement = document.getElementById('nt-fulfillment-text');
const nextButton = document.getElementById('next-button');

// --- 3. State Variable ---
// Variable to keep track of the currently displayed pair index
let currentIndex = 0; // Start with the first pair

// --- 4. Display Function ---
/**
 * Updates the HTML to display the prophecy/fulfillment pair at the given index.
 * @param {number} index - The index of the pair to display in the prophecyPairs array.
 */
function displayPair(index) {
    // Check if the data array and the specific index exist
    if (prophecyPairs && prophecyPairs.length > 0 && prophecyPairs[index]) {
        // Update the text content of the HTML elements
        otTextElement.textContent = prophecyPairs[index].ot_prophecy;
        ntTextElement.textContent = prophecyPairs[index].nt_fulfillment;
    } else {
        // Handle cases where data is missing or index is out of bounds
        console.error("Error: Could not display pair at index", index);
        otTextElement.textContent = 'Error: Prophecy data not found.';
        ntTextElement.textContent = 'Error: Fulfillment data not found.';
    }
}

// --- 5. Event Listener for Button ---
/**
 * Handles clicks on the 'Next Pair' button.
 * Increments the index and displays the next pair, wrapping around to the start.
 */
function showNextPair() {
    // Calculate the next index, wrapping around using the modulo operator
    currentIndex = (currentIndex + 1) % prophecyPairs.length;
    // Display the pair at the new index
    displayPair(currentIndex);
}

// Add the event listener only if the button exists
if (nextButton) {
    nextButton.addEventListener('click', showNextPair);
} else {
    console.warn("Warning: 'Next Pair' button not found in the HTML.");
}

// --- 6. Initial Display Logic ---
// Display the first prophecy pair when the script loads
// We check if the array has pairs before attempting to display
if (prophecyPairs.length > 0) {
     displayPair(currentIndex); // Display the pair at the initial index (0)
} else {
     // Display a message if no data is available
     console.error("Error: No prophecy pairs defined in the data array.");
     otTextElement.textContent = 'No prophecy data available.';
     ntTextElement.textContent = 'Please add data to script.js.';
}
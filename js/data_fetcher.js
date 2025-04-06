/**
 * data_fetcher.js - Fetches manifest and BSB data, coordinates parsing via bsb_parser.js,
 * provides data access functions (getVerseText etc.) using ProphecyApp namespace.
 */

// Initialize the namespace object if it doesn't exist
var ProphecyApp = ProphecyApp || {};

ProphecyApp.dataFetcher = (function() {
    // --- Module-Scoped Variables ---
    let _availableCategories = [];
    let _parsedBsbData = null; // Will be populated by calling bsbParser
    let _translationName = "[Unknown]";

    // --- Alias parser function ---
    // Assumes bsb_parser.js is loaded first
    const _parseAndIndexBsbData = ProphecyApp.bsbParser?.parseAndIndexBsbData || function() {
        console.error("DATA_FETCHER Error: bsbParser not loaded correctly!");
        throw new Error("BSB Parser module not available.");
    };


    // --- Public Fetching Functions ---
    /**
     * Fetches the reference manifest file (references.json).
     */
    async function fetchManifest() {
        console.log("DATA_FETCHER: Fetching reference manifest (references.json)...");
        const response = await fetch('references.json');
        if (!response.ok) {
            console.error(`DATA_FETCHER: Manifest fetch failed! Status: ${response.status} ${response.statusText}`);
            throw new Error(`Manifest fetch failed: ${response.status} ${response.statusText}`);
        }
        const manifest = await response.json();
        console.log("DATA_FETCHER: Manifest fetched successfully.");
        if (!manifest || !Array.isArray(manifest.categories)) {
            throw new Error('Invalid manifest format: "categories" array not found.');
        }
        _availableCategories = manifest.categories; // Store module-scoped
        return _availableCategories; // Return categories array
    }

    /**
     * Fetches the full BSB data file and triggers parsing.
     */
    async function fetchAndParseBsbData() { // Renamed slightly for clarity
        console.log("DATA_FETCHER: Fetching BSB data (data/BSB.json)...");
        try {
            const response = await fetch('data/BSB.json');
            if (!response.ok) {
                 console.error(`DATA_FETCHER: BSB data fetch failed! Status: ${response.status} ${response.statusText}`);
                throw new Error(`BSB data fetch failed: ${response.status} ${response.statusText}`);
            }
            const jsonData = await response.json();
            console.log("DATA_FETCHER: BSB data fetched successfully. Preparing to parse...");

            _translationName = jsonData.translation || "Unknown Translation"; // Read translation name
            console.log(`DATA_FETCHER: Translation Name Found: ${_translationName}`);

            // Use await with setTimeout wrapped in a Promise for parsing
            await new Promise((resolve, reject) => {
                 console.log("DATA_FETCHER: Entering Promise for setTimeout(bsbParser.parseAndIndex)...");
                 setTimeout(() => {
                    console.log("DATA_FETCHER: Starting bsbParser.parseAndIndex inside setTimeout...");
                    try {
                        // Call the parser function from the other module
                        _parsedBsbData = _parseAndIndexBsbData(jsonData); // Store the returned index
                        console.log("DATA_FETCHER: bsbParser completed successfully (within setTimeout). Resolving promise.");
                        resolve();
                    } catch (parseError) {
                        console.error("DATA_FETCHER: Error occurred INSIDE bsbParser (caught in setTimeout):", parseError);
                        _parsedBsbData = null; // Ensure null on error
                        _translationName = "[Error Loading]";
                        reject(parseError);
                    }
                }, 50);
            });
             console.log("DATA_FETCHER: Promise for BSB parsing resolved/awaited.");
             // If we get here, parsing was successful.

        } catch (error) {
             console.error('DATA_FETCHER: Error caught in fetchAndParseBsbData (could be fetch OR parse rejection):', error);
             _parsedBsbData = null;
             _translationName = "[Error Loading]";
             throw error; // Re-throw to be caught by initializeApp
        }
    }


    /**
     * Retrieves verse text from the parsed BSB data (_parsedBsbData).
     * Performs ONLY basic normalization for lookup.
     * @param {string} refString - The reference string (e.g., "Micah 5:2", "Psalms 16:10").
     * @returns {string} - The verse text or an error/not found message.
     */
    function getVerseText(refString) {
        if (!_parsedBsbData) return "[BSB Data Not Ready]";
        if (!refString) return "[N/A]";

        try {
            // Handle comma refs (take first part) and optional range
             let cleanRef = refString.trim();
             const commaIndex = cleanRef.indexOf(',');
             if (commaIndex !== -1) {
                 console.warn(`DATA_FETCHER: Comma detected in ref "${refString}", using only first part: "${cleanRef.substring(0, commaIndex).trim()}"`);
                 cleanRef = cleanRef.substring(0, commaIndex).trim();
             }
            const match = cleanRef.match(/^(\d?\s?[A-Za-z]+(?:\s[A-Za-z]+)*)\s?(\d+):(\d+)(?:-(\d+))?$/);
            if (!match) {
               console.warn(`DATA_FETCHER: Could not parse reference: ${refString}`);
               return `[Invalid Ref Format: ${refString}]`;
            }

            // --- Simple Normalization for Lookup ---
            let bookName = match[1].toLowerCase().replace(/\s+/g, '');
            const chapterNum = match[2];
            const verseNum = match[3];   // START VERSE
            // --- End Simple Normalization ---

            // --- Diagnostic Log ---
            console.log(`DATA_FETCHER: Attempting lookup for book key: '${bookName}', chapter: '${chapterNum}', verse: '${verseNum}'`);
            if (!_parsedBsbData[bookName]) {
                console.error(`DATA_FETCHER ERROR: Book key '${bookName}' NOT FOUND.`);
                console.log("DATA_FETCHER: Available keys sample:", Object.keys(_parsedBsbData).slice(0, 66));
                return `[Book Key Not Found: ${bookName}]`;
            }
            // Add further checks if needed...
            if (!_parsedBsbData[bookName]?.[chapterNum]?.[verseNum]) {
                 console.error(`DATA_FETCHER ERROR: Chapter '${chapterNum}' or Verse '${verseNum}' NOT FOUND for book '${bookName}'.`);
                return `[Verse/Chapter Not Found: ${refString}]`;
            }
            // --- End Diagnostic Log ---

            // Lookup
            let text = _parsedBsbData[bookName][chapterNum][verseNum];
            if (match[4] || commaIndex !== -1) { text += ` [...]`; } // Indicate truncation
            return text; // SUCCESS

        } catch (e) {
            console.error(`DATA_FETCHER: Error processing reference "${refString}":`, e);
            return `[Lookup Error]`;
        }
    }

    // --- Expose Public Interface ---
    return {
        fetchManifest: fetchManifest,
        fetchAndParseBsbData: fetchAndParseBsbData, // Expose combined fetch & parse action
        getVerseText: getVerseText,
        getAvailableCategories: function() { return [..._availableCategories]; }, // Return copy
        isBsbDataReady: function() { return !!_parsedBsbData; }, // Check if parsing succeeded
        getTranslationName: function() { return _translationName; } // Getter for name
    };
})();
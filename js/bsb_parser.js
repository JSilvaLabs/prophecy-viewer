/**
 * bsb_parser.js - Handles parsing and indexing BSB JSON data.
 * Uses a mapping object for robust book name normalization.
 * Part of ProphecyApp namespace.
 */

// Initialize the namespace object if it doesn't exist
var ProphecyApp = ProphecyApp || {};

ProphecyApp.bsbParser = (function() {

    // --- Book Name Mapping for Standardization ---
    // Maps variations found in BSB.json (after lower/no-space) TO standard keys used for lookup
    const bookNameMappings = {
        // Add variations found in YOUR BSB.json name fields here -> map to standard key
        'psalms': 'psalms',
        'songofsongs': 'songofsongs', // Keep consistent if ref uses this
        'songofsolomon': 'songofsongs', // Map variation to standard
        'revelationofjohn': 'revelation',
        // Numbered Books (assuming BSB.json uses Roman numerals or spelled out first/second)
        'isamuel': '1samuel',
        'firstsamuel': '1samuel',
        'iisamuel': '2samuel',
        'secondsamuel': '2samuel',
        'ikings': '1kings',
        'firstkings': '1kings',
        'iikings': '2kings',
        'secondkings': '2kings',
        'ichronicles': '1chronicles',
        'firstchronicles': '1chronicles',
        'iichronicles': '2chronicles',
        'secondchronicles': '2chronicles',
        'icorinthians': '1corinthians',
        'firstcorinthians': '1corinthians',
        'iicorinthians': '2corinthians',
        'secondcorinthians': '2corinthians',
        'ithessalonians': '1thessalonians',
        'firstthessalonians': '1thessalonians',
        'iithessalonians': '2thessalonians',
        'secondthessalonians': '2thessalonians',
        'itimothy': '1timothy',
        'firsttimothy': '1timothy',
        'iitimothy': '2timothy',
        'secondtimothy': '2timothy',
        'ipeter': '1peter',
        'firstpeter': '1peter',
        'iipeter': '2peter',
        'secondpeter': '2peter',
        'ijohn': '1john',
        'firstjohn': '1john',
        'iijohn': '2john',
        'secondjohn': '2john',
        'iiijohn': '3john',
        'thirdjohn': '3john'
        // Add more mappings if needed based on your BSB.json analysis
    };

    /**
     * Parses and indexes the raw BSB JSON data.
     * @param {object} jsonData - The raw JSON data from BSB.json.
     * @returns {object} - The indexed BSB data object.
     * @throws {Error} - If parsing fails or data is invalid.
     */
    function parseAndIndexBsbData(jsonData) {
        console.log("BSB_PARSER: Starting BSB parsing and indexing...");
        const startTime = performance.now();
        try {
            const indexedBsb = {};
            if (!jsonData || !Array.isArray(jsonData.books)) {
                throw new Error("BSB_PARSER Error: Invalid BSB JSON structure: 'books' array not found.");
            }
            console.log(`BSB_PARSER: Found ${jsonData.books.length} books in BSB data.`);

            jsonData.books.forEach((book, bookArrayIndex) => {
                 if (!book || typeof book.name !== 'string') {
                      console.warn(`BSB_PARSER: Skipping book at index ${bookArrayIndex} due to missing or invalid name.`);
                      return;
                 }

                // Normalize book name from BSB.json
                let rawBookKey = book.name.toLowerCase().replace(/\s+/g, '');
                // Standardize using the mapping object, default to raw key if no map found
                let finalBookKey = bookNameMappings[rawBookKey] || rawBookKey;

                console.log(`BSB_PARSER: Indexing book: Original='${book.name}', RawKey='${rawBookKey}', FinalKey='${finalBookKey}'`);

                const bookIndex = {};
                 if (!Array.isArray(book.chapters)) return; // Skip book if no chapters

                book.chapters.forEach((chapter, chapterArrayIndex) => {
                     if (typeof chapter.chapter !== 'number' || !Array.isArray(chapter.verses)) return; // Skip chapter
                    const chapterNum = chapter.chapter.toString();
                    const chapterIndex = {};
                    chapter.verses.forEach((verse, verseArrayIndex) => {
                         if (typeof verse.verse === 'number' && typeof verse.text === 'string') {
                            chapterIndex[verse.verse.toString()] = verse.text.trim();
                        }
                    });
                    if(Object.keys(chapterIndex).length > 0) bookIndex[chapterNum] = chapterIndex;
                });

                 if(Object.keys(bookIndex).length > 0){
                     indexedBsb[finalBookKey] = bookIndex; // Use the FINAL standardized key
                 }
            });

            if (Object.keys(indexedBsb).length === 0) {
                throw new Error("BSB_PARSER Error: No valid book data found after processing BSB.json.");
            }

            const endTime = performance.now();
            console.log(`BSB_PARSER: BSB data parsed and indexed successfully in ${endTime - startTime} ms.`);
            console.log("BSB_PARSER: Final Indexed Keys (sample):", Object.keys(indexedBsb).slice(0, 66));
            return indexedBsb; // Return the created index

        } catch (error) {
            console.error('BSB_PARSER: Error during parseAndIndexBsbData execution:', error);
            // Re-throw error to be caught by data_fetcher
            throw new Error(`Failed to process BSB data: ${error.message}`);
        }
    }

    // Expose only the parsing function
    return {
        parseAndIndexBsbData: parseAndIndexBsbData
    };
})();
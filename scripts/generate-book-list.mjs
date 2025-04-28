// scripts/generate-book-list.mjs
import fs from 'fs/promises';
import path from 'path';

// --- Configuration ---
const projectRoot = process.cwd();
// We use covers as the source of truth for metadata (title, author, year)
const COVERS_DIRECTORY = path.join(projectRoot, 'public/covers');
const PUBLIC_COVERS_URL_PATH = '/covers'; // Base URL path for cover images
const PDF_URL_MAPPING_FILE = path.join(projectRoot, 'pdf-url-mappings.json'); // Path to your mapping JSON
const OUTPUT_DATA_DIR = path.join(projectRoot, 'src/data'); // Output directory
const OUTPUT_FILE = path.join(OUTPUT_DATA_DIR, 'books.json'); // Output JSON file
// --- End Configuration ---

// --- Parsing Function (remains the same) ---
function parseFilename(filenameWithoutExt) {
  const parts = filenameWithoutExt.split(' - ');
  if (parts.length >= 3) {
    const yearStr = parts[0].trim();
    const authorStr = parts[1].trim();
    const titleStr = parts.slice(2).join(' - ').trim();
    const year = parseInt(yearStr, 10);
    if (!isNaN(year) && yearStr.length === 4) {
      return { year: year, author: authorStr || 'Unknown Author', title: titleStr || 'Untitled' };
    }
  }
  console.warn(`[Build Script] Could not parse filename format: "${filenameWithoutExt}". Using fallback.`);
  const fallbackTitle = filenameWithoutExt.replace(/[_-]/g, ' ');
  return { title: fallbackTitle || 'Untitled', author: 'Unknown Author', year: undefined };
}

// Helper to check file existence (still useful for covers)
async function checkFileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Main generation function
async function generateBookData() {
  console.log('[Build Script] Starting book data generation using covers and PDF URL mapping...');

  // 1. Load the PDF URL mapping
  let pdfUrlMap = {};
  try {
    const mappingContent = await fs.readFile(PDF_URL_MAPPING_FILE, 'utf8');
    pdfUrlMap = JSON.parse(mappingContent);
    console.log(`[Build Script] Successfully loaded ${Object.keys(pdfUrlMap).length} entries from ${PDF_URL_MAPPING_FILE}`);
  } catch (error) {
    console.error(`[Build Script] Error reading or parsing PDF URL mapping file (${PDF_URL_MAPPING_FILE}):`, error);
    // Decide if you want to exit or continue with an empty map
    // process.exit(1); // Exit if mapping is crucial
    console.warn('[Build Script] Proceeding without PDF URL mapping data.');
  }

  let books = [];
  try {
    // 2. Read the COVERS directory to get base metadata
    const coverFilenames = await fs.readdir(COVERS_DIRECTORY);
    const possibleCoverExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    // --- DEBUG: Log all keys from the mapping for comparison ---
    console.log('[Debug] Keys loaded from pdf-url-mappings.json:');
    Object.keys(pdfUrlMap).forEach(key => console.log(`  - |${key}| (Length: ${key.length})`));
    // --- END DEBUG ---

    const bookPromises = coverFilenames
      // Filter for actual image files based on extensions
      .filter(filename =>
        possibleCoverExtensions.some(ext => filename.toLowerCase().endsWith(ext))
      )
      .map(async (coverFilename) => {
        // Extract the base name (e.g., "YYYY - Author - Title") from the cover filename
        const extension = path.extname(coverFilename);
        const baseName = coverFilename.replace(new RegExp(`\\${extension}$`, 'i'), '');

        // Parse the base name to get title, author, year
        const parsed = parseFilename(baseName);

        // 3. Look up the title in the PDF URL map
        // IMPORTANT: Assumes the key in pdf-url-mappings.json EXACTLY matches parsed.title
        const pdfUrl = pdfUrlMap[parsed.title];

        // 4. Filter out books without a valid, non-empty URL
        if (!pdfUrl || pdfUrl.trim() === "") {
          // console.log(`[Build Script] Skipping "${parsed.title}" - No valid PDF URL found in mapping.`);
          return null; // Signal to filter this book out
        }

        // Construct the cover image URL (local path)
        const coverImageUrl = `${PUBLIC_COVERS_URL_PATH}/${encodeURIComponent(coverFilename)}`;

        // Use the cover filename (without ext) or another unique identifier if needed
        const id = baseName; // Use baseName as a unique ID for the list item key

        return {
          id: id,
          title: parsed.title,
          author: parsed.author,
          year: parsed.year,
          coverImageUrl: coverImageUrl, // Local cover URL
          pdfUrl: pdfUrl,             // External PDF URL from mapping
        };
      });

    const booksWithNulls = await Promise.all(bookPromises);
    books = booksWithNulls.filter(book => book !== null); // Filter out nulls (books without URLs)

    console.log(`[Build Script] Generated data for ${books.length} books with valid PDF URLs.`);

  } catch (error) {
    console.error(`[Build Script] Error reading covers directory (${COVERS_DIRECTORY}):`, error);
    if (error.code === 'ENOENT') {
       console.warn(`[Build Script] Covers directory not found at: ${COVERS_DIRECTORY}. Ensure it exists and contains cover images.`);
    }
  }

  // 5. Ensure output directory exists and write the filtered data
  try {
    await fs.mkdir(OUTPUT_DATA_DIR, { recursive: true });
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(books, null, 2)); // Pretty print JSON
    console.log(`[Build Script] Successfully wrote filtered book data to ${OUTPUT_FILE}`);
  } catch (writeError) {
    console.error(`[Build Script] Failed to write book data to ${OUTPUT_FILE}:`, writeError);
    process.exit(1); // Exit if writing fails
  }
}

// Execute the generation
generateBookData();

// scripts/generate-book-list.mjs
import fs from 'fs/promises';
import path from 'path';

// Define paths relative to the script location or use process.cwd() consistently
const projectRoot = process.cwd();
const BOOKS_DIRECTORY = path.join(projectRoot, 'public/books');
const COVERS_DIRECTORY = path.join(projectRoot, 'public/covers');
const PUBLIC_COVERS_URL_PATH = '/covers';
const OUTPUT_DATA_DIR = path.join(projectRoot, 'src/data'); // Output directory
const OUTPUT_FILE = path.join(OUTPUT_DATA_DIR, 'books.json'); // Output JSON file

// --- Copy necessary functions from page.tsx ---

// Parsing Function
function parseFilename(filename) {
  const nameWithoutExt = filename.replace(/\.pdf$/i, '');
  const parts = nameWithoutExt.split(' - ');

  if (parts.length >= 3) {
    const yearStr = parts[0].trim();
    const authorStr = parts[1].trim();
    const titleStr = parts.slice(2).join(' - ').trim();
    const year = parseInt(yearStr, 10);

    if (!isNaN(year) && yearStr.length === 4) {
      return {
        year: year,
        author: authorStr || 'Unknown Author',
        title: titleStr || 'Untitled',
      };
    }
  }
  // Keep the warning server-side during build is fine
  console.warn(`[Build Script] Could not parse filename format: "${filename}". Using fallback.`);
  const fallbackTitle = nameWithoutExt.replace(/[_-]/g, ' ');
  return {
    title: fallbackTitle || 'Untitled',
    author: 'Unknown Author',
    year: undefined,
  };
}

// Helper to check file existence
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
  console.log('[Build Script] Starting book data generation...');
  let books = [];
  try {
    const filenames = await fs.readdir(BOOKS_DIRECTORY);
    const possibleExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    const bookPromises = filenames
      .filter(filename => filename.toLowerCase().endsWith('.pdf'))
      .map(async (filename) => {
        const parsed = parseFilename(filename);
        const baseName = filename.replace(/\.pdf$/i, '');
        let coverImageUrl = undefined;

        for (const ext of possibleExtensions) {
          const coverFilename = `${baseName}${ext}`;
          const coverFilePath = path.join(COVERS_DIRECTORY, coverFilename);
          if (await checkFileExists(coverFilePath)) {
            coverImageUrl = `${PUBLIC_COVERS_URL_PATH}/${encodeURIComponent(coverFilename)}`; // Ensure filename is URL-safe
            break;
          }
        }

        // Skip books with bad parsing if desired (optional)
        // if (!parsed.title || parsed.title === 'Untitled' || !parsed.author || parsed.author === 'Unknown Author') {
        //     console.warn(`[Build Script] Skipping book due to parsing issues: ${filename}`);
        //     return null;
        // }

        return {
          id: filename, // Keep original filename as ID
          title: parsed.title,
          author: parsed.author,
          year: parsed.year,
          coverImageUrl: coverImageUrl,
        };
      });

    const booksWithNulls = await Promise.all(bookPromises);
    books = booksWithNulls.filter(book => book !== null); // Filter out nulls if skipping enabled

    console.log(`[Build Script] Found ${books.length} valid books.`);

  } catch (error) {
    console.error(`[Build Script] Error reading books directory (${BOOKS_DIRECTORY}):`, error);
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
       console.warn(`[Build Script] Books directory not found at: ${BOOKS_DIRECTORY}. Ensure it exists.`);
       // Check covers directory existence as well
       try { await fs.access(COVERS_DIRECTORY); } catch { /* Ignore */ }
    }
    // Even if there's an error, proceed to write an empty array or handle as needed
  }

  // Ensure output directory exists
  try {
    await fs.mkdir(OUTPUT_DATA_DIR, { recursive: true });
  } catch (dirError) {
    console.error(`[Build Script] Failed to create data directory ${OUTPUT_DATA_DIR}:`, dirError);
    process.exit(1); // Exit if we can't create the directory
  }

  // Write the data to JSON file
  try {
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(books, null, 2)); // Pretty print JSON
    console.log(`[Build Script] Successfully wrote book data to ${OUTPUT_FILE}`);
  } catch (writeError) {
    console.error(`[Build Script] Failed to write book data to ${OUTPUT_FILE}:`, writeError);
    process.exit(1); // Exit if writing fails
  }
}

// Execute the generation
generateBookData();

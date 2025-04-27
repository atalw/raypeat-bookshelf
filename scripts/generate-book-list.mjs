// scripts/generate-book-list.mjs
import fs from 'fs/promises';
import path from 'path';

// Define paths relative to the script location or use process.cwd() consistently
const projectRoot = process.cwd();
// We no longer need BOOKS_DIRECTORY as the source
// const BOOKS_DIRECTORY = path.join(projectRoot, 'public/books');
const COVERS_DIRECTORY = path.join(projectRoot, 'public/covers');
const PUBLIC_COVERS_URL_PATH = '/covers';
const OUTPUT_DATA_DIR = path.join(projectRoot, 'src/data'); // Output directory
const OUTPUT_FILE = path.join(OUTPUT_DATA_DIR, 'books.json'); // Output JSON file

// --- Vercel Blob Base URL ---
const VERCEL_BLOB_BASE_URL = 'https://p4muoghpohrnxw2p.public.blob.vercel-storage.com/';

// --- Parsing Function (remains the same) ---
function parseFilename(filenameWithoutExt) {
  // const nameWithoutExt = filename.replace(/\.pdf$/i, ''); // No longer needed
  const parts = filenameWithoutExt.split(' - ');

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
  console.warn(`[Build Script] Could not parse filename format: "${filenameWithoutExt}". Using fallback.`);
  const fallbackTitle = filenameWithoutExt.replace(/[_-]/g, ' ');
  return {
    title: fallbackTitle || 'Untitled',
    author: 'Unknown Author',
    year: undefined,
  };
}

// Helper to check file existence (still useful for sanity checks if needed, but not core logic now)
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
  console.log('[Build Script] Starting book data generation using cover images as source...');
  let books = [];
  try {
    // Read the COVERS directory instead of the books directory
    const coverFilenames = await fs.readdir(COVERS_DIRECTORY);
    const possibleCoverExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    const bookPromises = coverFilenames
      // Filter for actual image files based on extensions
      .filter(filename =>
        possibleCoverExtensions.some(ext => filename.toLowerCase().endsWith(ext))
      )
      .map(async (coverFilename) => {
        // Extract the base name (e.g., "YYYY - Author - Title") from the cover filename
        const extension = path.extname(coverFilename); // Gets ".jpg", ".png", etc.
        const baseName = coverFilename.replace(new RegExp(`\\${extension}$`, 'i'), ''); // Remove extension

        // Parse the base name
        const parsed = parseFilename(baseName);

        // Construct the cover image URL (local path)
        const coverImageUrl = `${PUBLIC_COVERS_URL_PATH}/${encodeURIComponent(coverFilename)}`; // Ensure filename is URL-safe

        // Construct the PDF filename and its Vercel Blob URL
        const pdfFilename = `${baseName}.pdf`;
        const pdfUrl = `${VERCEL_BLOB_BASE_URL}${encodeURIComponent(pdfFilename)}`; // Construct the full Blob URL

        // We don't need to check for cover file existence here anymore,
        // because we are iterating through the files that *do* exist in the covers directory.

        // Skip books with bad parsing if desired (optional)
        // if (!parsed.title || parsed.title === 'Untitled' || !parsed.author || parsed.author === 'Unknown Author') {
        //     console.warn(`[Build Script] Skipping book due to parsing issues: ${coverFilename}`);
        //     return null;
        // }

        return {
          id: pdfFilename, // Use the derived PDF filename as a unique ID
          title: parsed.title,
          author: parsed.author,
          year: parsed.year,
          coverImageUrl: coverImageUrl, // Local cover URL
          pdfUrl: pdfUrl,             // Vercel Blob PDF URL
        };
      });

    const booksWithNulls = await Promise.all(bookPromises);
    books = booksWithNulls.filter(book => book !== null); // Filter out nulls if skipping enabled

    console.log(`[Build Script] Generated data for ${books.length} books based on cover images.`);

  } catch (error) {
    console.error(`[Build Script] Error reading covers directory (${COVERS_DIRECTORY}):`, error);
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
       console.warn(`[Build Script] Covers directory not found at: ${COVERS_DIRECTORY}. Ensure it exists and contains cover images.`);
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

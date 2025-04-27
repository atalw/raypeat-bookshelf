// src/app/page.tsx
import { BookGridClient } from '@/components/book-grid-client';
import { Book } from '@/components/book-card';
import fs from 'fs/promises'; // Make sure fs.promises is imported
import path from 'path';

const BOOKS_DIRECTORY = path.join(process.cwd(), 'public/books');
const COVERS_DIRECTORY = path.join(process.cwd(), 'public/covers'); // Define covers directory path
const PUBLIC_COVERS_URL_PATH = '/covers'; // Public URL path

// --- Parsing Function (keep as is) ---
interface ParsedFilename {
  title: string;
  author: string;
  year?: number;
}
function parseFilename(filename: string): ParsedFilename {
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

  console.warn(`Could not parse filename format: "${filename}". Using fallback.`);
  const fallbackTitle = nameWithoutExt.replace(/[_-]/g, ' ');
  return {
    title: fallbackTitle || 'Untitled',
    author: 'Unknown Author',
    year: undefined,
  };
}
// --- End Parsing Function ---

// --- Helper to check file existence ---
async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// --- getBooksFromDirectory Function (UPDATED) ---
async function getBooksFromDirectory(): Promise<Book[]> {
  try {
    const filenames = await fs.readdir(BOOKS_DIRECTORY);
    const possibleExtensions = ['.jpg', '.jpeg', '.png', '.webp']; // Common image extensions

    const bookPromises = filenames
      .filter(filename => filename.toLowerCase().endsWith('.pdf'))
      .map(async (filename): Promise<Book | null> => { // Return Promise<Book | null>
        const parsed = parseFilename(filename);
        const baseName = filename.replace(/\.pdf$/i, '');
        let coverImageUrl: string | undefined = undefined;

        // Check for corresponding cover image
        for (const ext of possibleExtensions) {
          const coverFilename = `${baseName}${ext}`;
          const coverFilePath = path.join(COVERS_DIRECTORY, coverFilename);
          if (await checkFileExists(coverFilePath)) {
            coverImageUrl = `${PUBLIC_COVERS_URL_PATH}/${coverFilename}`; // Construct public URL
            break; // Found one, stop checking
          }
        }

        // Basic validation - ensure title and author were parsed reasonably
        if (!parsed.title || parsed.title === 'Untitled' || !parsed.author || parsed.author === 'Unknown Author') {
            // Optionally log a more specific warning if parsing failed badly
            // console.warn(`Skipping book due to parsing issues: ${filename}`);
            // return null; // Or decide how to handle poorly parsed files
        }


        return {
          id: filename,
          title: parsed.title,
          author: parsed.author,
          year: parsed.year,
          coverImageUrl: coverImageUrl, // Add the found URL
        };
      });

    // Wait for all checks and mappings to complete
    const booksWithNulls = await Promise.all(bookPromises);
    const books = booksWithNulls.filter((book): book is Book => book !== null); // Filter out any nulls if added validation

    // No sorting here - handled by client component
    return books;
  } catch (error) {
    console.error(`Error reading books directory (${BOOKS_DIRECTORY}):`, error);
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
       console.warn(`Books directory not found at: ${BOOKS_DIRECTORY}. Please create it and add PDF files.`);
       // Also check/warn for covers directory
       try {
           await fs.access(COVERS_DIRECTORY);
       } catch (coverError) {
           if (coverError instanceof Error && 'code' in coverError && coverError.code === 'ENOENT') {
               console.warn(`Covers directory not found at: ${COVERS_DIRECTORY}. Please create it to add cover images.`);
           }
       }
    }
    return [];
  }
}
// --- End getBooksFromDirectory Function ---


// This remains an async Server Component
export default async function HomePage() {
  // Fetch the raw, unsorted book data (now includes coverImageUrl)
  const allBooks = await getBooksFromDirectory();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center sm:text-left">Ray Peat's Bookshelf</h1>

      {allBooks.length > 0 ? (
        // Render the Client Component and pass the unsorted books to it
        <BookGridClient initialBooks={allBooks} />
      ) : (
        // Display message if no books were found initially
        <p className="text-center text-muted-foreground">
          Your bookshelf is empty. Add PDF files (e.g., "YYYY - Author Name - Book Title.pdf") to the '{path.relative(process.cwd(), BOOKS_DIRECTORY)}' directory. You can also add corresponding cover images (e.g., "YYYY - Author Name - Book Title.jpg") to the '{path.relative(process.cwd(), COVERS_DIRECTORY)}' directory.
        </p>
      )}
    </main>
  );
}


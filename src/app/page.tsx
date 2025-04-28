// src/app/page.tsx
import { BookGridClient } from '@/components/book-grid-client';
import { Analytics } from "@vercel/analytics/react"
// The Book type might now be better defined centrally or imported from the client component if not used elsewhere server-side
// import { Book } from '@/components/book-card';
import path from 'path'; // Keep path only for the "empty" message if needed

// Import the generated JSON data
// Make sure tsconfig allows resolving json modules ( "resolveJsonModule": true )
import allBooks from '@/data/books.json';

// Define paths just for the fallback message
const BOOKS_DIRECTORY_RELATIVE = path.relative(process.cwd(), path.join(process.cwd(), 'public/books'));
const COVERS_DIRECTORY_RELATIVE = path.relative(process.cwd(), path.join(process.cwd(), 'public/covers'));


// This is now a standard Server Component, NOT async
export default function HomePage() {
  // Data comes directly from the imported JSON

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center sm:text-left">Ray Peat's Bookshelf</h1>

      {allBooks.length > 0 ? (
        // Render the Client Component and pass the imported books to it
        // Ensure BookGridClientProps expects Book[] matching the JSON structure
        <BookGridClient initialBooks={allBooks} />
      ) : (
        // Display message if no books were found during build
        <p className="text-center text-muted-foreground">
          Your bookshelf is empty. Add PDF files (e.g., "YYYY - Author Name - Book Title.pdf") to the &apos;{BOOKS_DIRECTORY_RELATIVE}&apos; directory. You can also add corresponding cover images (e.g., "YYYY - Author Name - Book Title.jpg") to the &apos;{COVERS_DIRECTORY_RELATIVE}&apos; directory.
          <br /> (Run the build again after adding files).
        </p>
      )}
      <Analytics />
    </main>
  );
}

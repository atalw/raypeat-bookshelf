// src/components/book-card.tsx
import Link from 'next/link';
import Image from 'next/image'; // Import next/image
import { BookText } from 'lucide-react'; // Import an icon for fallback

// Define the Book interface (or import it if defined centrally)
// Make sure this interface matches the structure in src/data/books.json
export interface Book {
  id: string; // filename used as id (e.g., "YYYY - Author - Title.pdf")
  title: string;
  author: string;
  year?: number;
  coverImageUrl?: string; // Optional local cover image URL (e.g., /covers/...)
  pdfUrl: string;         // The full URL to the PDF on Vercel Blob
}

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  // No longer need to construct pdfPath locally
  // const pdfPath = `/books/${book.id}`;

  // Use the pdfUrl directly from the book data
  const pdfLinkHref = book.pdfUrl;

  return (
    // Use the pdfLinkHref for the Link component
    <Link href={pdfLinkHref} target="_blank" rel="noopener noreferrer" className="group block">
      {/* Removed aspect-square from here, apply to image container if needed */}
      <div className="border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 bg-card text-card-foreground overflow-hidden flex flex-col h-full">

        {/* Image Container */}
        <div className="relative w-full aspect-square bg-muted overflow-hidden"> {/* aspect-square here makes the image area square */}
          {book.coverImageUrl ? (
            <Image
              src={book.coverImageUrl} // This remains the local path to the cover
              alt={`Cover for ${book.title}`}
              fill // Use fill to cover the container
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw" // Help browser optimize image loading
              className="object-cover transition-transform duration-300 group-hover:scale-105" // Cover the area, zoom on hover
              priority={false} // Set to true for images above the fold if needed
              // Optional: Add onError for more specific fallback handling if needed
              // onError={(e) => { e.currentTarget.style.display = 'none'; /* Hide broken image */ }}
            />
          ) : (
            // Fallback content if no image URL
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
               <BookText className="h-1/3 w-1/3 opacity-50" /> {/* Simple fallback icon */}
            </div>
          )}
        </div>

        {/* Text Content Area */}
        <div className="p-3 flex flex-col flex-grow justify-between"> {/* flex-grow allows this section to take remaining space */}
          {/* Top section for Title and Author */}
          <div>
            <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-3 group-hover:line-clamp-none">
              {book.title}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {book.author}
            </p>
          </div>

          {/* Bottom section for Year (optional) */}
          {book.year && (
            <p className="text-xs text-muted-foreground mt-auto text-right pt-1">
              {book.year}
            </p>
          )}
        </div>

      </div>
    </Link>
  );
}

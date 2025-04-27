// src/components/book-grid-client.tsx
"use client";

import { useState, useMemo, ChangeEvent, useRef, useEffect } from 'react'; // Added useRef, useEffect
import { BookCard, Book } from '@/components/book-card';
import { Search, X } from 'lucide-react'; // Import an icon for the button

// --- Sort State Definitions (keep as is) ---
type SortState = 'year_desc' | 'year_asc' | 'title_asc' | 'title_desc';
const sortLabels: Record<SortState, string> = {
  year_desc: 'Year (Newest)',
  year_asc: 'Year (Oldest)',
  title_asc: 'Title (A-Z)',
  title_desc: 'Title (Z-A)',
};
const sortCycle: SortState[] = ['year_desc', 'year_asc', 'title_asc', 'title_desc'];
// --- End Sort State Definitions ---

interface BookGridClientProps {
  initialBooks: Book[];
}

// --- sortBooks Helper Function (keep as is) ---
const sortBooks = (booksToSort: Book[], criteria: SortState): Book[] => {
  const sorted = [...booksToSort]; // Shallow copy
  switch (criteria) {
    case 'year_desc':
      sorted.sort((a, b) => {
        if (a.year && b.year) {
          if (b.year !== a.year) return b.year - a.year;
        } else if (a.year) return -1;
        else if (b.year) return 1;
        return a.title.localeCompare(b.title);
      });
      break;
    case 'year_asc':
      sorted.sort((a, b) => {
        if (a.year && b.year) {
          if (a.year !== b.year) return a.year - b.year;
        } else if (a.year) return -1;
        else if (b.year) return 1;
        return a.title.localeCompare(b.title);
      });
      break;
    case 'title_asc':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'title_desc':
      sorted.sort((a, b) => b.title.localeCompare(a.title));
      break;
  }
  return sorted;
};
// --- End sortBooks Helper Function ---

export function BookGridClient({ initialBooks }: BookGridClientProps) {
  // State for sorting
  const [sortState, setSortState] = useState<SortState>('year_desc');
  // State for the search query
  const [searchQuery, setSearchQuery] = useState<string>('');
  // State to control search input visibility
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  // Ref for the search input element
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Memoize the filtered and sorted books
  const displayedBooks = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    const filteredBooks = lowerCaseQuery
      ? initialBooks.filter(book =>
          book.title.toLowerCase().includes(lowerCaseQuery) ||
          book.author.toLowerCase().includes(lowerCaseQuery) ||
          (book.year && book.year.toString().includes(lowerCaseQuery))
        )
      : initialBooks;
    return sortBooks(filteredBooks, sortState);
  }, [initialBooks, sortState, searchQuery]);

  // Handler to cycle sort state
  const handleSortCycle = () => {
    const currentIndex = sortCycle.indexOf(sortState);
    const nextIndex = (currentIndex + 1) % sortCycle.length;
    setSortState(sortCycle[nextIndex]);
  };

  // Handler for search input changes
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Handler to show the search input
  const showSearchInput = () => {
    setIsSearchVisible(true);
  };

  // Handler to hide the search input and optionally clear it
  const hideSearchInput = (clearQuery = false) => {
    setIsSearchVisible(false);
    if (clearQuery) {
        setSearchQuery('');
    }
  };

  // Handler for input blur - hide the input
  const handleSearchBlur = () => {
      // Use a small timeout to allow other click events (like clear button) to register
      setTimeout(() => {
          // Check if the focus is still within a related element if needed,
          // but for simplicity, just hide it.
          // We might not hide if the query has text, depending on desired UX.
          // Let's hide it regardless for now.
          setIsSearchVisible(false);
      }, 150);
  };

  // Effect to focus the input when it becomes visible
  useEffect(() => {
    if (isSearchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchVisible]);

  return (
    <div>
      {/* Controls Row */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end items-center">

         {/* Search Area: Conditionally renders button or input */}
         <div className="relative w-full sm:w-auto"> {/* Container for positioning */}
            {isSearchVisible ? (
               <div className="relative flex items-center w-full">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                     ref={searchInputRef}
                     type="search"
                     placeholder="Search..."
                     value={searchQuery}
                     onChange={handleSearchChange}
                     onBlur={handleSearchBlur} // Hide when focus is lost
                     className="pl-8 pr-8 py-1 text-sm rounded border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full"
                     aria-label="Search books input"
                  />
                  {/* Optional: Clear button inside input */}
                  {searchQuery && (
                     <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="Clear search"
                     >
                        <X className="h-4 w-4"/>
                     </button>
                  )}
               </div>
            ) : (
               <button
                  onClick={showSearchInput}
                  className="px-3 py-1 text-sm rounded border bg-secondary text-secondary-foreground hover:bg-secondary/80 w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1"
                  aria-label="Open search input"
               >
                  <Search className="h-4 w-4" />
                  <span>Search</span>
               </button>
            )}
         </div>

         {/* Sort Button */}
         <button
            onClick={handleSortCycle}
            className="px-3 py-1 text-sm rounded border bg-secondary text-secondary-foreground hover:bg-secondary/80 whitespace-nowrap"
            aria-live="polite"
         >
            Sort by: {sortLabels[sortState]}
         </button>
      </div>

      {/* Grid */}
      {displayedBooks.length > 0 ? (
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
           {displayedBooks.map((book) => (
             <BookCard key={book.id} book={book} />
           ))}
         </div>
       ) : (
         <p className="text-center text-muted-foreground mt-6">
           {searchQuery ? `No books match your search "${searchQuery}".` : 'No books found.'}
         </p>
       )}
    </div>
  );
}

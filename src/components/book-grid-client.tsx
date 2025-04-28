// src/components/book-grid-client.tsx
"use client";

import { useState, useMemo, ChangeEvent, useRef, useEffect } from 'react';
import { BookCard, Book } from '@/components/book-card';
// Import icons and Shadcn components
import { Search, X, ArrowUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button"; // Shadcn Button
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Shadcn Dropdown

// --- Sort State Definitions (remain the same) ---
type SortState =
  | 'title_asc'
  | 'title_desc'
  | 'author_asc'
  | 'author_desc'
  | 'year_desc'
  | 'year_asc';

const sortLabels: Record<SortState, string> = {
  title_asc: 'Title (A-Z)',
  title_desc: 'Title (Z-A)',
  author_asc: 'Author (A-Z)',
  author_desc: 'Author (Z-A)',
  year_desc: 'Year (Newest)',
  year_asc: 'Year (Oldest)',
};

const sortOptions: SortState[] = [
    'title_asc',
    'title_desc',
    'author_asc',
    'author_desc',
    'year_desc',
    'year_asc',
];
// --- End Sort State Definitions ---

interface BookGridClientProps {
  initialBooks: Book[];
}

// --- sortBooks Helper Function (remains the same) ---
const sortBooks = (booksToSort: Book[], criteria: SortState): Book[] => {
  const sorted = [...booksToSort]; // Shallow copy
  switch (criteria) {
    case 'title_asc':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'title_desc':
      sorted.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case 'author_asc':
      sorted.sort((a, b) => a.author.localeCompare(b.author));
      break;
    case 'author_desc':
      sorted.sort((a, b) => b.author.localeCompare(a.author));
      break;
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
  }
  return sorted;
};
// --- End sortBooks Helper Function ---

export function BookGridClient({ initialBooks }: BookGridClientProps) {
  // State (remains the same)
  const [sortState, setSortState] = useState<SortState>('year_desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Memoization (remains the same)
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

  // Handlers and Effects (remain the same)
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  const showSearchInput = () => {
    setIsSearchVisible(true);
  };
  const handleSearchBlur = () => {
      setTimeout(() => {
          setIsSearchVisible(false);
      }, 150);
  };
  useEffect(() => {
    if (isSearchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchVisible]);

  return (
    <div>
      {/* Controls Row */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end items-center">

         {/* Search Area (remains the same) */}
         <div className="relative w-full sm:w-auto">
            {isSearchVisible ? (
               <div className="relative flex items-center w-full">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                     ref={searchInputRef}
                     type="search"
                     placeholder="Search..."
                     value={searchQuery}
                     onChange={handleSearchChange}
                     onBlur={handleSearchBlur}
                     className="pl-8 pr-8 py-1 text-sm rounded border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-full"
                     aria-label="Search books input"
                  />
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
               <Button
                  variant="outline"
                  size="sm"
                  onClick={showSearchInput}
                  className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1"
                  aria-label="Open search input"
               >
                  <Search className="h-4 w-4" />
                  <span>Search</span>
               </Button>
            )}
         </div>

         {/* Sort Dropdown */}
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto justify-between">
                Sort by: {sortLabels[sortState]}
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground"> 
              <DropdownMenuLabel>Sort Books By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortState} onValueChange={(value) => setSortState(value as SortState)}>
                {sortOptions.map((option) => (
                  <DropdownMenuRadioItem
                    key={option}
                    value={option}
                    // --- MODIFICATION HERE ---
                    // Remove pl-8 (padding for indicator)
                    // Add px-2 (general horizontal padding)
                    // Add data-state=checked styles for background/text
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
                    // --- END MODIFICATION ---
                  >
                    {/* The default bullet indicator is still rendered by Radix internally,
                        but without the pl-8 padding, it should be effectively hidden or irrelevant */}
                    {sortLabels[option]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
         {/* End Sort Dropdown */}

      </div>

      {/* Grid (remains the same) */}
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

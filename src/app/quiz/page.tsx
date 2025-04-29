// src/app/quiz/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation'; // Import useRouter
import React from 'react';

// Define difficulty levels explicitly matching JSON keys
type Difficulty = 'easy' | 'medium' | 'hard';

export default function SelectDifficultyPage() {
  const router = useRouter(); // Initialize router

  // Handler to navigate to the specific quiz page based on difficulty
  const handleDifficultySelect = (difficulty: Difficulty) => {
    router.push(`/quiz/${difficulty}`); // Navigate to /quiz/easy, /quiz/medium, or /quiz/hard
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl flex flex-col items-center justify-center min-h-[calc(100vh-150px)]"> {/* Center content vertically */}
      <h1 className="text-3xl font-bold mb-10 text-center">Ray Peat Knowledge Quiz</h1>

      {/* --- Difficulty Selection UI --- */}
      <div className="text-center space-y-6"> {/* Increased spacing */}
        <p className="text-xl font-medium">Choose your difficulty level:</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6"> {/* Stack vertically on small screens */}
          <Button onClick={() => handleDifficultySelect('easy')} variant="outline" size="lg" className="w-full sm:w-auto">
            Easy
          </Button>
          <Button onClick={() => handleDifficultySelect('medium')} variant="outline" size="lg" className="w-full sm:w-auto">
            Medium
          </Button>
          <Button onClick={() => handleDifficultySelect('hard')} variant="outline" size="lg" className="w-full sm:w-auto">
            Hard
          </Button>
        </div>
      </div>
    </main>
  );
}

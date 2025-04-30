// src/app/quiz/[difficulty]/page.tsx
"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import quizDataJson from '@/data/quiz-questions.json';
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Define difficulty levels explicitly matching JSON keys
type Difficulty = 'easy' | 'medium' | 'hard';

// Interfaces (same as before)
interface QuizOption { id: string; text: string; }
interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctAnswerId: string;
  explanation?: string;
  furtherReading?: string;
}
interface QuizData {
  easy: QuizQuestion[];
  medium: QuizQuestion[];
  hard: QuizQuestion[];
}

// Type assertion for the imported JSON data
const quizData: QuizData = quizDataJson as QuizData;

// Type for the answers state
type AnswersState = { [questionId: string]: string | undefined; };

// --- Define the expected props structure explicitly ---
interface QuizDifficultyPageProps {
  params: {
    difficulty: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}
// --- End props structure definition ---


// --- Use the explicit type and assert the incoming props ---
export default function QuizDifficultyPage(props: unknown) {
  const { params } = props as QuizDifficultyPageProps;

  const [answers, setAnswers] = useState<AnswersState>({});
  const [isValidDifficulty, setIsValidDifficulty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add submitting state
  const router = useRouter();
  const pageDifficulty = params.difficulty as Difficulty;

  // Validate the difficulty from the URL
  useEffect(() => {
    if (pageDifficulty && Object.keys(quizData).includes(pageDifficulty)) {
       setIsValidDifficulty(true);
    } else {
       setIsValidDifficulty(false);
    }
  }, [pageDifficulty]);

  // Get the array of questions based on the difficulty from the URL params
  const currentQuestions = useMemo(() => {
    if (!isValidDifficulty) return [];
    return quizData[pageDifficulty] || [];
  }, [pageDifficulty, isValidDifficulty]);

  // --- Event Handlers (remain the same) ---
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prevAnswers) => ({ ...prevAnswers, [questionId]: value }));
  };

  // --- Updated handleSubmit ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (currentQuestions.length === 0 || !isValidDifficulty || isSubmitting) return;

    setIsSubmitting(true); // Prevent double submission

    // --- Calculate Score ---
    let score = 0;
    const totalQuestions = currentQuestions.length;
    currentQuestions.forEach(q => {
      if (answers[q.id] && answers[q.id] === q.correctAnswerId) score++;
    });

    // --- Prepare Data for Logging and Results ---
    const resultData = {
      score,
      totalQuestions,
      userAnswers: answers,
      difficulty: pageDifficulty,
      questionIds: currentQuestions.map(q => q.id)
    };

    console.log("Quiz submitted. Preparing to log...");
    console.log("Data:", resultData);

    // --- Send Data to Logging API Route ---
    try {
      const response = await fetch('/api/log-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resultData), // Send the same data structure
      });

      if (!response.ok) {
        // Log error but continue to results page for the user
        console.error(`API log request failed with status: ${response.status}`);
        const errorData = await response.json().catch(() => ({})); // Try to get error details
        console.error('API log error details:', errorData);
      } else {
        console.log('API log request successful.');
      }
    } catch (error) {
      // Network errors or other issues with fetch
      console.error('Error sending log data to API:', error);
      // Continue to results page even if logging fails
    }
    // --- End Logging ---


    // --- Save to Session Storage and Navigate ---
    try {
      sessionStorage.setItem('quizResults', JSON.stringify(resultData));
      router.push('/quiz/results');
      // No need to setIsSubmitting(false) here as we are navigating away
    } catch (error) {
      console.error("Failed to save results to sessionStorage:", error);
      alert("Could not save quiz results locally. Please try again.");
      setIsSubmitting(false); // Allow retry if session storage fails
    }
    // --- End Session Storage and Navigation ---
  };
  // --- End Event Handlers ---

  // Render invalid state if needed
   if (!isValidDifficulty && pageDifficulty) {
     return (
        <main className="container mx-auto px-4 py-8 max-w-3xl text-center">
            <p className="text-red-500 font-semibold">Invalid difficulty level: '{params.difficulty}'</p>
            <Link href="/quiz" className="text-blue-600 hover:underline mt-4 inline-block">
                &larr; Choose Difficulty
            </Link>
        </main>
     );
   }

  // Main component rendering
  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Do you understand Ray Peat's work?</h1>
      <>
        <p className="text-center text-muted-foreground mb-8">
          Difficulty: <span className="font-semibold capitalize">{pageDifficulty}</span>. 20 questions, 10 minutes.
        </p>
        {currentQuestions.length > 0 ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            {currentQuestions.map((q, index) => (
              <div key={q.id} className="border-b pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0">
                <p className="font-semibold mb-4">
                  <span className="mr-2">{index + 1}.</span> {q.question}
                </p>
                {/* --- Updated RadioGroup Options --- */}
                <RadioGroup
                  value={answers[q.id]}
                  onValueChange={(value) => handleAnswerChange(q.id, value)}
                  className="space-y-1 pl-4" // Reduced space-y slightly
                >
                  {q.options.map((opt) => (
                    // Use Label as the container for the entire row
                    <Label
                      key={opt.id} // Key on the Label now
                      htmlFor={`q${q.id}-opt${opt.id}`} // Connect label to radio item
                      // Add styling to make the whole label clickable and visually responsive
                      className="flex items-center space-x-3 p-3 rounded-md hover:bg-accent cursor-pointer transition-colors" // Increased padding
                    >
                      <RadioGroupItem value={opt.id} id={`q${q.id}-opt${opt.id}`} />
                      <span className="text-sm font-medium leading-normal"> {/* Adjusted leading */}
                        {opt.text}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
                {/* --- End Updated RadioGroup Options --- */}
              </div>
            ))}
            <div className="text-center mt-10 space-x-4">
               <Link href="/quiz">
                 <Button type="button" variant="secondary">
                    Change Difficulty
                 </Button>
               </Link>
              <Button type="submit">Submit Answers</Button>
            </div>
          </form>
        ) : (
           isValidDifficulty && (
             <p className="text-center text-muted-foreground mt-10">
               No questions found for the selected difficulty ('{pageDifficulty}'). Please check the data file (`quiz-questions.json`).
               <Link href="/quiz" className="text-blue-600 hover:underline ml-2">Choose Difficulty</Link>
             </p>
           )
        )}
      </>
    </main>
  );
}

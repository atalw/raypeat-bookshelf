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

// Remove the separate 'Props' type alias if you still have it

// Use the standard inline type definition for page props in dynamic routes
export default function QuizDifficultyPage({
  params
}: {
  params: { difficulty: string };
  // searchParams?: { [key: string]: string | string[] | undefined }; // Optional: Add if needed, but often not required for the type constraint itself
}) {
  const [answers, setAnswers] = useState<AnswersState>({});
  const [isValidDifficulty, setIsValidDifficulty] = useState(false);
  const router = useRouter();
  // Get difficulty directly from the destructured params prop
  const pageDifficulty = params.difficulty as Difficulty;

  // Validate the difficulty from the URL
  useEffect(() => {
    // Check if pageDifficulty is one of the valid keys in quizData
    if (pageDifficulty && Object.keys(quizData).includes(pageDifficulty)) {
       setIsValidDifficulty(true);
    } else {
       setIsValidDifficulty(false);
    }
  }, [pageDifficulty]); // Dependency array is correct

  // Get the array of questions based on the difficulty from the URL params
  const currentQuestions = useMemo(() => {
    // Use the validated state
    if (!isValidDifficulty) return [];
    // Access data using the validated key
    return quizData[pageDifficulty] || [];
  }, [pageDifficulty, isValidDifficulty]); // Dependencies are correct

  // --- Event Handlers (remain the same) ---
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prevAnswers) => ({ ...prevAnswers, [questionId]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Check validity again before submitting
    if (currentQuestions.length === 0 || !isValidDifficulty) return;

    let score = 0;
    const totalQuestions = currentQuestions.length;
    currentQuestions.forEach(q => {
      if (answers[q.id] && answers[q.id] === q.correctAnswerId) score++;
    });

    console.log("Quiz submitted.");
    console.log("Selected Answers:", answers);
    console.log("Difficulty:", pageDifficulty);
    console.log("Score:", score, "/", totalQuestions);

    try {
      sessionStorage.setItem('quizResults', JSON.stringify({
        score,
        totalQuestions,
        userAnswers: answers,
        difficulty: pageDifficulty,
        questionIds: currentQuestions.map(q => q.id)
      }));
      router.push('/quiz/results');
    } catch (error) {
      console.error("Failed to save results to sessionStorage:", error);
      alert("Could not save quiz results. Please try again.");
    }
  };
  // --- End Event Handlers ---

  // Render invalid state if needed
   if (!isValidDifficulty && pageDifficulty) { // Only show error if pageDifficulty was accessed but invalid
     return (
        <main className="container mx-auto px-4 py-8 max-w-3xl text-center">
            <p className="text-red-500 font-semibold">Invalid difficulty level: '{params.difficulty}'</p>
            <Link href="/quiz" className="text-blue-600 hover:underline mt-4 inline-block">
                &larr; Choose Difficulty
            </Link>
        </main>
     );
   }
   // Optional: Add a loading state before useEffect validates
   // if (!pageDifficulty) { return <div>Loading...</div> }


  // Main component rendering
  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Ray Peat Knowledge Quiz</h1>
      <>
        <p className="text-center text-muted-foreground mb-8">
          Difficulty: <span className="font-semibold capitalize">{pageDifficulty}</span>. Select one answer per question.
        </p>
        {currentQuestions.length > 0 ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            {currentQuestions.map((q, index) => (
              <div key={q.id} className="border-b pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0">
                <p className="font-semibold mb-4">
                  <span className="mr-2">{index + 1}.</span> {q.question}
                </p>
                <RadioGroup
                  value={answers[q.id]}
                  onValueChange={(value) => handleAnswerChange(q.id, value)}
                  className="space-y-3 pl-4"
                >
                  {q.options.map((opt) => (
                    <div key={opt.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.id} id={`q${q.id}-opt${opt.id}`} />
                      <Label htmlFor={`q${q.id}-opt${opt.id}`} className="text-sm font-medium leading-none">
                        {opt.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
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
           // Show this if validation passed but somehow no questions were found
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

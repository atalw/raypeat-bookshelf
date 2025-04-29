// src/app/quiz/[difficulty]/page.tsx
"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import quizDataJson from '@/data/quiz-questions.json';
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation'; // Import useParams
import Link from 'next/link'; // Import Link for "Change Difficulty"

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

// Props type for the page component including params
interface QuizDifficultyPageProps {
  params: {
    difficulty: string; // Difficulty comes from the URL segment
  };
}

export default function QuizDifficultyPage({ params }: QuizDifficultyPageProps) {
  const [answers, setAnswers] = useState<AnswersState>({});
  const [isValidDifficulty, setIsValidDifficulty] = useState(false); // State to track if difficulty is valid
  const router = useRouter();
  const pageDifficulty = params.difficulty as Difficulty; // Get difficulty from params

  // Validate the difficulty from the URL
  useEffect(() => {
    if (['easy', 'medium', 'hard'].includes(pageDifficulty)) {
      setIsValidDifficulty(true);
    } else {
      // Optional: Redirect if difficulty is invalid
      // router.replace('/quiz');
      setIsValidDifficulty(false);
    }
  }, [pageDifficulty, router]);

  // Get the array of questions based on the difficulty from the URL params
  const currentQuestions = useMemo(() => {
    if (!isValidDifficulty) return [];
    // Directly access the array using the pageDifficulty as the key
    return quizData[pageDifficulty] || [];
  }, [pageDifficulty, isValidDifficulty]);

  // --- Event Handlers (same as before) ---
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prevAnswers) => ({ ...prevAnswers, [questionId]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
        difficulty: pageDifficulty, // Use difficulty from params
        questionIds: currentQuestions.map(q => q.id)
      }));
      router.push('/quiz/results'); // Navigate to results page
    } catch (error) {
      console.error("Failed to save results to sessionStorage:", error);
      alert("Could not save quiz results. Please try again.");
    }
  };
  // --- End Event Handlers ---

  // Render loading or invalid state if needed
   if (!isValidDifficulty) {
     // You might want a better loading/error state here
     return (
        <main className="container mx-auto px-4 py-8 max-w-3xl text-center">
            <p className="text-red-500 font-semibold">Invalid difficulty level selected.</p>
            <Link href="/quiz" className="text-blue-600 hover:underline mt-4 inline-block">
                &larr; Choose Difficulty
            </Link>
        </main>
     );
   }

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Ray Peat Knowledge Quiz</h1>

      {/* --- Quiz Form UI --- */}
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
               {/* Use Link for navigation back to difficulty selection */}
               <Link href="/quiz">
                 <Button type="button" variant="secondary">
                    Change Difficulty
                 </Button>
               </Link>
              <Button type="submit">Submit Answers</Button>
            </div>
          </form>
        ) : (
          <p className="text-center text-muted-foreground mt-10">
            No questions found for the selected difficulty ('{pageDifficulty}'). Please check the data file (`quiz-questions.json`).
             <Link href="/quiz" className="text-blue-600 hover:underline ml-2">Choose Difficulty</Link>
          </p>
        )}
      </>
    </main>
  );
}

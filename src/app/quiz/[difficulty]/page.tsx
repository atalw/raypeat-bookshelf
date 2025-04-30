// src/app/quiz/[difficulty]/page.tsx
"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import quizDataJson from '@/data/quiz-questions.json';
// Remove 'use' hook import if it's not used elsewhere
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
  // --- Force type assertion here ---
  const assertedProps = props as QuizDifficultyPageProps;
  // --- End type assertion ---

  // --- REMOVE the use() hook ---
  // const resolvedParams = use(assertedProps.params);
  // --- End removal ---


  const [answers, setAnswers] = useState<AnswersState>({});
  const [isValidDifficulty, setIsValidDifficulty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // --- Access difficulty directly from the ASSERTED params ---
  // Use assertedProps.params directly
  const pageDifficulty = assertedProps.params.difficulty as Difficulty;
  // --- End access ---

  // Validate the difficulty from the URL
  useEffect(() => {
    // Use pageDifficulty derived directly from assertedProps.params
    if (pageDifficulty && Object.keys(quizData).includes(pageDifficulty)) {
       setIsValidDifficulty(true);
    } else {
       setIsValidDifficulty(false);
    }
  }, [pageDifficulty]); // Dependency is correct

  // Get the array of questions based on the difficulty from the URL params
  const currentQuestions = useMemo(() => {
    // Use isValidDifficulty which depends on pageDifficulty
    if (!isValidDifficulty) return [];
    return quizData[pageDifficulty] || [];
  }, [pageDifficulty, isValidDifficulty]); // Dependencies are correct

  // --- Event Handlers (remain the same) ---
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prevAnswers) => ({ ...prevAnswers, [questionId]: value }));
  };

  // --- Updated handleSubmit (remains the same logic) ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (currentQuestions.length === 0 || !isValidDifficulty || isSubmitting) return;

    setIsSubmitting(true);

    let score = 0;
    const totalQuestions = currentQuestions.length;
    currentQuestions.forEach(q => {
      if (answers[q.id] && answers[q.id] === q.correctAnswerId) score++;
    });

    const resultData = {
      score,
      totalQuestions,
      userAnswers: answers,
      difficulty: pageDifficulty, // Use pageDifficulty derived from assertedProps.params
      questionIds: currentQuestions.map(q => q.id)
    };

    console.log("Quiz submitted. Preparing to log...");
    console.log("Data:", resultData);

    try {
      // Ensure fetch options are correctly passed if needed
      const response = await fetch('/api/log-quiz', {
          method: 'POST', // Make sure method is specified
          headers: { 'Content-Type': 'application/json' }, // Specify content type
          body: JSON.stringify(resultData)
      });
      if (!response.ok) { console.error(`API log request failed: ${response.status}`); } else { console.log('API log request successful.'); }
    } catch (error) { console.error('Error sending log data to API:', error); }

    try {
      sessionStorage.setItem('quizResults', JSON.stringify(resultData));
      router.push('/quiz/results');
    } catch (error) {
      console.error("Failed to save results to sessionStorage:", error);
      alert("Could not save quiz results locally. Please try again.");
      setIsSubmitting(false);
    }
  };
  // --- End Event Handlers ---

  // Render invalid state if needed
   if (!isValidDifficulty && pageDifficulty) {
     return (
        <main className="container mx-auto px-4 py-8 max-w-3xl text-center">
             {/* Access directly from assertedProps.params */}
            <p className="text-red-500 font-semibold">Invalid difficulty level: '{assertedProps.params.difficulty}'</p>
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
        {/* Use pageDifficulty derived from assertedProps.params */}
        <p className="text-center text-muted-foreground mb-8">
          Difficulty: <span className="font-semibold capitalize">{pageDifficulty}</span>. {currentQuestions.length} questions.
        </p>
        {currentQuestions.length > 0 ? (
          <form onSubmit={handleSubmit} className={`space-y-8 ${isSubmitting ? 'opacity-70 pointer-events-none' : ''}`}>
            {/* ... mapping questions ... */}
            {currentQuestions.map((q, index) => (
              <div key={q.id} className="border-b pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0">
                <p className="font-semibold mb-4">
                  <span className="mr-2">{index + 1}.</span> {q.question}
                </p>
                <RadioGroup
                  value={answers[q.id]}
                  onValueChange={(value) => handleAnswerChange(q.id, value)}
                  className="space-y-1 pl-4"
                >
                  {q.options.map((opt) => (
                    <Label
                      key={opt.id}
                      htmlFor={`q${q.id}-opt${opt.id}`}
                      className="flex items-center space-x-3 p-3 rounded-md hover:bg-accent cursor-pointer transition-colors"
                    >
                      <RadioGroupItem value={opt.id} id={`q${q.id}-opt${opt.id}`} />
                      <span className="text-sm font-medium leading-normal">
                        {opt.text}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            ))}
            <div className="text-center mt-10 space-x-4">
               <Link href="/quiz">
                 <Button type="button" variant="secondary" disabled={isSubmitting}>
                    Change Difficulty
                 </Button>
               </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Answers'}
              </Button>
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

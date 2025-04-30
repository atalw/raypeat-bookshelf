// src/app/quiz/[difficulty]/page.tsx
"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import quizDataJson from '@/data/quiz-questions.json';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation'; // Import useParams
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

// --- Remove params from props, use useParams hook instead ---
export default function QuizDifficultyPage() {
  const router = useRouter();
  const params = useParams<{ difficulty: string }>(); // Use the hook
  // --- Extract difficulty from the hook's result ---
  const pageDifficultyParam = params?.difficulty; // Access difficulty, handle potential undefined
  // --- End hook usage ---

  const [answers, setAnswers] = useState<AnswersState>({});
  const [isValidDifficulty, setIsValidDifficulty] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<QuizQuestion[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null); // Store validated difficulty
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate the difficulty from the URL and set state
  useEffect(() => {
    // Use pageDifficultyParam obtained from useParams hook
    const potentialDifficulty = pageDifficultyParam as Difficulty;
    if (potentialDifficulty && Object.keys(quizData).includes(potentialDifficulty)) {
       setDifficulty(potentialDifficulty);
       setIsValidDifficulty(true);
       setCurrentQuestions(quizData[potentialDifficulty] || []);
    } else {
       setIsValidDifficulty(false);
       setDifficulty(null);
       setCurrentQuestions([]);
    }
    // Reset answers when difficulty changes
    setAnswers({});
  }, [pageDifficultyParam]); // Depend on the param from the hook

  // --- Event Handlers (remain the same) ---
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prevAnswers) => ({ ...prevAnswers, [questionId]: value }));
  };

  // --- Updated handleSubmit (remains the same logic) ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Use the validated difficulty state and check currentQuestions length
    if (!difficulty || currentQuestions.length === 0 || !isValidDifficulty || isSubmitting) return;

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
      difficulty: difficulty, // Use the validated difficulty state
      questionIds: currentQuestions.map(q => q.id)
    };

    try {
      // Ensure fetch options are correctly passed if needed
      const response = await fetch('/api/log-quiz', {
          method: 'POST', // Make sure method is specified
          headers: { 'Content-Type': 'application/json' }, // Specify content type
          body: JSON.stringify(resultData)
      });
      if (!response.ok) {
        console.error(`API log request failed: ${response.status}`);
      }
    } catch (error) { console.error('Error sending log data to API:', error); }

    try {
      sessionStorage.setItem('quizResults', JSON.stringify(resultData));
      router.push('/quiz/results');
    } catch (error) {
      console.error("Failed to save results to sessionStorage:", error);
      alert("Could not save quiz results locally. Please try again.");
      setIsSubmitting(false); // Ensure submitting state is reset on error
    }
    // No need to setIsSubmitting(false) here if navigation succeeds
  };
  // --- End Event Handlers ---

  // Render invalid state if needed (check after useEffect runs)
   if (!isValidDifficulty && difficulty === null) { // Check if validation failed
     // Avoid rendering this briefly on initial load before useEffect runs
     // Check if pageDifficultyParam (from hook) exists but validation failed
     // Use the destructured pageDifficultyParam for the check
     if (pageDifficultyParam && !Object.keys(quizData).includes(pageDifficultyParam)) {
        return (
            <main className="container mx-auto px-4 py-8 max-w-3xl text-center">
                <p className="text-red-500 font-semibold">Invalid difficulty level: '{pageDifficultyParam}'</p>
                <Link href="/quiz" className="text-blue-600 hover:underline mt-4 inline-block">
                    &larr; Choose Difficulty
                </Link>
            </main>
        );
     }
     // Optional: Render a loading state while useEffect runs initially
     // return <main className="container mx-auto px-4 py-8 max-w-3xl text-center"><p>Loading...</p></main>;
   }

  // Main component rendering
  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Do you understand Ray Peat?</h1>
      {isValidDifficulty && difficulty ? ( // Render only when difficulty is valid
        <>
        <p className="text-center text-muted-foreground mb-8">
          Difficulty: <span className="font-semibold capitalize">{difficulty}</span>. {currentQuestions.length} questions.
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
           ( // This case should ideally not be reached if validation logic is correct, but good fallback
             <p className="text-center text-muted-foreground mt-10">
               No questions found for the selected difficulty ('{difficulty}'). Please check the data file (`quiz-questions.json`).
               <Link href="/quiz" className="text-blue-600 hover:underline ml-2">Choose Difficulty</Link>
             </p>
           )
        )}
      </>
      ) : ( // Render loading or initial state
        // Optional: Loading state or handle the case where validation is in progress/failed differently
        !pageDifficultyParam ? <p>Loading difficulty...</p> : null // Check if destructured param exists
      )}
    </main>
  );
}

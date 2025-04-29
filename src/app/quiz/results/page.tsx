// src/app/quiz/results/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import quizDataJson from '@/data/quiz-questions.json';
import { CheckCircle, XCircle, BookOpen } from 'lucide-react';

// Define difficulty levels explicitly matching JSON keys
type Difficulty = 'easy' | 'medium' | 'hard';

// Interface for a single option
interface QuizOption {
  id: string;
  text: string;
}

// Interface for a single question (no difficulty field needed here)
interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctAnswerId: string;
  explanation?: string;
  furtherReading?: string;
}

// Interface describing the structure of the imported JSON data
interface QuizData {
  easy: QuizQuestion[];
  medium: QuizQuestion[];
  hard: QuizQuestion[];
}

// Interface for the data expected from sessionStorage
interface QuizResults {
  score: number;
  totalQuestions: number;
  userAnswers: { [questionId: string]: string | undefined };
  difficulty: Difficulty; // Added difficulty
  questionIds: string[];   // Added question IDs
}

// Type assertion for the imported JSON data using the correct structure
const quizData: QuizData = quizDataJson as QuizData;

// Helper function to find option text by ID
const getOptionText = (question: QuizQuestion, optionId: string | undefined): string => {
    if (!optionId) return "Not Answered";
    const option = question.options.find(opt => opt.id === optionId);
    return option ? option.text : "Unknown Option";
}

// --- SVG Score Component (remains the same) ---
const ScoreSvg = ({ score, total }: { score: number; total: number }) => {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  let strokeColor = "#ef4444"; // Default red
  if (percentage >= 75) strokeColor = "#22c55e"; // Green
  else if (percentage >= 40) strokeColor = "#eab308"; // Yellow
  return (
    // Removed my-4 from SVG, spacing will be handled by parent CardContent
    <svg width="120" height="120" viewBox="0 0 120 120" className="mx-auto">
      <circle cx="60" cy="60" r={radius} stroke="#e5e7eb" strokeWidth="10" fill="transparent" className="dark:stroke-gray-600" />
      <circle cx="60" cy="60" r={radius} stroke={strokeColor} strokeWidth="10" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 60 60)" />
      <text x="50%" y="50%" textAnchor="middle" dy=".3em" fontSize="20" fontWeight="bold" fill="#374151" className="dark:fill-gray-200">{`${score}/${total}`}</text>
    </svg>
  );
};
// --- End SVG Score Component ---


export default function ResultsPage() {
  const [results, setResults] = useState<QuizResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Effect to load results from sessionStorage (remains the same)
  useEffect(() => {
    const storedResults = sessionStorage.getItem('quizResults');
    if (storedResults) {
      try {
        const parsedResults: QuizResults = JSON.parse(storedResults);
         // --- Validation (remains the same) ---
         if (typeof parsedResults.score !== 'number' ||
             typeof parsedResults.totalQuestions !== 'number' ||
             typeof parsedResults.userAnswers !== 'object' ||
             !parsedResults.difficulty ||
             !['easy', 'medium', 'hard'].includes(parsedResults.difficulty) ||
             !Array.isArray(parsedResults.questionIds)
             ) {
            throw new Error("Invalid results format in sessionStorage");
         }
        setResults(parsedResults);
      } catch (error) {
        console.error("Failed to parse results from sessionStorage:", error);
        sessionStorage.removeItem('quizResults');
        router.replace('/quiz');
      }
    } else {
      router.replace('/quiz');
    }
    setIsLoading(false);
  }, [router]);

  // Get the actual questions that were part of the quiz (remains the same)
  const questionsInQuiz = useMemo(() => {
      if (!results?.questionIds) return [];
      const allQuestions = [...quizData.easy, ...quizData.medium, ...quizData.hard];
      const allQuestionsMap = new Map(allQuestions.map(q => [q.id, q]));
      return results.questionIds
          .map(id => allQuestionsMap.get(id))
          .filter((q): q is QuizQuestion => q !== undefined);
  }, [results]);


  // Loading state (remains the same)
  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading results...</div>;
  }

  // Results not loaded or invalid state (remains the same)
  if (!results || questionsInQuiz.length === 0) {
    return <div className="container mx-auto px-4 py-8 text-center">Could not load results or questions. <Button onClick={() => router.push('/quiz')}>Try Quiz Again</Button></div>;
  }

  // Calculate percentage based on results data (remains the same)
  const percentage = results.totalQuestions > 0 ? Math.round((results.score / results.totalQuestions) * 100) : 0;

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      {/* --- Results Card --- */}
      <Card className="mb-8">
        {/* Header now only contains the main title */}
        <CardHeader className="text-center pb-4"> {/* Adjusted padding */}
          <CardTitle className="text-2xl">Quiz Results</CardTitle>
        </CardHeader>
        {/* Content contains SVG, Difficulty, and Score Description */}
        <CardContent className="text-center pt-0"> {/* Removed default top padding, will use margins */}
          {/* SVG Score */}
          <ScoreSvg score={results.score} total={results.totalQuestions} />

          {/* Difficulty - Added margin-top for spacing below SVG */}
          <CardDescription className="text-sm capitalize font-medium mt-4"> {/* Adjusted margin */}
            Difficulty: {results.difficulty}
          </CardDescription>

          {/* Score Description - Added margin-top for spacing below Difficulty */}
          <CardDescription className="mt-1"> {/* Adjusted margin */}
            You scored {results.score} out of {results.totalQuestions} ({percentage}%)
          </CardDescription>

          {/* --- Conditional Fake Peater Alert --- */}
          {results.score < 17 && (
            <p className="mt-4 text-red-600 dark:text-red-500 font-bold text-lg animate-pulse">
              🚨🚨🚨 FAKE PEATER ALERT 🚨🚨🚨
            </p>
          )}
          {/* --- End Conditional Alert --- */}

        </CardContent>
      </Card>
      {/* --- End Results Card --- */}


      <h2 className="text-xl font-semibold mb-4 text-center">Detailed Results</h2>

      {/* Detailed results section remains the same */}
      <div className="space-y-6">
        {questionsInQuiz.map((q, index) => {
          const userAnswerId = results.userAnswers[q.id];
          const isCorrect = userAnswerId === q.correctAnswerId;
          const userAnswerText = getOptionText(q, userAnswerId);
          const correctAnswerText = getOptionText(q, q.correctAnswerId);

          return (
            <Card key={q.id} className={`border-2 ${isCorrect ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex justify-between items-start">
                  <span>{index + 1}. {q.question}</span>
                  {isCorrect ? (
                    <CheckCircle className="text-green-600 h-5 w-5 flex-shrink-0 ml-2" />
                  ) : (
                    <XCircle className="text-red-600 h-5 w-5 flex-shrink-0 ml-2" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>Your Answer:</strong> <span className={isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>{userAnswerText}</span></p>
                {!isCorrect && (
                  <p><strong>Correct Answer:</strong> <span className="text-green-700 dark:text-green-400">{correctAnswerText}</span></p>
                )}
                {q.explanation && (
                   <p className="text-xs text-muted-foreground pt-1"><strong>Explanation:</strong> {q.explanation}</p>
                )}
                {q.furtherReading && (
                  <div className="mt-3 pt-3 border-t border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center">
                      <BookOpen className="h-4 w-4 mr-1.5" />
                      Further Reading Suggestion:
                    </p>
                    <p className="text-xs text-muted-foreground pl-1">{q.furtherReading}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Button remains the same */}
      <div className="text-center mt-10">
        <Button onClick={() => router.push('/quiz')}>Take Quiz Again</Button>
      </div>
    </main>
  );
}

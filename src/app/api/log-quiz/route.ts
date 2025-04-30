// src/app/api/log-quiz/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabase } from '@/lib/supabaseClient'; // Import the Supabase client

// Define the expected structure of the incoming data
interface QuizLogData {
  score: number;
  totalQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  userAnswers: { [questionId: string]: string | undefined };
  questionIds: string[];
}

// Define the structure matching your database table (excluding auto-generated fields like id, created_at)
interface DbLogEntry {
    ip_address: string; // Use snake_case if your DB columns use it
    difficulty: 'easy' | 'medium' | 'hard';
    score: number;
    total_questions: number; // Use snake_case
    percentage: number;
    // user_answers?: object; // Optional, if storing
    // question_ids?: string[]; // Optional, if storing
}

export async function POST(request: NextRequest) {
  console.log('Received request to /api/log-quiz');

  try {
    // 1. Get IP Address
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for') ?? headersList.get('remote-addr') ?? 'IP Not Found';

    // 2. Parse the incoming JSON data
    const data = await request.json() as QuizLogData;
    console.log('Parsed request body:', data);

    // 3. Basic Validation
    if (
      typeof data.score !== 'number' ||
      typeof data.totalQuestions !== 'number' ||
      !['easy', 'medium', 'hard'].includes(data.difficulty) ||
      typeof data.userAnswers !== 'object' ||
      !Array.isArray(data.questionIds)
    ) {
      console.error('Invalid data format received:', data);
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // 4. Prepare the data for the database insert
    // Map frontend data names to database column names (e.g., totalQuestions -> total_questions)
    const dbEntry: DbLogEntry = {
      ip_address: ip,
      difficulty: data.difficulty,
      score: data.score,
      total_questions: data.totalQuestions,
      percentage: data.totalQuestions > 0 ? Math.round((data.score / data.totalQuestions) * 100) : 0,
      // Uncomment and include if you added these columns to your DB table
      // user_answers: data.userAnswers,
      // question_ids: data.questionIds,
    };

    // 5. Insert data into Supabase
    // Replace 'quiz_submissions' with your actual table name if different
    const { error: dbError } = await supabase
      .from('quiz_submissions') // Your table name
      .insert([dbEntry]); // Pass data as an array of objects

    // 6. Handle Database Error
    if (dbError) {
      console.error('Supabase insert error:', dbError);
      // Decide how to handle DB errors. For logging, often you might just log
      // the error here but still return success to the client, so the user experience isn't broken.
      // If storing the log is critical, you might return a 500 error:
      // return NextResponse.json({ error: 'Failed to log submission to database' }, { status: 500 });
    } else {
      console.log('Successfully logged submission to Supabase.');
    }

    // 7. Send success response to the client (regardless of DB log success for better UX)
    return NextResponse.json({ success: true, message: 'Log processed' }, { status: 200 });

  } catch (error) {
    console.error('Error processing /api/log-quiz:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

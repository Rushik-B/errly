import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  // Redirect to the home page after successful logout
  return NextResponse.redirect(new URL('/', baseUrl));
} 
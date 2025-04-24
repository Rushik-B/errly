import { NextResponse } from 'next/server';

// Force this route to be dynamically rendered, preventing build-time prerendering issues
export const dynamic = 'force-dynamic';

// This route handles server errors during request processing.
// It provides a minimal non-React 500 response to avoid the default page rendering issues.
export async function GET() {
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}

// Optionally handle other methods if needed
export async function POST() {
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
export async function PUT() {
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
export async function DELETE() {
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
export async function PATCH() {
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
export async function HEAD() {
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
export async function OPTIONS() {
  // Basic OPTIONS response for 500 path, adjust if needed
  return new NextResponse(null, { status: 204, headers: { 'Allow': 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS' } });
} 
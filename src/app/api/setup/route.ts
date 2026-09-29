import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { isMongoConfigured } from '@/lib/env';

export async function GET() {
  try {
    const isConfigured = isMongoConfigured();
    const result = await initDb();
    return NextResponse.json({
      status: 'ready',
      mongoConfigured: isConfigured,
      mode: result.mode,
      message: isConfigured && result.mode === 'mongodb'
        ? 'Connected to MongoDB Atlas with all collections initialized.'
        : 'Running in Local mode with full youth seed data. Add your MongoDB username and password in .env.local to persist in Atlas.',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        mongoConfigured: isMongoConfigured(),
        error: error.message || 'Database initialization error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}

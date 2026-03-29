import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all() as {
      id: string;
      type: string;
      amount: number;
      category: string;
      note: string | null;
      date: string;
      created_at: string;
    }[];

    if (transactions.length === 0) {
      return NextResponse.json({ error: 'No data to export' }, { status: 404 });
    }

    // Define CSV Headers
    const headers = ['ID', 'Type', 'Amount', 'Category', 'Note', 'Date', 'Created At'];
    
    // Map transactions to CSV rows
    const rows = transactions.map(tx => [
      tx.id,
      tx.type,
      tx.amount,
      tx.category,
      `"${tx.note || ''}"`, // Wrap notes in quotes for CSV safety
      tx.date,
      tx.created_at
    ]);

    // Build CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Return as downloadable file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=expense_report.csv',
      },
    });
  } catch (error) {
    console.error('Export failed:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

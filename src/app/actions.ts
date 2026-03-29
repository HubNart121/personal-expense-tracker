'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

export async function getTransactions(month?: number, year?: number) {
  try {
    let query = 'SELECT * FROM transactions';
    const params: any[] = [];

    if (month && year) {
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      query += ` WHERE date LIKE ?`;
      params.push(`${year}-${monthStr}-%`);
    }

    query += ' ORDER BY date DESC, created_at DESC';
    const transactions = db.prepare(query).all(...params);
    return transactions;
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return [];
  }
}

export async function addTransaction(formData: FormData) {
  const type = formData.get('type') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const category = formData.get('category') as string;
  const date = formData.get('date') as string;
  const note = formData.get('note') as string;

  if (!type || isNaN(amount) || !category || !date) {
    throw new Error('Invalid transaction data');
  }

  const id = randomUUID();

  try {
    const stmt = db.prepare(`
      INSERT INTO transactions (id, type, amount, category, note, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, type, amount, category, note, date);
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to add transaction:', error);
    throw new Error('Failed to save transaction');
  }
}

export async function deleteTransaction(id: string) {
  try {
    const stmt = db.prepare('DELETE FROM transactions WHERE id = ?');
    stmt.run(id);
    revalidatePath('/');
    return { success: true };
  } catch {
    console.error('Failed to delete transaction');
    throw new Error('Failed to delete transaction');
  }
}

export async function getSummary(month?: number, year?: number) {
  try {
    let incomeQuery = "SELECT SUM(amount) as total FROM transactions WHERE type = 'INCOME'";
    let expenseQuery = "SELECT SUM(amount) as total FROM transactions WHERE type = 'EXPENSE'";
    const params: any[] = [];

    if (month && year) {
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      incomeQuery += " AND date LIKE ?";
      expenseQuery += " AND date LIKE ?";
      params.push(`${year}-${monthStr}-%`);
    }

    const incomeResult = db.prepare(incomeQuery).get(...params) as { total: number };
    const expenseResult = db.prepare(expenseQuery).get(...params) as { total: number };
    
    const income = incomeResult.total || 0;
    const expense = expenseResult.total || 0;
    const balance = income - expense;
    
    return { balance, income, expense };
  } catch {
    console.error('Failed to fetch summary');
    return { balance: 0, income: 0, expense: 0 };
  }
}

export async function getCategorySummaries(month?: number, year?: number) {
  try {
    let query = `
      SELECT category, SUM(amount) as total 
      FROM transactions 
      WHERE type = 'EXPENSE'
    `;
    const params: any[] = [];

    if (month && year) {
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      query += " AND date LIKE ?";
      params.push(`${year}-${monthStr}-%`);
    }

    query += " GROUP BY category ORDER BY total DESC";
    
    return db.prepare(query).all(...params) as { category: string, total: number }[];
  } catch {
    console.error('Failed to fetch category summaries');
    return [];
  }
}

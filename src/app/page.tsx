import { getSummary, getTransactions, getCategorySummaries } from './actions';
import ExpenseTracker from '@/components/ExpenseTracker';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    month?: string;
    year?: string;
  };
}

export default async function Home({ searchParams }: PageProps) {
  const now = new Date();
  const month = searchParams.month ? parseInt(searchParams.month) : now.getMonth() + 1;
  const year = searchParams.year ? parseInt(searchParams.year) : now.getFullYear();

  const summary = await getSummary(month, year);
  const transactions = await getTransactions(month, year);
  const categorySummaries = await getCategorySummaries(month, year);

  return (
    <ExpenseTracker 
      initialSummary={summary} 
      initialTransactions={transactions as { id: string; type: string; amount: number; category: string; note: string; date: string; }[]}
      initialCategorySummaries={categorySummaries}
      currentMonth={month}
      currentYear={year}
    />
  );
}

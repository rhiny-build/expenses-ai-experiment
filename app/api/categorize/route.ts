import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface CategorizeRequest {
  expenses: Array<{
    description: string;
    amount: number;
    date: string;
  }>;
  categories?: Array<{
    name: string;
    description: string;
    order: number;
    isArchived: boolean;
  }>;
}

interface CategorizedExpense {
  description: string;
  amount: number;
  date: string;
  category: string;
  confidence: 'high' | 'medium' | 'low';
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body: CategorizeRequest = await request.json();
    const { expenses, categories } = body;

    if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: expenses array is required' },
        { status: 400 }
      );
    }

    console.log('=== OpenAI Categorization Request ===');
    console.log(`Categorizing ${expenses.length} expense(s)`);
    console.log('Expenses:', JSON.stringify(expenses, null, 2));
    console.log('===================================');

    // Use categories from request, or fall back to defaults if not provided
    const activeCategories = categories && categories.length > 0
      ? categories.filter(c => !c.isArchived).sort((a, b) => a.order - b.order)
      : storage.getActiveCategories();
    const categoryNames = activeCategories.map(c => c.name).join(', ');
    const categoryDescriptions = activeCategories
      .map(c => `- ${c.name}: ${c.description}`)
      .join('\n');

    // Build merchant context: group expenses by merchant for consistency
    const merchantGroups = new Map<string, number[]>();
    expenses.forEach((exp, idx) => {
      const merchant = exp.description.toUpperCase().trim();
      if (!merchantGroups.has(merchant)) {
        merchantGroups.set(merchant, []);
      }
      merchantGroups.get(merchant)!.push(idx);
    });

    const merchantContext = Array.from(merchantGroups.entries())
      .map(([merchant, indices]) => `${merchant}: appears ${indices.length} time(s)`)
      .join('\n');

    // Split into batches of 40 items each for reliable processing
    const BATCH_SIZE = 40;
    const batches: typeof expenses[] = [];
    for (let i = 0; i < expenses.length; i += BATCH_SIZE) {
      batches.push(expenses.slice(i, i + BATCH_SIZE));
    }

    console.log(`📦 Processing ${expenses.length} expenses in ${batches.length} batch(es) of max ${BATCH_SIZE} items`);

    const allCategorizations: Array<{category: string; confidence: string}> = [];

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      const startIdx = batchIdx * BATCH_SIZE;

      console.log(`\n=== Batch ${batchIdx + 1}/${batches.length} (items ${startIdx + 1}-${startIdx + batch.length}) ===`);

      const numberedTransactions = batch.map((exp, idx) =>
        `${startIdx + idx + 1}. ${exp.description} (£${exp.amount}, ${exp.date})`
      ).join('\n');

      const prompt = `You are an expert expense categorization assistant. Follow this two-step process:

AVAILABLE CATEGORIES:
${categoryDescriptions}

MERCHANT CONTEXT (for consistency across all ${expenses.length} transactions):
${merchantContext}

STEP 1: GROUP BY MERCHANT
Analyze the ${batch.length} transactions below and identify unique merchants (group by description field).
For each merchant group, decide which category best matches based on the category descriptions above.

STEP 2: APPLY CATEGORIZATION
Apply your categorization decision to each transaction, ensuring all transactions from the same merchant get the SAME category.

TRANSACTIONS (${batch.length} items - this is batch ${batchIdx + 1} of ${batches.length}):
${numberedTransactions}

CONFIDENCE LEVELS:
- "high": Clear merchant type, obvious category match
- "medium": Reasonable inference needed
- "low": Uncertain or ambiguous (use empty "" for category)

OUTPUT FORMAT:
Return a JSON array with EXACTLY ${batch.length} objects in the SAME ORDER as the numbered list above.
Format: [{"category": "CategoryName", "confidence": "high"|"medium"|"low"}, ...]
Valid categories: ${categoryNames}, or empty string ""

Output ONLY the JSON array. No markdown, no explanations.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expense categorization assistant. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      });

      console.log(`Tokens: ${completion.usage?.prompt_tokens} prompt + ${completion.usage?.completion_tokens} completion = ${completion.usage?.total_tokens} total`);
      console.log(`Finish reason: ${completion.choices[0].finish_reason}`);

      const responseText = completion.choices[0].message.content || '';

      // Strip markdown code blocks if present
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();

      const batchCategorizations = JSON.parse(cleanedResponse);

      if (batchCategorizations.length !== batch.length) {
        console.log(`⚠️  WARNING: Expected ${batch.length} categorizations, got ${batchCategorizations.length}`);
      } else {
        console.log(`✅ Batch ${batchIdx + 1} complete: ${batchCategorizations.length}/${batch.length}`);
      }

      allCategorizations.push(...batchCategorizations);
    }

    const categorizations = allCategorizations;

    console.log('\n=== Final Validation ===');
    console.log(`Expected: ${expenses.length} categorizations`);
    console.log(`Received: ${categorizations.length} categorizations`);
    console.log(`Match: ${categorizations.length === expenses.length ? 'YES ✅' : 'NO ❌'}`);

    if (!Array.isArray(categorizations)) {
      throw new Error('Invalid categorization response: not an array');
    }

    // Graceful degradation: use partial results if OpenAI response was truncated
    if (categorizations.length < expenses.length) {
      console.log(`⚠️  PARTIAL RESPONSE: Using ${categorizations.length} categorizations, ${expenses.length - categorizations.length} will need manual review`);
    }
    console.log('==========================');

    // Combine expenses with their categorizations
    // For items beyond what OpenAI returned, set confidence to 'low' so they'll be flagged for review
    const categorizedExpenses: CategorizedExpense[] = expenses.map((expense, idx) => ({
      ...expense,
      category: categorizations[idx]?.category || '',
      confidence: categorizations[idx]?.confidence || 'low',
    }));

    console.log('=== Categorization Results ===');
    categorizedExpenses.forEach((exp, idx) => {
      console.log(`${idx + 1}. ${exp.description} → ${exp.category} (${exp.confidence} confidence)`);
    });
    console.log('=============================');

    return NextResponse.json({ categorizedExpenses });
  } catch (error) {
    console.error('Categorization error:', error);
    return NextResponse.json(
      { error: 'Failed to categorize expenses: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

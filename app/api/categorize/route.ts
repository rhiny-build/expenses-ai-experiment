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

    const prompt = `You are an expert expense categorization assistant. Follow this two-step process:

AVAILABLE CATEGORIES:
${categoryDescriptions}

STEP 1: GROUP BY MERCHANT
First, analyze all ${expenses.length} transactions below and identify unique merchants (group by description field).
For each merchant group, decide which category best matches based on the category descriptions above.

STEP 2: APPLY CATEGORIZATION
Apply your categorization decision to each transaction, ensuring all transactions from the same merchant get the SAME category.

TRANSACTIONS (${expenses.length} total):
${JSON.stringify(expenses, null, 2)}

CONFIDENCE LEVELS:
- "high": Clear merchant type, obvious category match
- "medium": Reasonable inference needed
- "low": Uncertain or ambiguous (use empty "" for category)

OUTPUT:
Return a JSON array with EXACTLY ${expenses.length} objects in the SAME ORDER as the input.
Format: [{"category": "CategoryName", "confidence": "high"|"medium"|"low"}, ...]
Valid categories: ${categoryNames}, or empty string ""

Output ONLY the JSON array. No markdown, no explanations.`;

    console.log('=== Full Prompt Being Sent ===');
    console.log(prompt);
    console.log('==============================');

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
      temperature: 0.1, // Lower temperature for more consistent output
      max_tokens: 8192, // Increased significantly for complete responses
    });

    console.log('=== OpenAI Token Usage ===');
    console.log('Prompt tokens:', completion.usage?.prompt_tokens);
    console.log('Completion tokens:', completion.usage?.completion_tokens);
    console.log('Total tokens:', completion.usage?.total_tokens);
    console.log('Finish reason:', completion.choices[0].finish_reason);
    console.log('========================');

    const responseText = completion.choices[0].message.content || '';

    console.log('=== OpenAI API Response ===');
    console.log('Raw response:', responseText);
    console.log('========================');

    // Strip markdown code blocks if present
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.slice(7); // Remove ```json
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.slice(3); // Remove ```
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.slice(0, -3); // Remove trailing ```
    }
    cleanedResponse = cleanedResponse.trim();

    console.log('=== Cleaned JSON ===');
    console.log(cleanedResponse);
    console.log('==================');

    // Parse the JSON response
    const categorizations = JSON.parse(cleanedResponse);

    console.log('=== Response Validation ===');
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

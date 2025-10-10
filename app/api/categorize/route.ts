import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface CategorizeRequest {
  expenses: Array<{
    description: string;
    amount: number;
    date: string;
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
    const { expenses } = body;

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

    const prompt = `You are an expense categorization assistant. Categorize each expense into one of these categories ONLY: Food, Transportation, Entertainment, Shopping, Bills, Other.

For each expense, respond with a JSON object containing:
- category: one of the valid categories (Food, Transportation, Entertainment, Shopping, Bills, Other), or empty string "" if you cannot confidently categorize it
- confidence: "high", "medium", or "low" based on how certain you are

Categories explained:
- Food: Groceries, restaurants, cafes, food delivery
- Transportation: Gas, public transit, uber/taxi, parking, car maintenance
- Entertainment: Movies, games, concerts, streaming services, hobbies
- Shopping: Clothing, electronics, home goods, general retail
- Bills: Utilities, rent, phone, internet, insurance, subscriptions
- Other: Anything that doesn't clearly fit the above

Expenses to categorize (${expenses.length} total):
${expenses.map((exp, idx) => `${idx + 1}. "${exp.description}" - £${exp.amount} on ${exp.date}`).join('\n')}

IMPORTANT: Return exactly ${expenses.length} categorization objects in the same order as above. If you're unsure about an item, use an empty category ("") and "low" confidence - the user will categorize it manually.

Respond ONLY with a valid JSON array containing exactly ${expenses.length} items, no other text. Format:
[
  {"category": "Food", "confidence": "high"},
  {"category": "", "confidence": "low"},
  {"category": "Transportation", "confidence": "medium"},
  ...
]`;

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
      temperature: 0.3,
      max_tokens: 4096, // Increased to handle larger CSV files (up to ~150 expenses)
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

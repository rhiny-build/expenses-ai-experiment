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

    const prompt = `You are an expert expense categorization assistant. Your task is to categorize each expense transaction into the most appropriate category.

AVAILABLE CATEGORIES WITH GUIDELINES:
${categoryDescriptions}

CATEGORIZATION RULES:
1. Match each expense to EXACTLY ONE category from the list above
2. USE THE CATEGORY DESCRIPTIONS ABOVE as your PRIMARY and AUTHORITATIVE guide
3. General pattern examples (USE ONLY IF descriptions above don't provide enough guidance):
   - "TFL", "TRANSPORT FOR", "UBER TRIP" → typically Transportation
   - "OCADO", supermarket names, restaurant names → typically Food
   - "BOOKING.COM", "HOTEL" → typically Entertainment (travel/leisure)
   - "AMAZON", "M&S", retail stores → typically Shopping
   - Subscription services → check descriptions (streaming usually Entertainment, utilities/SaaS usually Bills)
   - Education platforms → check descriptions (usually Bills for subscriptions/services)
   - Gym/fitness memberships → check descriptions (usually Entertainment for hobbies/activities)
4. Confidence levels:
   - HIGH: Clear, obvious match based on category descriptions
   - MEDIUM: Reasonable inference needed
   - LOW: Ambiguous or unclear - use empty category "" so user can decide

EXPENSES TO CATEGORIZE (${expenses.length} total):
${expenses.map((exp, idx) => `${idx + 1}. "${exp.description}" - £${exp.amount} on ${exp.date}`).join('\n')}

CRITICAL REQUIREMENTS:
- Return EXACTLY ${expenses.length} JSON objects, one for each expense above, in the same order
- Each object must have: {"category": "CategoryName", "confidence": "high"|"medium"|"low"}
- If genuinely unsure, use: {"category": "", "confidence": "low"}
- DO NOT skip any expenses - count carefully and return all ${expenses.length} results
- Respond with ONLY valid JSON array, no markdown, no explanations

Example format (first 3 items):
[
  {"category": "${activeCategories[0]?.name || 'Food'}", "confidence": "high"},
  {"category": "", "confidence": "low"},
  {"category": "${activeCategories[1]?.name || 'Transportation'}", "confidence": "medium"}
]`;

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

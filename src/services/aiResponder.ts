import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI();
  }
  return aiInstance;
}

/**
 * Uses Gemini AI to draft an authentic, polite, brand-aligned response to a Google customer review
 */
export async function generateAiReviewResponse(params: {
  businessName: string;
  reviewerName: string;
  rating: number;
  reviewComment: string;
  tone?: 'warm_grateful' | 'professional' | 'problem_solving';
}): Promise<string> {
  try {
    const ai = getAI();
    const prompt = `You are the owner of "${params.businessName}". 
Draft a thoughtful, concise, and sincere response to this Google Business review:
- Customer Name: ${params.reviewerName}
- Star Rating: ${params.rating} out of 5 stars
- Review: "${params.reviewComment}"
- Desired Tone: ${params.tone || 'warm_grateful'}

Guidelines:
1. Greet the customer by name.
2. Thank them genuinely for visiting and leaving feedback.
3. If the rating is 4 or 5 stars, celebrate their specific positive mentions.
4. If the rating is 1, 2, or 3 stars, acknowledge their disappointment empathetically, apologize sincerely without making excuses, and offer to make things right.
5. Keep it under 65 words.
6. Return ONLY the reply text, no quotes or explanations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || `Thank you ${params.reviewerName} for sharing your feedback with us!`;
  } catch (error: any) {
    console.warn('AI generation fallback:', error);
    // If Gemini API is unreachable or key is not set, provide a graceful template
    if (params.rating >= 4) {
      return `Thank you so much for the wonderful review, ${params.reviewerName}! We are thrilled you enjoyed your experience with ${params.businessName} and look forward to welcoming you back soon.`;
    } else {
      return `Thank you for sharing your feedback, ${params.reviewerName}. We are truly sorry your experience did not meet expectations. Please reach out to our management team directly so we can make this right.`;
    }
  }
}

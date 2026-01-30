import { openai } from "../replit_integrations/audio/client";

export interface CustomerIntent {
  intent: "Interested" | "Not Interested" | "Needs Follow-Up" | "Price Concern" | "Just Researching" | "Wrong Contact";
  confidence: "Low" | "Medium" | "High";
  evidence: string;
}

const INTENT_PROMPT = `You are analyzing a sales call.
Based only on the customer's responses, classify the primary intent.
Choose exactly one from:
Interested, Not Interested, Needs Follow-Up, Price Concern, Just Researching, Wrong Contact.

Return JSON with:
- intent: one of the above categories
- confidence: Low, Medium, or High
- evidence: exact quote from the customer that supports this classification

Do not explain.`;

export async function detectCustomerIntent(transcript: string): Promise<CustomerIntent | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: INTENT_PROMPT },
        { role: "user", content: `Analyze this call transcript:\n\n${transcript}` }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500
    });

    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content);

    const validIntents = ["Interested", "Not Interested", "Needs Follow-Up", "Price Concern", "Just Researching", "Wrong Contact"];
    const validConfidence = ["Low", "Medium", "High"];

    if (!validIntents.includes(result.intent)) {
      console.error("Invalid intent returned:", result.intent);
      return null;
    }

    return {
      intent: result.intent,
      confidence: validConfidence.includes(result.confidence) ? result.confidence : "Medium",
      evidence: result.evidence || "No specific quote identified"
    };
  } catch (error) {
    console.error("Intent detection failed:", error);
    return null;
  }
}

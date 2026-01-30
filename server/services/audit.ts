import { openai } from "../replit_integrations/audio/client";
import { getSettings, type AuditQuestion, type QualityCategory } from "../settings";

function buildAuditPrompt(): string {
  const settings = getSettings();
  const { quality_criteria, scoring_rules } = settings;
  
  const questionsFlat: { category: string; question: AuditQuestion }[] = [];
  quality_criteria.forEach((cat: QualityCategory) => {
    cat.questions.forEach((q: AuditQuestion) => {
      questionsFlat.push({ category: cat.category, question: q });
    });
  });
  
  const questionsText = questionsFlat.map((item, idx) => {
    const mandatoryNote = item.question.mandatory ? " [MANDATORY]" : "";
    return `${idx + 1}. (Category: ${item.category}, Weight: ${item.question.weight}/5${mandatoryNote}) ${item.question.text}\n   Description: ${item.question.description}`;
  }).join("\n");
  
  return `
You are an expert Call Quality Auditor. Your job is to audit a call transcript against a set of quality questions defined by the business.

For each question, you must provide:
- question: the exact question text
- category: the category name
- answer: "Yes", "No", or "Partial"
- score: integer 0-${Math.max(...questionsFlat.map(q => q.question.weight))} based on weight (weight = perfect score, 0 = fail)
- weight: the question's weight (for reference)
- mandatory: whether this is a mandatory question
- evidence: exact quote from the transcript (if missing, state "No evidence found")
- feedback: 1 clear sentence explaining the score

Scoring Rules:
- Full score (weight value): Perfect execution, clear evidence.
- Partial score (50% of weight): Partial execution or weak evidence.
- 0 points: Not done or failed.

Pass Threshold: ${scoring_rules.pass_threshold}%
Fail on Mandatory: ${scoring_rules.fail_on_mandatory ? "Yes - if any mandatory question fails, overall verdict is Fail" : "No"}
Partial Scoring: ${scoring_rules.allow_partial ? "Allowed" : "Not allowed - only Yes/No answers"}

Questions to Audit:
${questionsText}

Output JSON format:
{
  "questions": [
    { 
      "question": "...", 
      "category": "...",
      "answer": "Yes|No|Partial", 
      "score": 0, 
      "weight": 5,
      "mandatory": true|false,
      "evidence": "...", 
      "feedback": "..." 
    }
  ],
  "summary": ["bullet 1", "bullet 2", "bullet 3"],
  "mandatory_failed": false
}

IMPORTANT: Set "mandatory_failed" to true if any mandatory question has answer "No".
`;
}

export async function auditTranscript(transcript: string) {
  const settings = getSettings();
  const { scoring_rules } = settings;
  
  const systemPrompt = buildAuditPrompt();
  
  const response = await openai.chat.completions.create({
    model: "gpt-4.1", 
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Audit this call transcript:\n\n${transcript}` }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 4000
  });

  const content = response.choices[0].message.content || "{}";
  let result;
  try {
    result = JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse audit result", content);
    throw new Error("Audit generation failed");
  }
  
  const questions = result.questions || [];
  const totalScore = questions.reduce((sum: number, q: any) => sum + (q.score || 0), 0);
  const maxScore = questions.reduce((sum: number, q: any) => sum + (q.weight || 5), 0);
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  
  const mandatoryFailed = result.mandatory_failed || 
    questions.some((q: any) => q.mandatory && q.answer === "No");
  
  let verdict = "Fail";
  if (scoring_rules.fail_on_mandatory && mandatoryFailed) {
    verdict = "Fail";
  } else if (percentage >= scoring_rules.pass_threshold) {
    verdict = "Pass";
  } else if (percentage >= scoring_rules.pass_threshold - 20) {
    verdict = "Needs Improvement";
  }

  return {
    ...result,
    overall_score: percentage,
    verdict,
    mandatory_failed: mandatoryFailed,
    pass_threshold: scoring_rules.pass_threshold
  };
}

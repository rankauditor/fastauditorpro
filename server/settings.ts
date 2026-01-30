export interface AuditQuestion {
  id: string;
  text: string;
  weight: number;
  mandatory: boolean;
  description: string;
}

export interface QualityCategory {
  id: string;
  category: string;
  questions: AuditQuestion[];
}

export interface ScoringRules {
  pass_threshold: number;
  fail_on_mandatory: boolean;
  allow_partial: boolean;
}

export interface QualitySettings {
  quality_criteria: QualityCategory[];
  scoring_rules: ScoringRules;
}

const defaultSettings: QualitySettings = {
  quality_criteria: [
    {
      id: "opening",
      category: "Call Opening",
      questions: [
        {
          id: "intro",
          text: "Did the agent introduce themselves clearly?",
          weight: 5,
          mandatory: true,
          description: "Agent must clearly state name and company at the start of the call."
        },
        {
          id: "purpose",
          text: "Did the agent state the purpose of the call?",
          weight: 4,
          mandatory: false,
          description: "Agent should explain why they are calling within the first minute."
        }
      ]
    },
    {
      id: "discovery",
      category: "Discovery / Qualification",
      questions: [
        {
          id: "qualify",
          text: "Did the agent qualify the lead?",
          weight: 5,
          mandatory: true,
          description: "Agent should ask about needs, budget, and decision-making authority."
        },
        {
          id: "listening",
          text: "Did the agent listen actively (not interrupting)?",
          weight: 4,
          mandatory: false,
          description: "Agent should allow the prospect to speak without constant interruption."
        }
      ]
    },
    {
      id: "pitch",
      category: "Pitch & Explanation",
      questions: [
        {
          id: "knowledge",
          text: "Was the agent knowledgeable about the product/service?",
          weight: 5,
          mandatory: true,
          description: "Agent should demonstrate thorough knowledge and answer questions confidently."
        },
        {
          id: "tone",
          text: "Did the agent maintain a professional tone throughout?",
          weight: 4,
          mandatory: false,
          description: "Agent should remain courteous and professional during the entire call."
        }
      ]
    },
    {
      id: "objections",
      category: "Objection Handling",
      questions: [
        {
          id: "handle_objections",
          text: "Did the agent handle objections effectively?",
          weight: 5,
          mandatory: false,
          description: "Agent should address concerns with clear, helpful responses."
        }
      ]
    },
    {
      id: "compliance",
      category: "Compliance",
      questions: [
        {
          id: "recording_disclosure",
          text: "Did the agent mention compliance or recording disclosures?",
          weight: 3,
          mandatory: false,
          description: "If required, agent should mention call recording or compliance disclosures."
        }
      ]
    },
    {
      id: "closing",
      category: "Closing",
      questions: [
        {
          id: "next_steps",
          text: "Did the agent attempt to close or set next steps?",
          weight: 5,
          mandatory: true,
          description: "Agent should always propose a clear next action or follow-up."
        },
        {
          id: "polite_end",
          text: "Did the agent end the call politely?",
          weight: 3,
          mandatory: false,
          description: "Call should end with courtesy and professionalism."
        }
      ]
    }
  ],
  scoring_rules: {
    pass_threshold: 80,
    fail_on_mandatory: true,
    allow_partial: true
  }
};

let currentSettings: QualitySettings = JSON.parse(JSON.stringify(defaultSettings));

export function getSettings(): QualitySettings {
  return currentSettings;
}

export function updateSettings(newSettings: QualitySettings): QualitySettings {
  currentSettings = newSettings;
  return currentSettings;
}

export function resetSettings(): QualitySettings {
  currentSettings = JSON.parse(JSON.stringify(defaultSettings));
  return currentSettings;
}

import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  duration: text("duration"), // e.g. "15:42"
  status: text("status").notNull().default("uploading"), // uploading, transcribing, auditing, completed, failed
  transcript: text("transcript"), // Long text
  auditResult: jsonb("audit_result"), // Structured JSON result
  createdAt: timestamp("created_at").defaultNow(),
});

// === BASE SCHEMAS ===
export const insertCallSchema = createInsertSchema(calls).omit({ 
  id: true, 
  createdAt: true, 
  auditResult: true, 
  transcript: true
});

// === EXPLICIT API CONTRACT TYPES ===
export type Call = typeof calls.$inferSelect;
export type InsertCall = z.infer<typeof insertCallSchema>;

// Audit Result Type Definition (for type safety)
export interface AuditQuestion {
  question: string;
  answer: "Yes" | "No" | "Partial";
  score: number;
  evidence: string;
  feedback: string;
}

export interface CustomerIntent {
  intent: "Interested" | "Not Interested" | "Needs Follow-Up" | "Price Concern" | "Just Researching" | "Wrong Contact";
  confidence: "Low" | "Medium" | "High";
  evidence: string;
}

export interface AuditResult {
  call_id: string;
  duration: string;
  overall_score: number;
  verdict: "Pass" | "Needs Improvement" | "Fail";
  questions: AuditQuestion[];
  summary: string[];
  customer_intent?: CustomerIntent | null;
}

// Request/Response types
export type CreateCallRequest = FormData; // Not strictly typed in Zod for upload
export type CallResponse = Call;
export type CallsListResponse = Call[];

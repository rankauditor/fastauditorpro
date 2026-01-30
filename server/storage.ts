import { db } from "./db";
import { calls, type Call, type InsertCall } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createCall(call: InsertCall): Promise<Call>;
  getCall(id: number): Promise<Call | undefined>;
  getCalls(): Promise<Call[]>;
  updateCallStatus(id: number, status: string, duration?: string): Promise<Call>;
  updateCallTranscript(id: number, transcript: string): Promise<Call>;
  updateCallAudit(id: number, auditResult: any): Promise<Call>;
}

export class DatabaseStorage implements IStorage {
  async createCall(insertCall: InsertCall): Promise<Call> {
    const [call] = await db.insert(calls).values(insertCall).returning();
    return call;
  }

  async getCall(id: number): Promise<Call | undefined> {
    const [call] = await db.select().from(calls).where(eq(calls.id, id));
    return call;
  }

  async getCalls(): Promise<Call[]> {
    return db.select().from(calls).orderBy(desc(calls.createdAt));
  }

  async updateCallStatus(id: number, status: string, duration?: string): Promise<Call> {
    const values: Partial<InsertCall> = { status };
    if (duration) values.duration = duration;
    
    const [updated] = await db
      .update(calls)
      .set(values)
      .where(eq(calls.id, id))
      .returning();
    return updated;
  }

  async updateCallTranscript(id: number, transcript: string): Promise<Call> {
    const [updated] = await db
      .update(calls)
      .set({ transcript })
      .where(eq(calls.id, id))
      .returning();
    return updated;
  }

  async updateCallAudit(id: number, auditResult: any): Promise<Call> {
    const [updated] = await db
      .update(calls)
      .set({ auditResult, status: "completed" })
      .where(eq(calls.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();

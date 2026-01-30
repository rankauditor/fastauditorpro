import { v4 as uuidv4 } from "uuid";

export interface QueueJob {
  id: string;
  filename: string;
  status: "pending" | "processing" | "done" | "failed";
  result: any | null;
  error: string | null;
  callId: number | null;
  createdAt: Date;
}

const jobQueue: QueueJob[] = [];
let currentJob: QueueJob | null = null;
let processCallback: ((job: QueueJob) => Promise<void>) | null = null;

export function setProcessCallback(callback: (job: QueueJob) => Promise<void>) {
  processCallback = callback;
}

export function addToQueue(filename: string, fileBuffer: Buffer, mimeType: string): QueueJob {
  const job: QueueJob = {
    id: uuidv4(),
    filename,
    status: "pending",
    result: null,
    error: null,
    callId: null,
    createdAt: new Date()
  };
  
  jobQueue.push(job);
  
  (job as any)._buffer = fileBuffer;
  (job as any)._mimeType = mimeType;
  
  processQueue();
  
  return job;
}

export function getQueue(): QueueJob[] {
  return jobQueue.map(job => ({
    id: job.id,
    filename: job.filename,
    status: job.status,
    result: job.result,
    error: job.error,
    callId: job.callId,
    createdAt: job.createdAt
  }));
}

export function getJob(id: string): QueueJob | undefined {
  return jobQueue.find(j => j.id === id);
}

export function isProcessing(): boolean {
  return currentJob !== null;
}

async function processQueue() {
  if (currentJob !== null || !processCallback) {
    return;
  }

  const nextJob = jobQueue.find(job => job.status === "pending");
  if (!nextJob) {
    return;
  }

  currentJob = nextJob;
  nextJob.status = "processing";

  try {
    await processCallback(nextJob);
    nextJob.status = "done";
  } catch (err: any) {
    nextJob.status = "failed";
    nextJob.error = err?.message || "Processing failed";
    console.error(`Queue job ${nextJob.id} failed:`, err);
  }

  currentJob = null;
  
  processQueue();
}

export function getJobBuffer(job: QueueJob): { buffer: Buffer; mimeType: string } | null {
  const buffer = (job as any)._buffer;
  const mimeType = (job as any)._mimeType;
  if (buffer && mimeType) {
    return { buffer, mimeType };
  }
  return null;
}

export function clearJobBuffer(job: QueueJob) {
  delete (job as any)._buffer;
  delete (job as any)._mimeType;
}

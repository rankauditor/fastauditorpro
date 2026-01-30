import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { speechToText } from "./replit_integrations/audio/client";
import { auditTranscript } from "./services/audit";
import { detectCustomerIntent } from "./services/intent";
import { getSettings, updateSettings, resetSettings, type QualitySettings } from "./settings";
import { addToQueue, getQueue, getJob, setProcessCallback, getJobBuffer, clearJobBuffer, type QueueJob } from "./queue";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

async function processAudioFile(fileBuffer: Buffer, filename: string, mimeType: string): Promise<number> {
  const call = await storage.createCall({
    filename,
    duration: "Processing...",
    status: "uploading",
  });

  console.log(`Starting processing for call ${call.id}`);
  await storage.updateCallStatus(call.id, "transcribing");
  
  let format: "wav" | "mp3" | "webm" = "wav";
  if (mimeType.includes("mp3") || filename.endsWith(".mp3")) format = "mp3";
  else if (mimeType.includes("webm") || filename.endsWith(".webm")) format = "webm";
  
  console.log(`Transcribing call ${call.id} (format: ${format})...`);
  const transcript = await speechToText(fileBuffer, format);
  await storage.updateCallTranscript(call.id, transcript);

  console.log(`Auditing call ${call.id}...`);
  await storage.updateCallStatus(call.id, "auditing");

  const auditResult = await auditTranscript(transcript);
  
  console.log(`Detecting customer intent for call ${call.id}...`);
  const customerIntent = await detectCustomerIntent(transcript);
  
  const finalResult = {
    ...auditResult,
    customer_intent: customerIntent
  };
  
  await storage.updateCallAudit(call.id, finalResult);
  console.log(`Call ${call.id} completed successfully.`);
  
  return call.id;
}

setProcessCallback(async (job: QueueJob) => {
  const data = getJobBuffer(job);
  if (!data) {
    throw new Error("No file data found for job");
  }
  
  try {
    const callId = await processAudioFile(data.buffer, job.filename, data.mimeType);
    job.callId = callId;
    const call = await storage.getCall(callId);
    job.result = call;
  } finally {
    clearJobBuffer(job);
  }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post(api.calls.upload.path, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }
      
      const fileBuffer = req.file.buffer;
      const filename = req.file.originalname;
      const mimeType = req.file.mimetype;

      const call = await storage.createCall({
        filename,
        duration: "Processing...",
        status: "uploading",
      });

      res.status(201).json(call);

      (async () => {
        try {
          console.log(`Starting processing for call ${call.id}`);
          await storage.updateCallStatus(call.id, "transcribing");
          
          let format: "wav" | "mp3" | "webm" = "wav";
          if (mimeType.includes("mp3") || filename.endsWith(".mp3")) format = "mp3";
          else if (mimeType.includes("webm") || filename.endsWith(".webm")) format = "webm";
          
          console.log(`Transcribing call ${call.id} (format: ${format})...`);
          const transcript = await speechToText(fileBuffer, format);
          await storage.updateCallTranscript(call.id, transcript);

          console.log(`Auditing call ${call.id}...`);
          await storage.updateCallStatus(call.id, "auditing");

          const auditResult = await auditTranscript(transcript);
          
          console.log(`Detecting customer intent for call ${call.id}...`);
          const customerIntent = await detectCustomerIntent(transcript);
          
          const finalResult = {
            ...auditResult,
            customer_intent: customerIntent
          };
          
          await storage.updateCallAudit(call.id, finalResult);
          console.log(`Call ${call.id} completed successfully.`);

        } catch (err) {
          console.error(`Processing failed for call ${call.id}:`, err);
          await storage.updateCallStatus(call.id, "failed");
        }
      })();

    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.get(api.calls.get.path, async (req, res) => {
    const call = await storage.getCall(Number(req.params.id));
    if (!call) return res.status(404).json({ message: "Call not found" });
    res.json(call);
  });

  app.get(api.calls.list.path, async (req, res) => {
    const calls = await storage.getCalls();
    res.json(calls);
  });

  app.get("/api/settings", (req, res) => {
    res.json(getSettings());
  });

  app.put("/api/settings", (req, res) => {
    try {
      const newSettings = req.body as QualitySettings;
      const updated = updateSettings(newSettings);
      res.json(updated);
    } catch (err) {
      console.error("Settings update error:", err);
      res.status(400).json({ message: "Invalid settings format" });
    }
  });

  app.post("/api/settings/reset", (req, res) => {
    const settings = resetSettings();
    res.json(settings);
  });

  app.post("/api/queue/add", upload.array("files", 20), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      const jobs = files.map(file => 
        addToQueue(file.originalname, file.buffer, file.mimetype)
      );

      res.json({ 
        queued: jobs.length,
        jobs: jobs.map(j => ({ id: j.id, filename: j.filename, status: j.status }))
      });
    } catch (err) {
      console.error("Queue add error:", err);
      res.status(500).json({ message: "Failed to add files to queue" });
    }
  });

  app.get("/api/queue", (req, res) => {
    res.json(getQueue());
  });

  app.get("/api/queue/:id", (req, res) => {
    const job = getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json({
      id: job.id,
      filename: job.filename,
      status: job.status,
      result: job.result,
      error: job.error,
      callId: job.callId,
      createdAt: job.createdAt
    });
  });

  return httpServer;
}

import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { atomicWriteFile } from "../../config";
import type { BrokerToolRequest, BrokerToolResult } from "./turn-broker";

export type TaskToolState = "pending" | "returned" | "error" | "unknown";
export interface TaskToolRecord {
  id: string;
  name: string;
  state: TaskToolState;
  exitCode: number | null;
}
export interface TaskRecord {
  traceId: string;
  threadId: string | null;
  turnId: string;
  model: string;
  state: "running" | "answer_returned" | "needs_review";
  startedAt: string;
  updatedAt: string;
  totalCalls: number;
  errors: number;
  tools: TaskToolRecord[];
}

const MAX_RECORDS = 200;
const MAX_TOOLS = 64;
const MAX_BYTES = 8 * 1024 * 1024;
const identity = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]{6,128}$/.test(value);
const toolName = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_./:-]{1,160}$/.test(value);

function validateRecord(value: TaskRecord): boolean {
  return value && identity(value.traceId) && identity(value.turnId)
    && (value.threadId === null || identity(value.threadId))
    && toolName(value.model)
    && ["running", "answer_returned", "needs_review"].includes(value.state)
    && typeof value.startedAt === "string" && Number.isFinite(Date.parse(value.startedAt))
    && typeof value.updatedAt === "string" && Number.isFinite(Date.parse(value.updatedAt))
    && Number.isSafeInteger(value.totalCalls) && value.totalCalls >= 0
    && Number.isSafeInteger(value.errors) && value.errors >= 0
    && Array.isArray(value.tools) && value.tools.length <= MAX_TOOLS
    && value.tools.every(tool => identity(tool.id) && toolName(tool.name)
      && ["pending", "returned", "error", "unknown"].includes(tool.state)
      && (tool.exitCode === null || Number.isSafeInteger(tool.exitCode)));
}

/** Small effect receipts, not another conversation store. No prompts, arguments or outputs. */
export class TaskRecords {
  private static readonly stores = new Map<string, TaskRecords>();
  private records: TaskRecord[] = [];

  // Adapters are created per HTTP request. Recovery runs once per runtime process,
  // never when a second task or a reconnect creates another adapter.
  static forPath(path?: string): TaskRecords {
    if (!path) return new TaskRecords();
    const key = resolve(path);
    let store = this.stores.get(key);
    if (!store) {
      store = new TaskRecords(key);
      this.stores.set(key, store);
    }
    return store;
  }

  constructor(private readonly path?: string) {
    if (!path || !existsSync(path)) return;
    if (statSync(path).size > MAX_BYTES) throw new Error("COS task record file exceeds its size limit");
    const stored = JSON.parse(readFileSync(path, "utf8"));
    if (stored?.version !== 1 || !Array.isArray(stored.records)
      || stored.records.length > MAX_RECORDS || !stored.records.every(validateRecord)) {
      throw new Error("COS task records are invalid; keep the file for recovery");
    }
    this.records = stored.records;
    // A prior process cannot prove whether its in-flight tool took effect.
    for (const record of this.records) {
      if (record.state === "running") record.state = "needs_review";
      for (const tool of record.tools) if (tool.state === "pending") tool.state = "unknown";
    }
    this.save();
  }

  private save(): void {
    if (!this.path) return;
    const payload = JSON.stringify({ version: 1, pid: process.pid, records: this.records });
    if (Buffer.byteLength(payload) > MAX_BYTES) throw new Error("COS task records exceed their size limit");
    atomicWriteFile(this.path, `${payload}\n`);
  }

  begin(traceId: string, threadId: string | undefined, turnId: string, model: string): void {
    if (!this.path) return;
    if (this.records.some(record => record.traceId === traceId)) {
      throw new Error("COS already recorded this turn. Check its task record and native history, then send a new message. An uncertain action must not run again automatically.");
    }
    if (this.records.length >= MAX_RECORDS) {
      const removable = this.records.findIndex(record => record.state !== "running");
      if (removable < 0) throw new Error("COS already has 200 active turns; stop an active turn before continuing");
      this.records.splice(removable, 1);
    }
    const at = new Date().toISOString();
    const record: TaskRecord = {
      traceId, threadId: threadId ?? null, turnId, model, state: "running",
      startedAt: at, updatedAt: at, totalCalls: 0, errors: 0, tools: [],
    };
    if (!validateRecord(record)) throw new Error("COS task record requires native task and turn identities");
    this.records.push(record);
    this.save();
  }

  dispatch(traceId: string, requests: readonly BrokerToolRequest[]): void {
    if (!this.path) return;
    const record = this.require(traceId);
    for (const request of requests) {
      if (record.tools.some(tool => tool.id === request.callId)) continue;
      if (!identity(request.callId) || !toolName(request.wireName)) throw new Error("COS tool identity is invalid");
      if (record.tools.length >= MAX_TOOLS) {
        const removable = record.tools.findIndex(tool => tool.state !== "pending");
        if (removable < 0) throw new Error("COS has too many unresolved tool calls");
        record.tools.splice(removable, 1);
      }
      record.tools.push({ id: request.callId, name: request.wireName, state: "pending", exitCode: null });
      record.totalCalls++;
    }
    record.updatedAt = new Date().toISOString();
    this.save(); // Commit before emitting any tool call to native Codex.
  }

  complete(traceId: string, callId: string, result: BrokerToolResult): void {
    if (!this.path) return;
    const record = this.require(traceId);
    const tool = record.tools.find(candidate => candidate.id === callId);
    if (!tool) {
      throw new Error("COS received a tool result without its recorded dispatch");
    }
    const structured = result.structuredContent && typeof result.structuredContent === "object"
      && !Array.isArray(result.structuredContent)
      ? result.structuredContent as Record<string, unknown>
      : undefined;
    let code = structured?.exit_code ?? structured?.exitCode;
    const nativeName = tool.name.split(/__|[./]/).at(-1);
    if (code === undefined && ["exec_command", "write_stdin", "shell_command", "apply_patch"].includes(nativeName ?? "")) {
      // Native Codex also returns these transport headers as plain text. Read only the
      // anchored header of its first text block; stdout may contain arbitrary fake receipts.
      const first = result.content[0] as { type?: unknown; text?: unknown } | undefined;
      const header = first?.type === "text" && typeof first.text === "string" ? first.text.slice(0, 1024) : "";
      const match = header.match(/^Chunk ID: [\w-]+\r?\nWall time: [\d.]+ seconds\r?\nProcess exited with code (-?\d+)\r?\n/)
        ?? header.match(/^Exit code: (-?\d+)\r?\nWall time: [\d.]+ seconds\r?\nOutput:/);
      if (match) code = Number(match[1]);
    }
    const exitCode = typeof code === "number" && Number.isSafeInteger(code) ? code : null;
    const state = result.isError === true || (exitCode !== null && exitCode !== 0) ? "error" : "returned";
    // An HTTP reconnect can redeliver a result whose broker acknowledgement was lost.
    if (tool.state === "returned" || tool.state === "error") {
      if (tool.state !== state || tool.exitCode !== exitCode) throw new Error("COS received conflicting tool results");
      return;
    }
    tool.exitCode = exitCode;
    tool.state = state;
    if (tool.state === "error") record.errors++;
    record.updatedAt = new Date().toISOString();
    this.save();
  }

  finish(traceId: string, state: "answer_returned" | "needs_review"): void {
    if (!this.path) return;
    const record = this.require(traceId);
    record.state = state;
    for (const tool of record.tools) {
      if (tool.state === "pending" || tool.state === "unknown") {
        tool.state = "unknown";
        record.state = "needs_review";
      }
    }
    record.updatedAt = new Date().toISOString();
    this.save();
  }

  private require(traceId: string): TaskRecord {
    const record = this.records.find(candidate => candidate.traceId === traceId);
    if (!record) throw new Error("COS task record is missing");
    return record;
  }
}

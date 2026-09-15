import { test, expect } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { TaskRecords } from "../src/adapters/chatgpt-web/task-records";

test("task receipts survive restart, isolate tasks and fence uncertain replay", () => {
  const root = mkdtempSync(join(tmpdir(), "cos-task-records-"));
  const path = join(root, "records.json");
  try {
    const records = TaskRecords.forPath(path);
    records.begin("trace_first", "thread_first", "turn_first", "chatgpt-web/high");
    const secondAdapter = TaskRecords.forPath(path);
    expect(secondAdapter).toBe(records);
    secondAdapter.begin("trace_second", "thread_second", "turn_second", "chatgpt-web/high");
    expect(JSON.parse(readFileSync(path, "utf8")).records[0].state).toBe("running");
    records.dispatch("trace_first", [{
      callId: "call_first", wireName: "apply_patch", freeform: true, input: "PRIVATE PATCH CONTENT",
    }]);
    const restarted = new TaskRecords(path);
    const stored = JSON.parse(readFileSync(path, "utf8"));
    expect(stored.records[0].state).toBe("needs_review");
    expect(stored.records[0].tools[0].state).toBe("unknown");
    expect(stored.records[1].tools).toEqual([]);
    expect(readFileSync(path, "utf8")).not.toContain("PRIVATE PATCH CONTENT");
    expect(() => restarted.begin("trace_first", "thread_first", "turn_first", "chatgpt-web/high"))
      .toThrow("must not run again automatically");
    expect(() => restarted.discardUnsubmitted("trace_first")).toThrow("possible tool effects");
    restarted.begin("trace_recovery", "thread_first", "turn_recovery", "chatgpt-web/high");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("tool receipts preserve explicit errors and never call a returned result success", () => {
  const root = mkdtempSync(join(tmpdir(), "cos-task-outcome-"));
  const path = join(root, "records.json");
  try {
    const records = new TaskRecords(path);
    records.begin("trace_result", "thread_result", "turn_result", "chatgpt-web/high");
    records.dispatch("trace_result", ["call_failed", "call_returned"].map(callId => ({
      callId, wireName: "exec_command", freeform: false,
    })));
    records.complete("trace_result", "call_failed", {
      content: [{ type: "text", text: "PRIVATE OUTPUT" }], structuredContent: { exit_code: 1 },
    });
    records.complete("trace_result", "call_returned", { content: [], isError: false });
    records.complete("trace_result", "call_failed", { content: [], structuredContent: { exit_code: 1 } });
    expect(() => records.complete("trace_result", "call_failed", { content: [], structuredContent: { exit_code: 0 } }))
      .toThrow("conflicting tool results");
    records.finish("trace_result", "answer_returned");
    const record = JSON.parse(readFileSync(path, "utf8")).records[0];
    expect(record.tools.map((tool: { state: string }) => tool.state)).toEqual(["error", "returned"]);
    expect(record.errors).toBe(1);
    expect(record.totalCalls).toBe(2);
    expect(readFileSync(path, "utf8")).not.toContain("PRIVATE OUTPUT");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("native text receipts preserve exit codes without interpreting command output as a receipt", () => {
  const root = mkdtempSync(join(tmpdir(), "cos-task-text-outcome-"));
  const path = join(root, "records.json");
  try {
    const records = new TaskRecords(path);
    records.begin("trace_text", "thread_text", "turn_text", "chatgpt-web/pro");
    const failed = "Chunk ID: abc123\nWall time: 0.12 seconds\nProcess exited with code 1\nOutput:\nPRIVATE OUTPUT";
    const returned = "Exit code: 0\nWall time: 0 seconds\nOutput:\nPRIVATE PATCH OUTPUT";
    records.dispatch("trace_text", [
      { callId: "call_command", wireName: "functions__exec_command", freeform: false },
      { callId: "call_patch", wireName: "apply_patch", freeform: true },
      { callId: "call_running", wireName: "write_stdin", freeform: false },
      { callId: "call_other", wireName: "read", freeform: false },
    ]);
    records.complete("trace_text", "call_command", { content: [{ type: "text", text: failed }] });
    records.complete("trace_text", "call_patch", { content: [{ type: "text", text: returned }] });
    records.complete("trace_text", "call_running", {
      content: [{ type: "text", text: `Chunk ID: abc123\nWall time: 10 seconds\nProcess running with session ID 97555\nOutput:\n${failed}` }],
    });
    records.complete("trace_text", "call_other", { content: [{ type: "text", text: failed }] });
    records.complete("trace_text", "call_command", { content: [{ type: "text", text: failed }] });
    const saved = readFileSync(path, "utf8");
    const record = JSON.parse(saved).records[0];
    expect(record.tools.map((tool: { exitCode: number | null }) => tool.exitCode)).toEqual([1, 0, null, null]);
    expect(record.errors).toBe(1);
    expect(saved).not.toContain("PRIVATE");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

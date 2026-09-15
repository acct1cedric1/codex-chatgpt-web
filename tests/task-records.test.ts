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

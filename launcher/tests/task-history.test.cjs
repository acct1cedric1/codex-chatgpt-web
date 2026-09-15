const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { readTaskHistory, recoveryBrief } = require("../electron/task-history.cjs");

test("task history strips private fields and shows dead-owner calls as uncertain", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cos-receipts-"));
  try {
    assert.deepEqual(readTaskHistory(root), []);
    fs.mkdirSync(path.join(root, "runtime"));
    fs.writeFileSync(path.join(root, "runtime", "task-records.json"), JSON.stringify({
      version: 1, pid: null, records: [{
        traceId: "trace_example", threadId: "thread_example", turnId: "turn_example",
        model: "chatgpt-web/high", state: "running",
        startedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        totalCalls: 1, errors: 0, prompt: "PRIVATE PROMPT",
        tools: [{ id: "call_example", name: "apply_patch", state: "pending", exitCode: null, input: "PRIVATE PATCH" }],
      }],
    }));
    const records = readTaskHistory(root);
    assert.equal(records[0].state, "needs_review");
    assert.equal(records[0].tools[0].state, "unknown");
    assert.doesNotMatch(JSON.stringify(records), /PRIVATE/);
    const brief = recoveryBrief(root, "trace_example");
    assert.match(brief, /thread_example/);
    assert.match(brief, /Do not repeat it without checking/);
    assert.doesNotMatch(brief, /PRIVATE/);
    assert.throws(() => recoveryBrief(root, "../outside"), /Invalid/);
  } finally {
    fs.rmSync(root, { recursive: true });
  }
});

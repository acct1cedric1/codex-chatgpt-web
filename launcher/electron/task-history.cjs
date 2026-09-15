const fs = require("node:fs");
const path = require("node:path");

const validId = value => typeof value === "string" && /^[A-Za-z0-9_-]{6,128}$/.test(value);
const validName = value => typeof value === "string" && /^[A-Za-z0-9_./:-]{1,160}$/.test(value);

// The renderer receives only this projection. Never copy arbitrary stored fields.
function readTaskHistory(coreHome) {
  const file = path.join(coreHome, "runtime", "task-records.json");
  let payload;
  try {
    if (fs.statSync(file).size > 8 * 1024 * 1024) throw new Error("Task history exceeds its size limit");
    payload = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  if (payload?.version !== 1 || !Array.isArray(payload.records) || payload.records.length > 200) {
    throw new Error("Task history is invalid. Keep the file for recovery.");
  }
  let ownerAlive = false;
  if (Number.isSafeInteger(payload.pid) && payload.pid > 0) {
    try { process.kill(payload.pid, 0); ownerAlive = true; } catch {}
  }
  return payload.records.map(record => {
    if (!record || !validId(record.traceId) || !validId(record.turnId)
      || (record.threadId !== null && !validId(record.threadId)) || !validName(record.model)
      || !["running", "answer_returned", "needs_review"].includes(record.state)
      || !Number.isFinite(Date.parse(record.startedAt)) || !Number.isFinite(Date.parse(record.updatedAt))
      || !Number.isSafeInteger(record.totalCalls) || record.totalCalls < 0
      || !Number.isSafeInteger(record.errors) || record.errors < 0
      || !Array.isArray(record.tools) || record.tools.length > 64) {
      throw new Error("A task record is invalid. Keep the file for recovery.");
    }
    const state = record.state === "running" && !ownerAlive ? "needs_review" : record.state;
    return {
      traceId: record.traceId, threadId: record.threadId, turnId: record.turnId,
      model: record.model, state, startedAt: record.startedAt, updatedAt: record.updatedAt,
      totalCalls: record.totalCalls, errors: record.errors,
      tools: record.tools.map(tool => {
        if (!tool || !validId(tool.id) || !validName(tool.name)
          || !["pending", "returned", "error", "unknown"].includes(tool.state)
          || (tool.exitCode !== null && !Number.isSafeInteger(tool.exitCode))) {
          throw new Error("A task tool record is invalid. Keep the file for recovery.");
        }
        return {
          id: tool.id, name: tool.name, exitCode: tool.exitCode,
          state: tool.state === "pending" && !ownerAlive ? "unknown" : tool.state,
        };
      }),
    };
  }).reverse();
}

function recoveryBrief(coreHome, traceId) {
  if (!validId(traceId)) throw new Error("Invalid task record ID");
  const record = readTaskHistory(coreHome).find(item => item.traceId === traceId);
  if (!record) throw new Error("Task record is no longer available");
  return [
    "COS Workbench task recovery",
    `Native task: ${record.threadId ?? "unavailable"}`,
    `Native turn: ${record.turnId}`,
    `Record: ${record.traceId}`,
    `State: ${record.state}; ${record.totalCalls} calls recorded; ${record.errors} explicit tool errors.`,
    "Inspect this native task's history and the affected workspace before taking further action.",
    "A returned result does not prove the requested change is correct.",
    "An unknown result may have taken effect. Do not repeat it without checking.",
    "These receipts contain no task instructions, arguments or output. They are not a replacement for native task history.",
    ...record.tools.map(tool => `${tool.id}: ${tool.name} — ${tool.state}${tool.exitCode === null ? "" : ` (exit ${tool.exitCode})`}`),
  ].join("\n");
}

module.exports = { readTaskHistory, recoveryBrief };

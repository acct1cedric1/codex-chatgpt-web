# COS development fork

This fork explores reliable, long-running work through ChatGPT and Codex.
It starts from upstream v5.0.6 at
[`e85e3693fdb4e3e033348c08df0298c20fcdb612`](https://github.com/miuuyy/codex-chatgpt-web/commit/e85e3693fdb4e3e033348c08df0298c20fcdb612).
The upstream MIT license and attribution remain intact.

This is a development branch. There is no COS installer or validated release.
The upstream installation commands do not install these changes.

## First implemented change

Fallback compaction can need a smaller prompt when the retained source chat is
unavailable. Upstream removes the oldest history entries until the prompt fits.
That can remove the cumulative checkpoint from an earlier compaction. The new
summary then loses the original task state.

This fork changes the existing prompt compiler:

- Retain readable cumulative checkpoints in their original order.
- Retain the final compaction instruction.
- Remove other old entries only as needed. Rebuild attachment references.
- State how many history entries were omitted. Do not describe trimmed context
  as complete.
- Return an error when retained checkpoints and the final instruction cannot
  fit. Do not silently discard the checkpoints.

Normal turns and multipart compaction keep their existing behavior. This change
protects recognized native checkpoint messages. It does not preserve every raw
history entry, prove the accuracy of a model-written summary, or provide restart
recovery for an interrupted tool.

The regression uses both string and text-part checkpoints. A second regression
checks an oversized checkpoint. Both fail on the unmodified upstream compiler.
The first loses the original scope. The second incorrectly succeeds after
discarding the checkpoint. Both pass with this change.

This issue was also reported in
[upstream issue 447](https://github.com/miuuyy/codex-chatgpt-web/issues/447).

## Validation on 2026-09-15

Environment: Windows x64, Bun 1.4.0, frozen upstream lockfiles.

| Check | Result |
| --- | --- |
| Two new regressions against the upstream compiler | Both fail as expected |
| Prompt contract, v1 compaction, and browser compaction recovery tests | 30 pass, 0 fail |
| Core and launcher TypeScript checks | Pass |
| Version synchronization | Pass |
| Launcher tests | 293 pass, 1 fail, 2 skip |
| Full `bun run verify` | Stops at dependency audit |
| Earlier combined core baseline | Stalls during retained-compaction tests; stopped |
| Authenticated ChatGPT, real Codex tools, packaged installation | Not tested |

The launcher failure is `EPERM` while an existing update-recovery test creates
a Windows file symlink. The dependency audit reports three moderate advisories
for the pinned transitive dependency `hono@4.12.34`. These are unresolved
validation limits. The fork does not claim that those dependencies are reachable
through a particular attack path.

The retained-compaction stall occurred after the broker logged completion of
the active invocation. Its cause is not established. It occurred before the
compiler change. No broker code is changed in this branch.

## Next product slice

Build a task record that separates accepted requests, returned tool results,
verified effects, failed actions, and unknown outcomes. Bind every record to its
actual task and turn. Keep private context local. Export only explicit safe
fields for diagnostics.

Recovery must inspect the current workspace and recorded effects before a new
attempt. A lost connection must not automatically repeat a file write. A
transport completion must not be presented as successful task completion.

Keep Codex as the owner of tool execution, approvals, and command sessions.
Browser drift, unavailable account features, and service refusals remain
explicit failures. Do not infer a safety refusal from arbitrary text or change
routes to evade a refusal.

These are planned requirements. They are not implemented by the checkpoint fix.
Live account tests and the upstream release gates remain required before a
replacement or release claim.
